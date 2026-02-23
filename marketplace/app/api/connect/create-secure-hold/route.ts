import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getUserRole } from '@/lib/auth/rbac';
import { createSecureHoldSchema } from '@/lib/validation/api';
import { PLATFORM_COMMISSION_RATE, stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = await getUserRole(supabase, user.id);
  if (role !== 'customer' && role !== 'admin') {
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

  const commission = Math.round(amount_cents * PLATFORM_COMMISSION_RATE);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount_cents,
    currency: 'eur',
    capture_method: 'manual',
    application_fee_amount: commission,
    transfer_data: { destination: connected_account_id },
    metadata: { quote_id, job_id, customer_id, pro_id, commission: String(commission) },
    automatic_payment_methods: { enabled: true },
  });

  return NextResponse.json({
    payment_intent_id: paymentIntent.id,
    client_secret: paymentIntent.client_secret,
    commission_cents: commission,
  });
}
