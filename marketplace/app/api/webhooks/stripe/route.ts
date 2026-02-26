import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { getSupabaseServiceClient } from '@/lib/supabase/service';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Missing webhook signature or secret' }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook signature verification failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();

  if (event.type.startsWith('identity.verification_session')) {
    const session = event.data.object as Stripe.Identity.VerificationSession;

    if (event.type === 'identity.verification_session.verified') {
      await supabase
        .from('profiles')
        .update({
          stripe_identity_status: 'verified',
          stripe_identity_verified_at: new Date().toISOString(),
          id_verification_method: 'stripe_identity',
          id_verification_status: 'approved',
          id_verification_reviewed_at: new Date().toISOString(),
          id_verification_rejected_reason: null,
        })
        .eq('stripe_identity_session_id', session.id);
    }

    if (event.type === 'identity.verification_session.requires_input') {
      await supabase
        .from('profiles')
        .update({
          stripe_identity_status: 'requires_input',
          id_verification_status: 'rejected',
          id_verification_rejected_reason: session.last_error?.reason ?? 'Identity verification requires additional input.',
        })
        .eq('stripe_identity_session_id', session.id);
    }

    if (event.type === 'identity.verification_session.canceled') {
      await supabase
        .from('profiles')
        .update({
          stripe_identity_status: 'failed',
          id_verification_status: 'rejected',
          id_verification_rejected_reason: 'Identity verification session was canceled.',
        })
        .eq('stripe_identity_session_id', session.id);
    }

    if (event.type === 'identity.verification_session.processing') {
      await supabase
        .from('profiles')
        .update({
          stripe_identity_status: 'processing',
        })
        .eq('stripe_identity_session_id', session.id);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  }

  return NextResponse.json({ received: true, ignored: event.type }, { status: 200 });
}