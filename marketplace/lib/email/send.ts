import { getResendClient } from './client';
import {
  quoteReceivedEmail,
  quoteAcceptedEmail,
  paymentReleasedEmail,
  type QuoteReceivedData,
  type QuoteAcceptedData,
  type PaymentReleasedData,
} from './templates';

const FROM = 'WorkMate <notifications@workmate.ie>';

type EmailEvent =
  | ({ type: 'quote_received' } & QuoteReceivedData)
  | ({ type: 'quote_accepted' } & QuoteAcceptedData)
  | ({ type: 'payment_released' } & PaymentReleasedData);

/**
 * Fire-and-forget transactional email. Never throws — email failure is logged
 * but must never break the caller's response.
 */
export function sendTransactionalEmail(event: EmailEvent): void {
  void (async () => {
    try {
      const resend = getResendClient();

      let subject: string;
      let html: string;

      if (event.type === 'quote_received') {
        ({ subject, html } = quoteReceivedEmail(event));
      } else if (event.type === 'quote_accepted') {
        ({ subject, html } = quoteAcceptedEmail(event));
      } else {
        ({ subject, html } = paymentReleasedEmail(event));
      }

      await resend.emails.send({ from: FROM, to: event.to, subject, html });
    } catch {
      // Non-blocking — email delivery failure never propagates to the API caller.
    }
  })();
}
