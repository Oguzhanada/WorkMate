/**
 * GET /api/admin/update-loyalty-levels  (Vercel Cron — runs nightly at 02:00 UTC)
 * POST /api/admin/update-loyalty-levels (manual trigger)
 *
 * Recalculates and updates loyalty_level for all customers and providers.
 * Secured via Authorization: Bearer <CRON_SECRET> or <TASK_ALERT_SECRET>.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { computeCustomerLevel, computeProviderLevel } from '@/lib/loyalty/levels';
import { apiUnauthorized } from '@/lib/api/error-response';

async function runUpdate(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET ?? process.env.TASK_ALERT_SECRET;
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!secret || token !== secret) {
    return apiUnauthorized();
  }

  const supabase = getSupabaseServiceClient();
  let updated = 0;
  const errors: string[] = [];

  // --- Update customers ---
  const { data: customers } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'customer');

  for (const row of customers ?? []) {
    try {
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id', { count: 'exact', head: false })
        .eq('customer_id', row.user_id)
        .eq('status', 'completed');

      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewee_id', row.user_id);

      const jobCount = (jobs ?? []).length;
      const ratings = (reviews ?? []).map((r) => r.rating as number).filter((r) => r > 0);
      const avgRating = ratings.length > 0 ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 0;

      const level = computeCustomerLevel(jobCount, avgRating);

      await supabase
        .from('profiles')
        .update({ loyalty_level: level })
        .eq('id', row.user_id);

      updated++;
    } catch (err) {
      errors.push(`customer ${row.user_id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // --- Update providers ---
  const { data: providers } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'verified_pro');

  for (const row of providers ?? []) {
    try {
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id')
        .eq('status', 'completed')
        .eq('accepted_quote_id', row.user_id); // approximate: jobs where this provider's quote was accepted

      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewee_id', row.user_id);

      const jobCount = (jobs ?? []).length;
      const ratings = (reviews ?? []).map((r) => r.rating as number).filter((r) => r > 0);
      const avgRating = ratings.length > 0 ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 0;

      const level = computeProviderLevel(jobCount, avgRating);

      await supabase
        .from('profiles')
        .update({ loyalty_level: level })
        .eq('id', row.user_id);

      updated++;
    } catch (err) {
      errors.push(`provider ${row.user_id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({
    updated,
    error_count: errors.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}

export const GET = runUpdate;
export const POST = runUpdate;
