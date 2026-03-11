/**
 * GET /api/referral/my-code
 * Returns the authenticated user's referral code + redemption summary.
 * Creates a code on-demand if none exists (all authenticated users may share).
 */
import { NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { apiUnauthorized, apiServerError } from '@/lib/api/error-response';

function generateCode(userId: string): string {
  // Deterministic prefix + 8 hex chars derived from userId
  const hash = Buffer.from(userId.replace(/-/g, '')).toString('hex').slice(0, 8).toUpperCase();
  return `WM-${hash}`;
}

export async function GET() {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return apiUnauthorized();
  }

  // Fetch existing referral code
  const { data: existing, error: fetchError } = await supabase
    .from('referral_codes')
    .select('id, code, uses_count, max_uses, created_at')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (fetchError) {
    return apiServerError('Failed to fetch referral code');
  }

  let referralCode = existing;

  // Auto-create a code if none exists
  if (!referralCode) {
    const service = await getSupabaseServiceClient();
    const code = generateCode(user.id);
    const { data: created, error: createError } = await service
      .from('referral_codes')
      .insert({ profile_id: user.id, code, max_uses: 10 })
      .select('id, code, uses_count, max_uses, created_at')
      .single();

    if (createError) {
      return apiServerError('Failed to create referral code');
    }
    referralCode = created;
  }

  // Fetch redemption history (people who used this code)
  const { data: redemptions } = await supabase
    .from('referral_redemptions')
    .select('id, created_at')
    .eq('referral_code_id', referralCode.id)
    .order('created_at', { ascending: false })
    .limit(20);

  return NextResponse.json({
    code: referralCode.code,
    uses_count: referralCode.uses_count,
    max_uses: referralCode.max_uses,
    created_at: referralCode.created_at,
    redemptions: (redemptions ?? []).map((r) => ({ id: r.id, redeemed_at: r.created_at })),
  });
}
