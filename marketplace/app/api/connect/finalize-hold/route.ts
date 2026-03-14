import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { canPostJob, getUserRoles } from '@/lib/auth/rbac';
import { finalizeHoldSchema } from '@/lib/validation/api';
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
  if (!canPostJob(roles)) {
    return apiForbidden('Only customers can finalize secure hold');
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

  const parsed = finalizeHoldSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiError('Validation failed', 400);
  }

  const checkoutSession = await stripe.checkout.sessions.retrieve(parsed.data.checkout_session_id, {
    expand: ['payment_intent'],
  });

  if (checkoutSession.payment_status !== 'paid') {
    return apiError('Payment is not completed in checkout', 400);
  }

  const metadata = checkoutSession.metadata ?? {};
  const customerId = metadata.customer_id;
  const quoteId = metadata.quote_id;
  const jobId = metadata.job_id;
  const proId = metadata.pro_id;

  if (!customerId || !quoteId || !jobId || !proId) {
    return apiError('Checkout metadata is incomplete', 400);
  }

  if (customerId !== user.id) {
    return apiForbidden('Customer mismatch');
  }

  const paymentIntentId =
    typeof checkoutSession.payment_intent === 'string'
      ? checkoutSession.payment_intent
      : checkoutSession.payment_intent?.id;

  if (!paymentIntentId) {
    return apiError('Payment intent not found', 400);
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (paymentIntent.status !== 'requires_capture') {
    return apiError(`Payment intent is not in hold state: ${paymentIntent.status}`, 400);
  }

  const amountCents = paymentIntent.amount;
  const commissionCents = Number(paymentIntent.metadata?.commission ?? 0);

  const serviceSupabase = getSupabaseServiceClient();

  const { error: upsertError } = await serviceSupabase
    .from('payments')
    .upsert(
      {
        job_id: jobId,
        quote_id: quoteId,
        customer_id: customerId,
        pro_id: proId,
        stripe_payment_intent_id: paymentIntent.id,
        amount_cents: amountCents,
        commission_cents: commissionCents,
        status: 'authorized',
        auto_release_eligible: true,
      },
      { onConflict: 'stripe_payment_intent_id' }
    );

  if (upsertError) {
    return apiError(upsertError.message, 400);
  }

  const { error: jobUpdateError } = await serviceSupabase
    .from('jobs')
    .update({ status: 'in_progress' })
    .eq('id', jobId)
    .eq('customer_id', user.id)
    .eq('accepted_quote_id', quoteId);

  if (jobUpdateError) {
    return apiError(jobUpdateError.message, 400);
  }

  return NextResponse.json({
    status: 'authorized',
    payment_intent_id: paymentIntent.id,
    amount_cents: amountCents,
  });
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
