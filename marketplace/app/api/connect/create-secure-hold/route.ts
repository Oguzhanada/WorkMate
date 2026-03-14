import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { canPostJob, getUserRoles } from '@/lib/auth/rbac';
import { createSecureHoldSchema } from '@/lib/validation/api';
import { stripe } from '@/lib/stripe/client';
import { calculateFees } from '@/lib/pricing/fee-calculator';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiUnauthorized, apiForbidden, apiNotFound } from '@/lib/api/error-response';
import { checkIdempotency, saveIdempotencyResponse } from '@/lib/idempotency';
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
    return apiForbidden('Only customers can create secure hold');
  }

  // Early exit if Stripe is known to be down
  if ((await getServiceStatus('stripe')) === 'down') {
    return NextResponse.json(
      { error: 'Payment service temporarily unavailable. Please try again shortly.' },
      { status: 503 }
    );
  }

  // Idempotency check — prevents duplicate Stripe checkout sessions on retry
  const iKey = request.headers.get('Idempotency-Key');
  if (iKey) {
    const cached = await checkIdempotency(iKey, '/api/connect/create-secure-hold', user.id);
    if (cached) return NextResponse.json(cached.body, { status: cached.status });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = createSecureHoldSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiError('Validation failed', 400);
  }

  const { amount_cents, connected_account_id, quote_id, job_id, customer_id, pro_id } = parsed.data;
  const platformBaseUrl = process.env.NEXT_PUBLIC_PLATFORM_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

  if (customer_id !== user.id) {
    return apiForbidden('Customer mismatch');
  }

  const { data: quote } = await supabase
    .from('quotes')
    .select('id,pro_id,job_id,quote_amount_cents')
    .eq('id', quote_id)
    .maybeSingle();

  if (!quote || quote.job_id !== job_id || quote.pro_id !== pro_id || quote.quote_amount_cents !== amount_cents) {
    return apiError('Quote details are invalid', 400);
  }

  const { data: job } = await supabase
    .from('jobs')
    .select('id,customer_id,status,accepted_quote_id')
    .eq('id', job_id)
    .maybeSingle();

  if (!job || job.customer_id !== user.id) {
    return apiNotFound('Job not found for this customer');
  }

  if (job.accepted_quote_id !== quote_id || job.status !== 'accepted') {
    return apiError('Please accept this quote before secure hold payment', 400);
  }

  const serviceSupabase = getSupabaseServiceClient();
  const { data: existingPayment } = await serviceSupabase
    .from('payments')
    .select('id,status')
    .eq('job_id', job_id)
    .eq('quote_id', quote_id)
    .in('status', ['authorized', 'captured'])
    .limit(1)
    .maybeSingle();

  if (existingPayment) {
    return apiError(`Payment already exists with status: ${existingPayment.status}`, 400);
  }

  const fees = await calculateFees(amount_cents, customer_id, pro_id);
  const commission = Math.round(fees.transactionFee * 100);
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    success_url: `${platformBaseUrl}/en/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${platformBaseUrl}/en/checkout/cancel`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: amount_cents,
          product_data: {
            name: 'Secure Hold Payment',
            description: `Job ${job_id} / Quote ${quote_id}`,
          },
        },
      },
    ],
    metadata: { quote_id, job_id, customer_id, pro_id, commission: String(commission) },
    payment_intent_data: {
      capture_method: 'manual',
      application_fee_amount: commission,
      transfer_data: { destination: connected_account_id },
      metadata: { quote_id, job_id, customer_id, pro_id, commission: String(commission) },
    },
  });

  const responseBody = {
    checkout_url: checkoutSession.url,
    checkout_session_id: checkoutSession.id,
    commission_cents: commission,
  };
  if (iKey) {
    void saveIdempotencyResponse(iKey, '/api/connect/create-secure-hold', user.id, 200, responseBody as Record<string, unknown>);
  }
  return NextResponse.json(responseBody);
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
