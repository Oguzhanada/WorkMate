/**
 * GET /api/provider/credits
 * Returns the authenticated provider's credit balance and recent transactions.
 */
import { NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { canQuoteJob, getUserRoles } from '@/lib/auth/rbac';
import { apiUnauthorized, apiForbidden } from '@/lib/api/error-response';

export async function GET() {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  const roles = await getUserRoles(supabase, user.id);
  const { data: profile } = await supabase
    .from('profiles')
    .select('id_verification_status')
    .eq('id', user.id)
    .maybeSingle();

  if (!canQuoteJob(roles, profile?.id_verification_status)) {
    return apiForbidden('Provider account required');
  }

  const serviceSupabase = getSupabaseServiceClient();

  const [{ data: credits }, { data: transactions }] = await Promise.all([
    serviceSupabase
      .from('provider_credits')
      .select('balance, updated_at')
      .eq('provider_id', user.id)
      .maybeSingle(),
    serviceSupabase
      .from('credit_transactions')
      .select('id,amount,reason,reference_id,created_at')
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  return NextResponse.json({
    balance: credits?.balance ?? 0,
    last_updated: credits?.updated_at ?? null,
    transactions: transactions ?? [],
  });
}
