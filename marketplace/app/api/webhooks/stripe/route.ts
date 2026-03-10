import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/client';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { sendWebhookEvent } from '@/lib/webhook/send';
import { sendTransactionalEmail } from '@/lib/email/send';
import { updateCustomerProviderHistory } from '@/lib/pricing/fee-calculator';
import { stripeSubscriptionObjectSchema } from '@/lib/validation/api';
import { sendNotification } from '@/lib/notifications/send';

// Subscription statuses that warrant a user-facing email notification.
const SUBSCRIPTION_EMAIL_STATUSES = new Set(['active', 'past_due', 'cancelled']);

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
    console.error('[stripe-webhook] signature verification failed:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();

  // ── Idempotency guard — skip already-processed events ─────────────────────
  const { error: idempotencyError } = await supabase
    .from('webhook_events')
    .insert({ stripe_event_id: event.id, event_type: event.type });

  if (idempotencyError) {
    // Unique constraint violation = duplicate event → acknowledge silently
    if (idempotencyError.code === '23505') {
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }
    // Unexpected DB error — log but continue; don't let idempotency block processing
    console.error('[stripe-webhook] idempotency insert failed', idempotencyError.message);
  }

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

  // ── Subscription: created ─────────────────────────────────────────────────
  if (event.type === 'customer.subscription.created') {
    const raw = event.data.object as Stripe.Subscription;
    const parsed = stripeSubscriptionObjectSchema.safeParse(raw);
    if (!parsed.success) {
      console.error('[stripe-webhook] customer.subscription.created parse error', parsed.error.issues);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const sub = parsed.data;
    const providerId = sub.metadata?.workmate_provider_id ?? null;

    if (providerId) {
      const plan = (sub.metadata?.workmate_plan as 'basic' | 'professional' | 'premium') ?? 'professional';
      const mappedStatus: 'active' | 'past_due' | 'cancelled' | 'trialing' | 'paused' =
        sub.status === 'trialing' ? 'trialing' : 'active';

      await supabase
        .from('provider_subscriptions')
        .upsert(
          {
            provider_id: providerId,
            stripe_subscription_id: sub.id,
            stripe_customer_id: sub.customer,
            plan,
            status: mappedStatus,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
          },
          { onConflict: 'provider_id' }
        );
    } else {
      console.warn('[stripe-webhook] customer.subscription.created: no workmate_provider_id in metadata', sub.id);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  }

  // ── Subscription: updated ─────────────────────────────────────────────────
  if (event.type === 'customer.subscription.updated') {
    const raw = event.data.object as Stripe.Subscription;
    const parsed = stripeSubscriptionObjectSchema.safeParse(raw);
    if (!parsed.success) {
      console.error('[stripe-webhook] customer.subscription.updated parse error', parsed.error.issues);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const sub = parsed.data;

    // Map Stripe status to our constrained enum
    const statusMap: Record<string, 'active' | 'past_due' | 'cancelled' | 'trialing' | 'paused'> = {
      active: 'active',
      past_due: 'past_due',
      canceled: 'cancelled',
      cancelled: 'cancelled',
      trialing: 'trialing',
      paused: 'paused',
    };
    const mappedStatus = statusMap[sub.status] ?? 'active';

    await supabase
      .from('provider_subscriptions')
      .update({
        status: mappedStatus,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
      })
      .eq('stripe_subscription_id', sub.id);

    // In-app notification on meaningful status changes — fire-and-forget
    if (sub.metadata?.workmate_provider_id) {
      if (mappedStatus === 'active') {
        sendNotification({
          userId: sub.metadata.workmate_provider_id,
          type: 'subscription_update',
          title: 'Subscription Active',
        });
      } else if (mappedStatus === 'past_due') {
        sendNotification({
          userId: sub.metadata.workmate_provider_id,
          type: 'subscription_update',
          title: 'Payment Failed — Subscription Past Due',
        });
      } else if (mappedStatus === 'cancelled') {
        sendNotification({
          userId: sub.metadata.workmate_provider_id,
          type: 'subscription_update',
          title: 'Subscription Cancelled',
        });
      }
    }

    // Email provider on status changes that are meaningful to them — fire-and-forget
    if (SUBSCRIPTION_EMAIL_STATUSES.has(mappedStatus) && sub.metadata?.workmate_provider_id) {
      void (async () => {
        try {
          const { data: providerProfile } = await supabase
            .from('profiles')
            .select('email,full_name')
            .eq('id', sub.metadata!.workmate_provider_id)
            .maybeSingle();
          if (providerProfile?.email) {
            const plan = (sub.metadata?.workmate_plan as string) || 'Professional';
            sendTransactionalEmail({
              type: 'subscription_status',
              to: providerProfile.email,
              providerName: providerProfile.full_name ?? 'Provider',
              status: mappedStatus as 'active' | 'past_due' | 'cancelled',
              planName: plan.charAt(0).toUpperCase() + plan.slice(1),
            });
          }
        } catch {
          // Non-blocking — email lookup failure is swallowed.
        }
      })();
    }

    return NextResponse.json({ received: true }, { status: 200 });
  }

  // ── Subscription: deleted (cancelled) ────────────────────────────────────
  if (event.type === 'customer.subscription.deleted') {
    const raw = event.data.object as Stripe.Subscription;
    const parsed = stripeSubscriptionObjectSchema.safeParse(raw);
    if (!parsed.success) {
      console.error('[stripe-webhook] customer.subscription.deleted parse error', parsed.error.issues);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const sub = parsed.data;

    await supabase
      .from('provider_subscriptions')
      .update({
        status: 'cancelled',
        cancel_at_period_end: false,
      })
      .eq('stripe_subscription_id', sub.id);

    // In-app notification for cancellation — fire-and-forget
    if (sub.metadata?.workmate_provider_id) {
      sendNotification({
        userId: sub.metadata.workmate_provider_id,
        type: 'subscription_update',
        title: 'Subscription Cancelled',
      });
    }

    // Email provider about cancellation — fire-and-forget
    if (sub.metadata?.workmate_provider_id) {
      void (async () => {
        try {
          const { data: providerProfile } = await supabase
            .from('profiles')
            .select('email,full_name')
            .eq('id', sub.metadata!.workmate_provider_id)
            .maybeSingle();
          if (providerProfile?.email) {
            const plan = (sub.metadata?.workmate_plan as string) || 'Professional';
            sendTransactionalEmail({
              type: 'subscription_status',
              to: providerProfile.email,
              providerName: providerProfile.full_name ?? 'Provider',
              status: 'cancelled',
              planName: plan.charAt(0).toUpperCase() + plan.slice(1),
            });
          }
        } catch {
          // Non-blocking — email lookup failure is swallowed.
        }
      })();
    }

    return NextResponse.json({ received: true }, { status: 200 });
  }

  // ── Invoice: payment failed (subscription past_due) ───────────────────────
  if (event.type === 'invoice.payment_failed') {
    const raw = event.data.object as Stripe.Invoice;

    // Stripe SDK v20: subscription id lives on parent.subscription_details.subscription
    const subId =
      raw.parent?.type === 'subscription_details' &&
      raw.parent.subscription_details?.subscription
        ? typeof raw.parent.subscription_details.subscription === 'string'
          ? raw.parent.subscription_details.subscription
          : (raw.parent.subscription_details.subscription as Stripe.Subscription).id
        : null;

    if (subId) {
      await supabase
        .from('provider_subscriptions')
        .update({ status: 'past_due' })
        .eq('stripe_subscription_id', subId);

      // In-app notification — fire-and-forget
      void (async () => {
        try {
          const { data: subRow } = await supabase
            .from('provider_subscriptions')
            .select('provider_id')
            .eq('stripe_subscription_id', subId)
            .maybeSingle();
          if (subRow?.provider_id) {
            sendNotification({
              userId: subRow.provider_id,
              type: 'subscription_update',
              title: 'Payment Failed — Subscription Past Due',
            });
          }
        } catch {
          // Non-blocking — notification failure is swallowed.
        }
      })();
    }

    return NextResponse.json({ received: true }, { status: 200 });
  }

  // ── Stripe invoice paid (hourly invoicing flow + subscription renewal) ────
  if (event.type === 'invoice.paid' || event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice;
    const jobId = String(invoice.metadata?.workmate_job_id ?? '');
    const customerId = String(invoice.metadata?.workmate_customer_id ?? '');

    // ── Subscription renewal: update period + reset status to active ────────
    // Stripe SDK v20: subscription id lives on parent.subscription_details.subscription
    const renewalSubId =
      invoice.parent?.type === 'subscription_details' &&
      invoice.parent.subscription_details?.subscription
        ? typeof invoice.parent.subscription_details.subscription === 'string'
          ? invoice.parent.subscription_details.subscription
          : (invoice.parent.subscription_details.subscription as Stripe.Subscription).id
        : null;

    if (renewalSubId) {
      // Pull period end from the first line item if available
      const firstLine = invoice.lines?.data?.[0];
      const updatePayload: Record<string, unknown> = { status: 'active' };
      if (firstLine?.period?.start && firstLine?.period?.end) {
        updatePayload.current_period_start = new Date(firstLine.period.start * 1000).toISOString();
        updatePayload.current_period_end = new Date(firstLine.period.end * 1000).toISOString();
      }
      await supabase
        .from('provider_subscriptions')
        .update(updatePayload)
        .eq('stripe_subscription_id', renewalSubId);
    }

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
