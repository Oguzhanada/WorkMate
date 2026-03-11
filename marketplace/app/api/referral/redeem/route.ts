/**
 * POST /api/referral/redeem
 * Redeems a referral code for the authenticated user.
 * - Validates the code exists and has uses remaining
 * - Ensures the user hasn't already redeemed it
 * - Creates a referral_redemption record
 * - Grants 10 bonus credits to the referrer
 * - Increments uses_count on the referral code
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { redeemReferralSchema } from '@/lib/validation/api';
import { adjustCredits } from '@/lib/credits/provider-credits';

const REFERRER_BONUS_CREDITS = 10;

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = redeemReferralSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { code } = parsed.data;
  const serviceSupabase = getSupabaseServiceClient();

  // Find the referral code
  const { data: referralCode } = await serviceSupabase
    .from('referral_codes')
    .select('id,profile_id,uses_count,max_uses')
    .eq('code', code)
    .maybeSingle();

  if (!referralCode) {
    return NextResponse.json({ error: 'Invalid referral code.' }, { status: 404 });
  }

  // Cannot redeem your own referral code
  if (referralCode.profile_id === user.id) {
    return NextResponse.json({ error: 'You cannot redeem your own referral code.' }, { status: 400 });
  }

  // Check if uses remaining
  if (referralCode.uses_count >= referralCode.max_uses) {
    return NextResponse.json({ error: 'This referral code has reached its usage limit.' }, { status: 400 });
  }

  // Check if user has already redeemed this code
  const { data: existingRedemption } = await serviceSupabase
    .from('referral_redemptions')
    .select('id')
    .eq('referral_code_id', referralCode.id)
    .eq('redeemed_by', user.id)
    .maybeSingle();

  if (existingRedemption) {
    return NextResponse.json({ error: 'You have already redeemed this referral code.' }, { status: 409 });
  }

  // Create redemption record
  const { error: insertError } = await serviceSupabase
    .from('referral_redemptions')
    .insert({ referral_code_id: referralCode.id, redeemed_by: user.id });

  if (insertError) {
    return NextResponse.json({ error: 'Failed to redeem code. Please try again.' }, { status: 500 });
  }

  // Increment uses_count
  await serviceSupabase
    .from('referral_codes')
    .update({ uses_count: referralCode.uses_count + 1 })
    .eq('id', referralCode.id);

  // Grant bonus credits to the referrer (non-blocking)
  void adjustCredits(
    referralCode.profile_id,
    REFERRER_BONUS_CREDITS,
    'admin_adjustment',
    referralCode.id
  ).catch(() => {
    // Credit grant failure does not invalidate the redemption
  });

  return NextResponse.json(
    { success: true, message: 'Referral code redeemed! The referring provider has received bonus credits.' },
    { status: 200 }
  );
}
