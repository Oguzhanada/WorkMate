import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminRoute } from '@/lib/auth/admin';
import { apiError } from '@/lib/api/error-response';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';

async function getHandler(_request: NextRequest) {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  const { supabase } = auth;

  const { data, error } = await supabase
    .from('jobs')
    .select('id,title,description,category,county,locality,budget_range,status,review_status,rejection_reason,created_at,customer_id,photo_urls')
    .eq('review_status', 'pending_review')
    .order('created_at', { ascending: true });

  if (error) {
    return apiError(error.message, 400);
  }

  const customerIds = Array.from(new Set((data ?? []).map((row) => row.customer_id)));
  const { data: customers } =
    customerIds.length > 0
      ? await supabase.from('profiles').select('id,full_name').in('id', customerIds)
      : { data: [] as Array<{ id: string; full_name: string | null }> };

  const customerNameById = new Map((customers ?? []).map((row) => [row.id, row.full_name]));
  const now = Date.now();
  const SLA_HOURS = 24;

  const jobs = (data ?? []).map((row) => {
    const hoursPending = Math.floor((now - new Date(row.created_at).getTime()) / (1000 * 60 * 60));
    return {
      ...row,
      customer_name: customerNameById.get(row.customer_id) ?? null,
      hours_pending: hoursPending,
      is_overdue: hoursPending >= SLA_HOURS,
    };
  });

  return NextResponse.json({ jobs }, { status: 200 });
}

export const GET = withRateLimit(RATE_LIMITS.ADMIN_READ, getHandler);
