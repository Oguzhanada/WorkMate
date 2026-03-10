import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { canPostJob, getUserRoles } from '@/lib/auth/rbac';
import { createSecureHoldSchema } from '@/lib/validation/api';
import { PLATFORM_COMMISSION_RATE, stripe } from '@/lib/stripe';
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
    return NextResponse.json({ error: 'Only customers can create secure hold' }, { status: 403 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createSecureHoldSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { amount_cents, connected_account_id, quote_id, job_id, customer_id, pro_id } = parsed.data;
  const platformBaseUrl = process.env.NEXT_PUBLIC_PLATFORM_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

  if (customer_id !== user.id) {
    return NextResponse.json({ error: 'Customer mismatch' }, { status: 403 });
  }

  const { data: quote } = await supabase
    .from('quotes')
    .select('id,pro_id,job_id,quote_amount_cents')
    .eq('id', quote_id)
    .maybeSingle();

  if (!quote || quote.job_id !== job_id || quote.pro_id !== pro_id || quote.quote_amount_cents !== amount_cents) {
    return NextResponse.json({ error: 'Quote details are invalid' }, { status: 400 });
  }

  const { data: job } = await supabase
    .from('jobs')
    .select('id,customer_id,status,accepted_quote_id')
    .eq('id', job_id)
    .maybeSingle();

  if (!job || job.customer_id !== user.id) {
    return NextResponse.json({ error: 'Job not found for this customer' }, { status: 404 });
  }

  if (job.accepted_quote_id !== quote_id || job.status !== 'accepted') {
    return NextResponse.json({ error: 'Please accept this quote before secure hold payment' }, { status: 400 });
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
    return NextResponse.json({ error: `Payment already exists with status: ${existingPayment.status}` }, { status: 400 });
  }

  const commission = Math.round(amount_cents * PLATFORM_COMMISSION_RATE);
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    success_url: `${platformBaseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${platformBaseUrl}/checkout/cancel`,
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

  return NextResponse.json({
    checkout_url: checkoutSession.url,
    checkout_session_id: checkoutSession.id,
    commission_cents: commission,
  });
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
