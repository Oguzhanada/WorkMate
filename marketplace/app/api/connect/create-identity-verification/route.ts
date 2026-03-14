import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { createStripeIdentitySchema } from '@/lib/validation/api';
import { stripe } from '@/lib/stripe/client';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiUnauthorized } from '@/lib/api/error-response';
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

  // Early exit if Stripe is known to be down
  if ((await getServiceStatus('stripe')) === 'down') {
    return NextResponse.json(
      { error: 'Payment service temporarily unavailable. Please try again shortly.' },
      { status: 503 }
    );
  }

  let rawBody: unknown = {};
  try {
    rawBody = await request.json();
  } catch {
    rawBody = {};
  }

  const parsed = createStripeIdentitySchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiError('Validation failed', 400);
  }

  const fallbackReturn = `${process.env.NEXT_PUBLIC_PLATFORM_BASE_URL ?? 'http://localhost:3000'}/profile`;
  const returnUrl = parsed.data.return_url ?? fallbackReturn;

  const session = await stripe.identity.verificationSessions.create({
    type: 'document',
    return_url: returnUrl,
    metadata: {
      user_id: user.id,
    },
    options: {
      document: {
        require_live_capture: true,
        require_matching_selfie: true,
      },
    },
  });

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      stripe_identity_session_id: session.id,
      stripe_identity_status: 'processing',
      id_verification_method: 'stripe_identity',
    })
    .eq('id', user.id);

  if (profileError) {
    return apiError(profileError.message, 400);
  }

  return NextResponse.json(
    {
      session_id: session.id,
      status: session.status,
      url: session.url,
      client_secret: session.client_secret,
    },
    { status: 200 }
  );
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
