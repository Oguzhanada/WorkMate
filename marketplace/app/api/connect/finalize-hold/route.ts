import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { canPostJob, getUserRoles } from '@/lib/auth/rbac';
import { finalizeHoldSchema } from '@/lib/validation/api';
import { stripe } from '@/lib/stripe';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';

async function postHandler(request: NextRequest) {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = await getUserRoles(supabase, user.id);
  if (!canPostJob(roles)) {
    return NextResponse.json({ error: 'Only customers can finalize secure hold' }, { status: 403 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = finalizeHoldSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const checkoutSession = await stripe.checkout.sessions.retrieve(parsed.data.checkout_session_id, {
    expand: ['payment_intent'],
  });

  if (checkoutSession.payment_status !== 'paid') {
    return NextResponse.json({ error: 'Payment is not completed in checkout' }, { status: 400 });
  }

  const metadata = checkoutSession.metadata ?? {};
  const customerId = metadata.customer_id;
  const quoteId = metadata.quote_id;
  const jobId = metadata.job_id;
  const proId = metadata.pro_id;

  if (!customerId || !quoteId || !jobId || !proId) {
    return NextResponse.json({ error: 'Checkout metadata is incomplete' }, { status: 400 });
  }

  if (customerId !== user.id) {
    return NextResponse.json({ error: 'Customer mismatch' }, { status: 403 });
  }

  const paymentIntentId =
    typeof checkoutSession.payment_intent === 'string'
      ? checkoutSession.payment_intent
      : checkoutSession.payment_intent?.id;

  if (!paymentIntentId) {
    return NextResponse.json({ error: 'Payment intent not found' }, { status: 400 });
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (paymentIntent.status !== 'requires_capture') {
    return NextResponse.json(
      { error: `Payment intent is not in hold state: ${paymentIntent.status}` },
      { status: 400 }
    );
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
    return NextResponse.json({ error: upsertError.message }, { status: 400 });
  }

  const { error: jobUpdateError } = await serviceSupabase
    .from('jobs')
    .update({ status: 'in_progress' })
    .eq('id', jobId)
    .eq('customer_id', user.id)
    .eq('accepted_quote_id', quoteId);

  if (jobUpdateError) {
    return NextResponse.json({ error: jobUpdateError.message }, { status: 400 });
  }

  return NextResponse.json({
    status: 'authorized',
    payment_intent_id: paymentIntent.id,
    amount_cents: amountCents,
  });
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
