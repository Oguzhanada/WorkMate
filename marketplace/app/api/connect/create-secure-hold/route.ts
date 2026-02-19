import { NextRequest, NextResponse } from 'next/server';
import { PLATFORM_COMMISSION_RATE, stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  const { amount_cents, connected_account_id, quote_id, job_id, customer_id, pro_id } = await request.json();

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
