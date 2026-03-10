import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { canAccessAdmin, canPostJob, getUserRoles } from '@/lib/auth/rbac';
import { capturePaymentSchema } from '@/lib/validation/api';
import { stripe } from '@/lib/stripe/client';
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
  const isAdmin = canAccessAdmin(roles);
  if (!canPostJob(roles)) {
    return NextResponse.json({ error: 'Only customers can capture payment' }, { status: 403 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = capturePaymentSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { payment_intent_id } = parsed.data;
  const serviceSupabase = getSupabaseServiceClient();

  const { data: payment, error: paymentError } = await serviceSupabase
    .from('payments')
    .select('id,job_id,customer_id,status,stripe_payment_intent_id')
    .eq('stripe_payment_intent_id', payment_intent_id)
    .maybeSingle();

  if (paymentError || !payment) {
    return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
  }

  if (payment.customer_id !== user.id && !isAdmin) {
    return NextResponse.json({ error: 'You cannot capture this payment' }, { status: 403 });
  }

  if (payment.status !== 'authorized') {
    return NextResponse.json({ error: `Payment cannot be captured from status: ${payment.status}` }, { status: 400 });
  }

  const { data: job } = await supabase
    .from('jobs')
    .select('id,status,customer_id')
    .eq('id', payment.job_id)
    .maybeSingle();

  if (!job || (job.customer_id !== user.id && !isAdmin)) {
    return NextResponse.json({ error: 'Job not found for this customer' }, { status: 404 });
  }

  if (job.status !== 'completed') {
    return NextResponse.json({ error: 'Mark job as completed before releasing payment' }, { status: 400 });
  }

  const captured = await stripe.paymentIntents.capture(payment_intent_id);

  const { error: updateError } = await serviceSupabase
    .from('payments')
    .update({ status: 'captured', auto_release_processed_at: new Date().toISOString() })
    .eq('stripe_payment_intent_id', payment_intent_id);

  await serviceSupabase
    .from('jobs')
    .update({ payment_released_at: new Date().toISOString(), payment_on_hold: false })
    .eq('id', payment.job_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ status: captured.status, payment_intent_id: captured.id });
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
