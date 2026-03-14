import { getResendClient } from './client';
import { liveServices } from '../live-services';
import { getServiceStatus } from '../resilience/service-status';
import {
  quoteReceivedEmail,
  quoteAcceptedEmail,
  paymentReleasedEmail,
  providerFirstQuoteEmail,
  contractCreatedEmail,
  contractSignedEmail,
  contractVoidedEmail,
  subscriptionStatusEmail,
  gdprDeletionConfirmEmail,
  jobApprovedEmail,
  type QuoteReceivedData,
  type QuoteAcceptedData,
  type PaymentReleasedData,
  type ProviderFirstQuoteData,
  type ContractCreatedData,
  type ContractSignedData,
  type ContractVoidedData,
  type SubscriptionStatusData,
  type GdprDeletionConfirmData,
  type JobApprovedData,
} from './templates';

const FROM =
  process.env.NODE_ENV === 'production'
    ? 'WorkMate <notifications@workmate.ie>'
    : 'WorkMate <onboarding@resend.dev>';

type EmailEvent =
  | ({ type: 'quote_received' } & QuoteReceivedData)
  | ({ type: 'quote_accepted' } & QuoteAcceptedData)
  | ({ type: 'payment_released' } & PaymentReleasedData)
  | ({ type: 'provider_first_quote' } & ProviderFirstQuoteData)
  | ({ type: 'contract_created' } & ContractCreatedData)
  | ({ type: 'contract_signed' } & ContractSignedData)
  | ({ type: 'contract_voided' } & ContractVoidedData)
  | ({ type: 'subscription_status' } & SubscriptionStatusData)
  | ({ type: 'gdpr_deletion_confirm' } & GdprDeletionConfirmData)
  | ({ type: 'job_approved' } & JobApprovedData);

/**
 * Fire-and-forget transactional email. Never throws — email failure is logged
 * but must never break the caller's response.
 *
 * DEV GUARD: In non-production environments, emails are logged to console only.
 * Set EMAIL_SEND_ENABLED=true in .env.local to force real sends in dev (not recommended).
 */
export function sendTransactionalEmail(event: EmailEvent): void {
  void (async () => {
    try {
      // Block real email sends unless live services are enabled.
      if (!liveServices.email) {
        console.warn('[EMAIL BLOCKED — live services off]', event.type, '->', event.to);
        return;
      }

      // Graceful degradation: if Resend is known down, log and skip silently
      const resendStatus = await getServiceStatus('resend');
      if (resendStatus === 'down') {
        console.warn('[EMAIL SKIPPED — Resend service down]', event.type, '->', event.to);
        return;
      }

      const resend = getResendClient();

      let subject: string;
      let html: string;

      if (event.type === 'quote_received') {
        ({ subject, html } = quoteReceivedEmail(event));
      } else if (event.type === 'quote_accepted') {
        ({ subject, html } = quoteAcceptedEmail(event));
      } else if (event.type === 'provider_first_quote') {
        ({ subject, html } = providerFirstQuoteEmail(event));
      } else if (event.type === 'contract_created') {
        ({ subject, html } = contractCreatedEmail(event));
      } else if (event.type === 'contract_signed') {
        ({ subject, html } = contractSignedEmail(event));
      } else if (event.type === 'contract_voided') {
        ({ subject, html } = contractVoidedEmail(event));
      } else if (event.type === 'subscription_status') {
        ({ subject, html } = subscriptionStatusEmail(event));
      } else if (event.type === 'gdpr_deletion_confirm') {
        ({ subject, html } = gdprDeletionConfirmEmail(event));
      } else if (event.type === 'job_approved') {
        ({ subject, html } = jobApprovedEmail(event));
      } else {
        ({ subject, html } = paymentReleasedEmail(event));
      }

      const recipient = process.env.DEV_EMAIL_OVERRIDE ?? event.to;
      await resend.emails.send({ from: FROM, to: recipient, subject, html });
    } catch {
      // Non-blocking — email delivery failure never propagates to the API caller.
    }
  })();
}

/**
 * Convenience wrapper: fire-and-forget email sent when an admin approves a job listing.
 */
export function sendJobApprovedEmail(params: {
  to: string;
  customerName: string;
  jobTitle: string;
  jobId: string;
}): void {
  sendTransactionalEmail({ type: 'job_approved', ...params });
}
