import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminRoute } from '@/lib/auth/admin';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { disputeProcessPaymentSchema } from '@/lib/validation/api';
import { stripe } from '@/lib/stripe/client';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  const { id } = await params;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = disputeProcessPaymentSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const serviceSupabase = getSupabaseServiceClient();
  const { data: dispute } = await serviceSupabase
    .from('disputes')
    .select('id,job_id,payment_intent_id,status')
    .eq('id', id)
    .maybeSingle();

  if (!dispute?.payment_intent_id) {
    return NextResponse.json({ error: 'Dispute payment intent is missing.' }, { status: 400 });
  }

  let stripeResult: { id: string; status: string } | null = null;
  let paymentStatus = 'on_hold';

  if (parsed.data.action === 'capture_full') {
    const intent = await stripe.paymentIntents.capture(dispute.payment_intent_id);
    stripeResult = { id: intent.id, status: intent.status };
    paymentStatus = 'released_to_provider';
  }

  if (parsed.data.action === 'capture_partial') {
    if (!parsed.data.amount_cents) {
      return NextResponse.json({ error: 'amount_cents is required for partial capture.' }, { status: 400 });
    }
    const intent = await stripe.paymentIntents.capture(dispute.payment_intent_id, {
      amount_to_capture: parsed.data.amount_cents,
    });
    stripeResult = { id: intent.id, status: intent.status };
    paymentStatus = 'split';
  }

  if (parsed.data.action === 'refund_full') {
    const refund = await stripe.refunds.create({ payment_intent: dispute.payment_intent_id });
    stripeResult = { id: refund.id, status: refund.status ?? 'succeeded' };
    paymentStatus = 'refunded_to_customer';
  }

  if (parsed.data.action === 'refund_partial') {
    if (!parsed.data.amount_cents) {
      return NextResponse.json({ error: 'amount_cents is required for partial refund.' }, { status: 400 });
    }
    const refund = await stripe.refunds.create({
      payment_intent: dispute.payment_intent_id,
      amount: parsed.data.amount_cents,
    });
    stripeResult = { id: refund.id, status: refund.status ?? 'succeeded' };
    paymentStatus = 'split';
  }

  await serviceSupabase
    .from('disputes')
    .update({
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  await serviceSupabase.from('dispute_logs').insert({
    dispute_id: id,
    actor_id: auth.user?.id ?? '',
    actor_role: 'admin',
    action: 'payment_processed',
    details: {
      payment_action: parsed.data.action,
      amount_cents: parsed.data.amount_cents ?? null,
      stripe_result: stripeResult,
    },
  });

  return NextResponse.json({ ok: true, payment_status: paymentStatus, stripe: stripeResult }, { status: 200 });
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
