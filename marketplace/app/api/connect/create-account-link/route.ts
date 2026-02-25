import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { canQuote, getUserRoles } from '@/lib/auth/rbac';
import { createAccountLinkSchema } from '@/lib/validation/api';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = await getUserRoles(supabase, user.id);
  if (!canQuote(roles)) {
    return NextResponse.json({ error: 'Only professionals can use this endpoint' }, { status: 403 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createAccountLinkSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { stripe_account_id } = parsed.data;

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.stripe_account_id || profile.stripe_account_id !== stripe_account_id) {
    return NextResponse.json({ error: 'Stripe account mismatch' }, { status: 403 });
  }

  const accountLink = await stripe.accountLinks.create({
    account: stripe_account_id,
    type: 'account_onboarding',
    refresh_url: `${process.env.NEXT_PUBLIC_PLATFORM_BASE_URL}/dashboard/pro?refresh=1`,
    return_url: `${process.env.NEXT_PUBLIC_PLATFORM_BASE_URL}/dashboard/pro?onboarding=done`,
  });

  return NextResponse.json({ url: accountLink.url });
}
