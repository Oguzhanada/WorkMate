import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { funnelSummaryQuerySchema } from '@/lib/validation/api';
import { apiError, apiUnauthorized, apiForbidden, apiServerError } from '@/lib/api/error-response';
import { withRequestId } from '@/lib/request-id/middleware';

// GET /api/analytics/funnel-summary?days=7|30|all
// Admin-only: aggregated funnel step completion counts.
// Returns: { summary: { funnel_name, step_name, step_number, count }[], meta: { days, total_today } }
// Ordered by funnel_name ASC, step_number ASC for easy chart consumption.
export const GET = withRequestId(async function GET(req: NextRequest) {
  const supabase = await getSupabaseRouteClient();

  // Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  // RBAC — admin only
  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (!roleRow) {
    return apiForbidden();
  }

  // Validate query params
  const parsed = funnelSummaryQuerySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) {
    return apiError('Invalid query params', 400);
  }
  const { days } = parsed.data;

  // Build date cutoff for filtering
  let cutoff: string | null = null;
  if (days === '7') {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    cutoff = d.toISOString();
  } else if (days === '30') {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    cutoff = d.toISOString();
  }

  // Fetch raw rows filtered by date (RLS already admin-only)
  let query = supabase
    .from('funnel_events')
    .select('funnel_name, step_name, step_number, created_at');

  if (cutoff) {
    query = query.gte('created_at', cutoff);
  }

  const { data: raw, error: rawError } = await query;

  if (rawError) {
    console.error('[analytics/funnel-summary] query failed:', rawError.message);
    return apiServerError('Could not load funnel data');
  }

  // Aggregate in JS: count per (funnel_name, step_name)
  const groups = new Map<
    string,
    { funnel_name: string; step_name: string; step_number: number; count: number }
  >();

  let totalToday = 0;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  for (const row of raw ?? []) {
    const key = `${row.funnel_name}:${row.step_name}`;
    if (groups.has(key)) {
      groups.get(key)!.count += 1;
    } else {
      groups.set(key, {
        funnel_name: row.funnel_name,
        step_name: row.step_name,
        step_number: row.step_number,
        count: 1,
      });
    }
    if (new Date(row.created_at) >= todayStart) {
      totalToday += 1;
    }
  }

  const summary = Array.from(groups.values()).sort((a, b) => {
    if (a.funnel_name !== b.funnel_name) return a.funnel_name.localeCompare(b.funnel_name);
    return a.step_number - b.step_number;
  });

  return NextResponse.json({ summary, meta: { days, total_today: totalToday } });
});
