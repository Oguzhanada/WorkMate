import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { sendWebhookEvent } from '@/lib/webhook/send';
import { sendTransactionalEmail } from '@/lib/email/send';
import { updateCustomerProviderHistory } from '@/lib/pricing/fee-calculator';

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

  // ── Payment Intent failure / cancellation ─────────────────────────────────
  if (
    event.type === 'payment_intent.payment_failed' ||
    event.type === 'payment_intent.canceled'
  ) {
    const intent = event.data.object as Stripe.PaymentIntent;

    const { data: paymentRow } = await supabase
      .from('payments')
      .select('id,job_id,customer_id')
      .eq('stripe_payment_intent_id', intent.id)
      .maybeSingle();

    if (paymentRow) {
      await supabase
        .from('payments')
        .update({ status: 'cancelled' })
        .eq('id', paymentRow.id);

      if (paymentRow.customer_id) {
        await supabase.from('notifications').insert({
          user_id: paymentRow.customer_id,
          type: 'payment_failed',
          payload: {
            job_id: paymentRow.job_id,
            payment_intent_id: intent.id,
            reason:
              event.type === 'payment_intent.payment_failed'
                ? (intent.last_payment_error?.message ?? 'Payment failed.')
                : 'Payment was cancelled.',
          },
        });
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  }

  // ── Dispute / chargeback created ───────────────────────────────────────────
  if (event.type === 'charge.dispute.created') {
    const dispute = event.data.object as Stripe.Dispute;

    const paymentIntentId =
      typeof dispute.payment_intent === 'string'
        ? dispute.payment_intent
        : (dispute.payment_intent as Stripe.PaymentIntent | null)?.id ?? null;

    const { data: paymentRow } = paymentIntentId
      ? await supabase
          .from('payments')
          .select('id,job_id,customer_id,pro_id')
          .eq('stripe_payment_intent_id', paymentIntentId)
          .maybeSingle()
      : { data: null };

    const { data: adminRows } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if ((adminRows ?? []).length > 0) {
      await supabase.from('notifications').insert(
        (adminRows ?? []).map((row) => ({
          user_id: row.user_id,
          type: 'dispute_chargeback',
          payload: {
            stripe_dispute_id: dispute.id,
            amount_cents: dispute.amount,
            reason: dispute.reason,
            job_id: paymentRow?.job_id ?? null,
            payment_intent_id: paymentIntentId,
          },
        }))
      );
    }

    return NextResponse.json({ received: true }, { status: 200 });
  }

  // ── Stripe Connect account updated ────────────────────────────────────────
  if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account;

    await supabase
      .from('profiles')
      .update({
        stripe_charges_enabled: account.charges_enabled === true,
        stripe_payouts_enabled: account.payouts_enabled === true,
      })
      .eq('stripe_account_id', account.id);

    return NextResponse.json({ received: true }, { status: 200 });
  }

  // ── Stripe invoice paid (hourly invoicing flow) ───────────────────────────
  if (event.type === 'invoice.paid' || event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice;
    const jobId = String(invoice.metadata?.workmate_job_id ?? '');
    const customerId = String(invoice.metadata?.workmate_customer_id ?? '');

    if (jobId) {
      await supabase
        .from('jobs')
        .update({ payment_released_at: new Date().toISOString() })
        .eq('id', jobId);
    }

    // Update customer-provider history for rebooking fee eligibility
    if (jobId && customerId && invoice.amount_paid) {
      void (async () => {
        try {
          const { data: jobRow } = await supabase
            .from('jobs')
            .select('accepted_quote_id')
            .eq('id', jobId)
            .maybeSingle();
          if (jobRow?.accepted_quote_id) {
            const { data: quoteRow } = await supabase
              .from('quotes')
              .select('pro_id')
              .eq('id', jobRow.accepted_quote_id)
              .maybeSingle();
            if (quoteRow?.pro_id) {
              await updateCustomerProviderHistory(customerId, quoteRow.pro_id, invoice.amount_paid);
            }
          }
        } catch {
          // Non-blocking — history update failure is swallowed.
        }
      })();
    }

    if (customerId) {
      await supabase.from('notifications').insert({
        user_id: customerId,
        type: 'invoice_paid',
        payload: {
          job_id: jobId || null,
          stripe_invoice_id: invoice.id,
          amount_paid_cents: invoice.amount_paid ?? 0,
        },
      });
    }

    void sendWebhookEvent('payment.completed', {
      stripe_invoice_id: invoice.id,
      job_id: jobId || null,
      customer_id: customerId || null,
      amount_paid_cents: invoice.amount_paid ?? 0,
      paid_at: new Date().toISOString(),
    });

    // Email the provider when payment is released — non-blocking, best-effort
    if (jobId && invoice.amount_paid) {
      void (async () => {
        try {
          const { data: jobRow } = await supabase
            .from('jobs')
            .select('title,accepted_quote_id')
            .eq('id', jobId)
            .maybeSingle();

          if (jobRow?.accepted_quote_id) {
            const { data: quoteRow } = await supabase
              .from('quotes')
              .select('pro_id')
              .eq('id', jobRow.accepted_quote_id)
              .maybeSingle();

            if (quoteRow?.pro_id) {
              const { data: providerProfile } = await supabase
                .from('profiles')
                .select('email')
                .eq('id', quoteRow.pro_id)
                .maybeSingle();

              if (providerProfile?.email) {
                sendTransactionalEmail({
                  type: 'payment_released',
                  to: providerProfile.email,
                  jobTitle: jobRow.title ?? 'the job',
                  amountEur: (invoice.amount_paid / 100).toFixed(2),
                  jobId,
                });
              }
            }
          }
        } catch {
          // Non-blocking — email lookup failure is swallowed.
        }
      })();
    }

    return NextResponse.json({ received: true }, { status: 200 });
  }

  // ── Stripe Identity ────────────────────────────────────────────────────────
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
