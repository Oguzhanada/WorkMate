import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { canQuote, getUserRoles } from '@/lib/auth/rbac';
import { createAccountLinkSchema } from '@/lib/validation/api';
import { stripe } from '@/lib/stripe/client';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiUnauthorized, apiForbidden } from '@/lib/api/error-response';
import { getServiceStatus } from '@/lib/resilience/service-status';

async function postHandler(request: NextRequest) {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  const roles = await getUserRoles(supabase, user.id);
  if (!canQuote(roles)) {
    return apiForbidden('Only professionals can use this endpoint');
  }

  // Early exit if Stripe is known to be down
  if ((await getServiceStatus('stripe')) === 'down') {
    return NextResponse.json(
      { error: 'Payment service temporarily unavailable. Please try again shortly.' },
      { status: 503 }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = createAccountLinkSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiError('Validation failed', 400);
  }

  const { stripe_account_id } = parsed.data;

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.stripe_account_id || profile.stripe_account_id !== stripe_account_id) {
    return apiForbidden('Stripe account mismatch');
  }

  const accountLink = await stripe.accountLinks.create({
    account: stripe_account_id,
    type: 'account_onboarding',
    refresh_url: `${process.env.NEXT_PUBLIC_PLATFORM_BASE_URL}/dashboard/pro?refresh=1`,
    return_url: `${process.env.NEXT_PUBLIC_PLATFORM_BASE_URL}/dashboard/pro?onboarding=done`,
  });

  return NextResponse.json({ url: accountLink.url });
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
