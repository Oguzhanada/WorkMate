import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { canAccessAdmin, canPostJob, getUserRoles } from '@/lib/auth/rbac';
import { capturePaymentSchema } from '@/lib/validation/api';
import { stripe } from '@/lib/stripe/client';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiUnauthorized, apiForbidden, apiNotFound } from '@/lib/api/error-response';

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
  const isAdmin = canAccessAdmin(roles);
  if (!canPostJob(roles)) {
    return apiForbidden('Only customers can capture payment');
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = capturePaymentSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiError('Validation failed', 400);
  }

  const { payment_intent_id } = parsed.data;
  const serviceSupabase = getSupabaseServiceClient();

  const { data: payment, error: paymentError } = await serviceSupabase
    .from('payments')
    .select('id,job_id,customer_id,status,stripe_payment_intent_id')
    .eq('stripe_payment_intent_id', payment_intent_id)
    .maybeSingle();

  if (paymentError || !payment) {
    return apiNotFound('Payment record not found');
  }

  if (payment.customer_id !== user.id && !isAdmin) {
    return apiForbidden('You cannot capture this payment');
  }

  if (payment.status !== 'authorized') {
    return apiError(`Payment cannot be captured from status: ${payment.status}`, 400);
  }

  const { data: job } = await supabase
    .from('jobs')
    .select('id,status,customer_id')
    .eq('id', payment.job_id)
    .maybeSingle();

  if (!job || (job.customer_id !== user.id && !isAdmin)) {
    return apiNotFound('Job not found for this customer');
  }

  if (job.status !== 'completed') {
    return apiError('Mark job as completed before releasing payment', 400);
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
    return apiError(updateError.message, 400);
  }

  return NextResponse.json({ status: captured.status, payment_intent_id: captured.id });
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
