import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  const { payment_intent_id } = await request.json();
  const captured = await stripe.paymentIntents.capture(payment_intent_id);
  return NextResponse.json({ status: captured.status, payment_intent_id: captured.id });
}
