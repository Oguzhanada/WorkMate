/**
 * GET /api/admin/grant-monthly-credits  (Vercel Cron — runs 1st of each month at 00:05 UTC)
 * POST /api/admin/grant-monthly-credits (manual trigger)
 *
 * Grants free monthly credits to all active providers based on their subscription plan.
 * Secured via Authorization: Bearer <CRON_SECRET> (Vercel) or <TASK_ALERT_SECRET> (manual).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { grantMonthlyCredits, MONTHLY_CREDITS_BY_PLAN } from '@/lib/credits/provider-credits';
import { apiUnauthorized } from '@/lib/api/error-response';

type Plan = keyof typeof MONTHLY_CREDITS_BY_PLAN;
const VALID_PLANS = new Set<string>(['basic', 'professional', 'premium']);

async function runGrant(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET ?? process.env.TASK_ALERT_SECRET;
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!secret || token !== secret) {
    return apiUnauthorized();
  }

  const supabase = getSupabaseServiceClient();

  // Get all providers with active subscriptions
  const { data: subscriptions } = await supabase
    .from('provider_subscriptions')
    .select('provider_id,plan')
    .eq('status', 'active');

  // Get all verified_pro users without an active subscription (they get basic plan credits)
  const { data: proRoles } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'verified_pro');

  const subscribedProviderIds = new Set((subscriptions ?? []).map((s) => s.provider_id));

  const results: { providerId: string; plan: Plan; granted: number }[] = [];
  const errors: string[] = [];

  // Grant credits for subscribed providers
  for (const sub of subscriptions ?? []) {
    const plan: Plan = VALID_PLANS.has(sub.plan) ? (sub.plan as Plan) : 'basic';
    try {
      const { granted } = await grantMonthlyCredits(sub.provider_id, plan);
      results.push({ providerId: sub.provider_id, plan, granted });
    } catch (err) {
      errors.push(`${sub.provider_id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Grant basic plan credits to providers without an active subscription
  for (const role of proRoles ?? []) {
    if (subscribedProviderIds.has(role.user_id)) continue;
    try {
      const { granted } = await grantMonthlyCredits(role.user_id, 'basic');
      results.push({ providerId: role.user_id, plan: 'basic', granted });
    } catch (err) {
      errors.push(`${role.user_id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({
    granted_count: results.length,
    error_count: errors.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}

export const GET = runGrant;
export const POST = runGrant;
