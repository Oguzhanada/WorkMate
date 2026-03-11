import { NextRequest, NextResponse } from 'next/server';

import { ensureAdminRoute } from '@/lib/auth/admin';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { adminStatsQuerySchema } from '@/lib/validation/api';
import { apiError } from '@/lib/api/error-response';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlatformStats = {
  users: {
    total: number;
    new_this_week: number;
    new_this_month: number;
  };
  providers: {
    total: number;
    verified: number;
    pending: number;
    new_this_month: number;
  };
  jobs: {
    total: number;
    open: number;
    in_progress: number;
    completed: number;
    this_month: number;
  };
  appointments: {
    total: number;
    upcoming: number;
    this_month: number;
  };
  reviews: {
    total: number;
    avg_rating: number;
  };
  revenue: {
    total_stripe_captured: number;
  };
};

export type MonthlyDataPoint = {
  month: string;
  new_users: number;
  new_jobs: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoWeekAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
}

function isoMonthAgo(): string {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// ─── Monthly growth query (raw SQL via RPC is unavailable here,
//     so we pull created_at per row and group in JS) ─────────────────────────
async function fetchMonthlyGrowth(): Promise<MonthlyDataPoint[]> {
  const svc = getSupabaseServiceClient();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);
  const cutoff = sixMonthsAgo.toISOString();

  const [usersResult, jobsResult] = await Promise.all([
    svc
      .from('profiles')
      .select('created_at')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: true })
      .limit(10000),
    svc
      .from('jobs')
      .select('created_at')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: true })
      .limit(10000),
  ]);

  // Build month buckets for the last 6 months
  const buckets: Record<string, { new_users: number; new_jobs: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets[key] = { new_users: 0, new_jobs: 0 };
  }

  for (const row of usersResult.data ?? []) {
    const d = new Date(row.created_at as string);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (buckets[key]) buckets[key].new_users++;
  }

  for (const row of jobsResult.data ?? []) {
    const d = new Date(row.created_at as string);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (buckets[key]) buckets[key].new_jobs++;
  }

  return Object.entries(buckets).map(([month, counts]) => ({
    month,
    ...counts,
  }));
}

// ─── Route Handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  const parsed = adminStatsQuerySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) {
    return apiError('Invalid query parameters', 400);
  }

  const { monthly } = parsed.data;

  // Monthly growth mode — return time-series data only
  if (monthly === 'true') {
    const data = await fetchMonthlyGrowth();
    return NextResponse.json(data, { status: 200 });
  }

  // ── Full platform stats ──────────────────────────────────────────────────────
  const svc = getSupabaseServiceClient();
  const weekAgo = isoWeekAgo();
  const monthStart = isoMonthAgo();
  const now = new Date().toISOString();

  const [
    totalUsersRes,
    newUsersWeekRes,
    newUsersMonthRes,
    verifiedProvidersRes,
    pendingProvidersRes,
    newProvidersMonthRes,
    totalJobsRes,
    openJobsRes,
    inProgressJobsRes,
    completedJobsRes,
    jobsThisMonthRes,
    totalAppointmentsRes,
    upcomingAppointmentsRes,
    appointmentsThisMonthRes,
    totalReviewsRes,
    avgRatingRes,
    revenueRes,
  ] = await Promise.all([
    // Users
    svc.from('profiles').select('id', { count: 'exact', head: true }),
    svc.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
    svc.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
    // Providers — verified_pro in user_roles
    svc.from('user_roles').select('user_id', { count: 'exact', head: true }).eq('role', 'verified_pro'),
    // Pending: profiles with verification_status = pending that have applied (pro role or pending verification)
    svc
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('verification_status', 'pending'),
    // New providers this month (any user_roles verified_pro created this month)
    svc
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('verification_status', 'verified')
      .gte('created_at', monthStart),
    // Jobs
    svc.from('jobs').select('id', { count: 'exact', head: true }),
    svc.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    svc.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
    svc.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    svc.from('jobs').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
    // Appointments
    svc.from('appointments').select('id', { count: 'exact', head: true }),
    svc
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'scheduled')
      .gte('start_time', now),
    svc.from('appointments').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
    // Reviews
    svc.from('reviews').select('id', { count: 'exact', head: true }).eq('is_public', true),
    // Avg rating — select column, compute in JS to avoid RPC
    svc.from('reviews').select('overall_rating').eq('is_public', true).limit(10000),
    // Revenue — provider_subscriptions with active paid plans
    svc
      .from('provider_subscriptions')
      .select('plan, status')
      .eq('status', 'active')
      .neq('plan', 'basic'),
  ]);

  // Compute avg rating in JS
  const ratings = (avgRatingRes.data ?? [])
    .map((r) => Number(r.overall_rating))
    .filter((n) => !isNaN(n) && n > 0);
  const avgRating =
    ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : 0;

  // Revenue: count of active paid subscriptions (proxy until Stripe revenue is synced)
  const activePaidSubs = (revenueRes.data ?? []).length;

  const stats: PlatformStats = {
    users: {
      total: totalUsersRes.count ?? 0,
      new_this_week: newUsersWeekRes.count ?? 0,
      new_this_month: newUsersMonthRes.count ?? 0,
    },
    providers: {
      total: verifiedProvidersRes.count ?? 0,
      verified: verifiedProvidersRes.count ?? 0,
      pending: pendingProvidersRes.count ?? 0,
      new_this_month: newProvidersMonthRes.count ?? 0,
    },
    jobs: {
      total: totalJobsRes.count ?? 0,
      open: openJobsRes.count ?? 0,
      in_progress: inProgressJobsRes.count ?? 0,
      completed: completedJobsRes.count ?? 0,
      this_month: jobsThisMonthRes.count ?? 0,
    },
    appointments: {
      total: totalAppointmentsRes.count ?? 0,
      upcoming: upcomingAppointmentsRes.count ?? 0,
      this_month: appointmentsThisMonthRes.count ?? 0,
    },
    reviews: {
      total: totalReviewsRes.count ?? 0,
      avg_rating: avgRating,
    },
    revenue: {
      total_stripe_captured: activePaidSubs,
    },
  };

  return NextResponse.json(stats, { status: 200 });
}
