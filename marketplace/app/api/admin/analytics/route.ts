import { NextRequest, NextResponse } from 'next/server';
import { canAccessAdmin, getUserRoles } from '@/lib/auth/rbac';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { apiUnauthorized, apiForbidden } from '@/lib/api/error-response';

export async function GET(request: NextRequest) {
  // Auth + admin guard
  const supabase = await getSupabaseRouteClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return apiUnauthorized();

  const roles = await getUserRoles(supabase, user.id);
  if (!canAccessAdmin(roles)) return apiForbidden();

  // Use service client for aggregations (bypasses RLS safely — admin-only endpoint)
  const svc = getSupabaseServiceClient();

  const url = new URL(request.url);
  const days = Math.min(90, Math.max(7, Number(url.searchParams.get('days') ?? '30')));

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [
    totalJobsRes,
    activeJobsRes,
    completedJobsRes,
    revenueRes,
    verifiedUsersRes,
    pendingApplicationsRes,
    dailyJobsRes,
    categoryRes,
    topProvidersRes,
    dailyCompletedRes,
    dailyQuotesRes,
  ] = await Promise.all([
    svc.from('jobs').select('id', { count: 'exact', head: true }),
    svc.from('jobs').select('id', { count: 'exact', head: true })
      .in('status', ['open', 'quoted', 'accepted', 'in_progress']),
    svc.from('jobs').select('id', { count: 'exact', head: true })
      .eq('status', 'completed'),
    svc.from('payments').select('amount_cents, commission_cents')
      .eq('status', 'captured'),
    svc.from('profiles').select('id', { count: 'exact', head: true })
      .eq('id_verification_status', 'approved'),
    svc.from('profiles').select('id', { count: 'exact', head: true })
      .eq('verification_status', 'pending'),
    // Daily job counts (last N days) — fetch raw and group in JS
    svc.from('jobs').select('created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: true }),
    // Category breakdown
    svc.from('jobs').select('category')
      .not('category', 'is', null),
    // Top providers from materialized view joined with profiles
    svc.from('provider_rankings')
      .select('provider_id, avg_rating, completed_jobs, ranking_score')
      .order('ranking_score', { ascending: false })
      .limit(10),
    // Daily completed (last N days)
    svc.from('jobs').select('complete_marked_at')
      .eq('status', 'completed')
      .gte('complete_marked_at', since)
      .not('complete_marked_at', 'is', null),
    // Daily quotes submitted (last N days)
    svc.from('quotes').select('created_at')
      .gte('created_at', since),
  ]);

  // Revenue calculations
  const payments = revenueRes.data ?? [];
  const totalRevenueCents = payments.reduce((sum, p) => sum + (p.amount_cents ?? 0), 0);
  const totalCommissionCents = payments.reduce((sum, p) => sum + (p.commission_cents ?? 0), 0);
  const avgJobValueCents = payments.length > 0 ? Math.round(totalRevenueCents / payments.length) : 0;

  // Build daily time series (fill in missing dates with 0)
  const jobsByDate = groupByDate(
    (dailyJobsRes.data ?? []).map((r) => r.created_at),
    days
  );
  const completedByDate = groupByDate(
    (dailyCompletedRes.data ?? []).map((r) => r.complete_marked_at as string),
    days
  );
  const quotesByDate = groupByDate(
    (dailyQuotesRes.data ?? []).map((r) => r.created_at),
    days
  );

  const dateLabels = buildDateRange(days);
  const dailySeries = dateLabels.map((date) => ({
    date,
    jobs: jobsByDate[date] ?? 0,
    completed: completedByDate[date] ?? 0,
    quotes: quotesByDate[date] ?? 0,
  }));

  // Category breakdown
  const catCount: Record<string, number> = {};
  for (const row of categoryRes.data ?? []) {
    const cat = (row.category as string) || 'Other';
    catCount[cat] = (catCount[cat] ?? 0) + 1;
  }
  const totalCats = Object.values(catCount).reduce((s, v) => s + v, 0);
  const categoryBreakdown = Object.entries(catCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([category, count]) => ({
      category,
      count,
      pct: totalCats > 0 ? Math.round((count / totalCats) * 100) : 0,
    }));

  // Top providers — enrich with profile names
  const providerIds = (topProvidersRes.data ?? []).map((r) => r.provider_id);
  let profileNames: Record<string, string> = {};
  if (providerIds.length > 0) {
    const { data: profiles } = await svc
      .from('profiles')
      .select('id, full_name')
      .in('id', providerIds);
    profileNames = Object.fromEntries(
      (profiles ?? []).map((p) => [p.id, p.full_name ?? 'Unknown'])
    );
  }

  const topProviders = (topProvidersRes.data ?? []).map((r) => ({
    provider_id: r.provider_id,
    full_name: profileNames[r.provider_id] ?? 'Unknown',
    avg_rating: Number(r.avg_rating ?? 0),
    completed_jobs: Number(r.completed_jobs ?? 0),
    ranking_score: Number(r.ranking_score ?? 0),
  }));

  return NextResponse.json({
    summary: {
      totalJobs: totalJobsRes.count ?? 0,
      activeJobs: activeJobsRes.count ?? 0,
      completedJobs: completedJobsRes.count ?? 0,
      totalRevenueCents,
      totalCommissionCents,
      avgJobValueCents,
      verifiedUsers: verifiedUsersRes.count ?? 0,
      pendingApplications: pendingApplicationsRes.count ?? 0,
      totalPayments: payments.length,
    },
    dailySeries,
    categoryBreakdown,
    topProviders,
    generatedAt: new Date().toISOString(),
    days,
  });
}

// ── helpers ──

function buildDateRange(days: number): string[] {
  const result: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    result.push(d.toISOString().slice(0, 10));
  }
  return result;
}

function groupByDate(isoStrings: string[], _days: number): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of isoStrings) {
    if (!s) continue;
    const date = s.slice(0, 10);
    counts[date] = (counts[date] ?? 0) + 1;
  }
  return counts;
}
