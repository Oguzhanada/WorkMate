const BASE_URL = process.env.NEXT_PUBLIC_PLATFORM_BASE_URL ?? 'https://workmate.ie';
const PLATFORM_LOCALE = process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'en';

const BRAND_COLOR = '#059669';
const BG = '#f8fafc';
const CARD_BG = '#ffffff';
const TEXT = '#1e293b';
const MUTED = '#64748b';

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:${CARD_BG};border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
        <tr>
          <td style="background:${BRAND_COLOR};padding:20px 32px;">
            <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">WorkMate</span>
          </td>
        </tr>
        <tr><td style="padding:32px;color:${TEXT};">${content}</td></tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #e2e8f0;color:${MUTED};font-size:12px;">
            WorkMate Ireland Ltd &bull; You received this email because you have an account on workmate.ie.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ctaButton(text: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:${BRAND_COLOR};color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">${text}</a>`;
}

// ── Quote received (customer notification) ────────────────────────────────────

export type QuoteReceivedData = {
  to: string;
  jobTitle: string;
  providerName: string;
  amountEur: string;
  jobId: string;
};

export function quoteReceivedEmail(data: QuoteReceivedData): { subject: string; html: string } {
  const jobUrl = `${BASE_URL}/${PLATFORM_LOCALE}/jobs/${data.jobId}`;
  const subject = `New quote received for "${data.jobTitle}"`;
  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;">You have a new quote</h2>
    <p style="margin:0 0 20px;color:${MUTED};">A service provider has submitted a quote for your job.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};border-radius:8px;padding:16px;margin-bottom:20px;">
      <tr><td style="padding:4px 0;">
        <span style="color:${MUTED};font-size:13px;">Job</span><br />
        <strong>${data.jobTitle}</strong>
      </td></tr>
      <tr><td style="padding:12px 0 4px;">
        <span style="color:${MUTED};font-size:13px;">Provider</span><br />
        <strong>${data.providerName}</strong>
      </td></tr>
      <tr><td style="padding:12px 0 4px;">
        <span style="color:${MUTED};font-size:13px;">Quote amount</span><br />
        <strong style="font-size:20px;color:${BRAND_COLOR};">€${data.amountEur}</strong>
      </td></tr>
    </table>

    ${ctaButton('View quotes', jobUrl)}

    <p style="margin-top:24px;font-size:13px;color:${MUTED};">Quotes expire after 48 hours. Review and accept to get started.</p>
  `);
  return { subject, html };
}

// ── Quote accepted (provider notification) ────────────────────────────────────

export type QuoteAcceptedData = {
  to: string;
  jobTitle: string;
  customerName: string;
  amountEur: string;
  jobId: string;
};

export function quoteAcceptedEmail(data: QuoteAcceptedData): { subject: string; html: string } {
  const jobUrl = `${BASE_URL}/${PLATFORM_LOCALE}/jobs/${data.jobId}`;
  const subject = `Your quote for "${data.jobTitle}" was accepted!`;
  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;">Quote accepted</h2>
    <p style="margin:0 0 20px;color:${MUTED};">Congratulations! A customer has accepted your quote.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};border-radius:8px;padding:16px;margin-bottom:20px;">
      <tr><td style="padding:4px 0;">
        <span style="color:${MUTED};font-size:13px;">Job</span><br />
        <strong>${data.jobTitle}</strong>
      </td></tr>
      <tr><td style="padding:12px 0 4px;">
        <span style="color:${MUTED};font-size:13px;">Customer</span><br />
        <strong>${data.customerName}</strong>
      </td></tr>
      <tr><td style="padding:12px 0 4px;">
        <span style="color:${MUTED};font-size:13px;">Agreed amount</span><br />
        <strong style="font-size:20px;color:#16a34a;">€${data.amountEur}</strong>
      </td></tr>
    </table>

    ${ctaButton('Open job details', jobUrl)}

    <p style="margin-top:24px;font-size:13px;color:${MUTED};">Coordinate directly with your customer via the WorkMate messaging panel.</p>
  `);
  return { subject, html };
}

// ── Payment released (provider notification) ──────────────────────────────────

export type PaymentReleasedData = {
  to: string;
  jobTitle: string;
  amountEur: string;
  jobId: string;
};

export function paymentReleasedEmail(data: PaymentReleasedData): { subject: string; html: string } {
  const jobUrl = `${BASE_URL}/${PLATFORM_LOCALE}/jobs/${data.jobId}`;
  const subject = `Payment of €${data.amountEur} released for "${data.jobTitle}"`;
  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;">Payment released</h2>
    <p style="margin:0 0 20px;color:${MUTED};">Your payment has been processed and is on its way to your connected account.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};border-radius:8px;padding:16px;margin-bottom:20px;">
      <tr><td style="padding:4px 0;">
        <span style="color:${MUTED};font-size:13px;">Job</span><br />
        <strong>${data.jobTitle}</strong>
      </td></tr>
      <tr><td style="padding:12px 0 4px;">
        <span style="color:${MUTED};font-size:13px;">Amount</span><br />
        <strong style="font-size:20px;color:#16a34a;">€${data.amountEur}</strong>
      </td></tr>
    </table>

    ${ctaButton('View job', jobUrl)}

    <p style="margin-top:24px;font-size:13px;color:${MUTED};">Funds typically arrive in your Stripe-connected account within 2 business days.</p>
  `);
  return { subject, html };
}

// ── Contract: created (provider notification) ────────────────────────────────

export type ContractCreatedData = {
  to: string;
  providerName: string;
  customerName: string;
  jobTitle: string;
  contractUrl: string;
};

export function contractCreatedEmail(data: ContractCreatedData): { subject: string; html: string } {
  const subject = `New contract awaiting your signature — "${data.jobTitle}"`;
  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;">Contract ready to sign</h2>
    <p style="margin:0 0 20px;color:${MUTED};">${data.customerName} has created a contract for the following job and is awaiting your signature.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};border-radius:8px;padding:16px;margin-bottom:20px;">
      <tr><td style="padding:4px 0;">
        <span style="color:${MUTED};font-size:13px;">Job</span><br />
        <strong>${data.jobTitle}</strong>
      </td></tr>
      <tr><td style="padding:12px 0 4px;">
        <span style="color:${MUTED};font-size:13px;">Customer</span><br />
        <strong>${data.customerName}</strong>
      </td></tr>
    </table>

    ${ctaButton('Review and sign contract', data.contractUrl)}

    <p style="margin-top:24px;font-size:13px;color:${MUTED};">Please review the contract terms carefully before signing.</p>
  `);
  return { subject, html };
}

// ── Contract: signed (customer notification) ──────────────────────────────────

export type ContractSignedData = {
  to: string;
  customerName: string;
  jobTitle: string;
  contractUrl: string;
};

export function contractSignedEmail(data: ContractSignedData): { subject: string; html: string } {
  const subject = `Contract signed for "${data.jobTitle}"`;
  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;">Contract signed</h2>
    <p style="margin:0 0 20px;color:${MUTED};">Hi ${data.customerName}, the service provider has signed the contract for your job.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};border-radius:8px;padding:16px;margin-bottom:20px;">
      <tr><td style="padding:4px 0;">
        <span style="color:${MUTED};font-size:13px;">Job</span><br />
        <strong>${data.jobTitle}</strong>
      </td></tr>
    </table>

    ${ctaButton('View contract', data.contractUrl)}

    <p style="margin-top:24px;font-size:13px;color:${MUTED};">Both parties have now signed the contract. Work can proceed as agreed.</p>
  `);
  return { subject, html };
}

// ── Contract: voided (both parties notification) ──────────────────────────────

export type ContractVoidedData = {
  to: string;
  recipientName: string;
  jobTitle: string;
};

export function contractVoidedEmail(data: ContractVoidedData): { subject: string; html: string } {
  const subject = `Contract voided for "${data.jobTitle}"`;
  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;">Contract voided</h2>
    <p style="margin:0 0 20px;color:${MUTED};">Hi ${data.recipientName}, the contract for the following job has been voided.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};border-radius:8px;padding:16px;margin-bottom:20px;">
      <tr><td style="padding:4px 0;">
        <span style="color:${MUTED};font-size:13px;">Job</span><br />
        <strong>${data.jobTitle}</strong>
      </td></tr>
    </table>

    <p style="margin-top:8px;font-size:13px;color:${MUTED};">If you believe this was a mistake, please contact the other party or reach out to WorkMate support.</p>
  `);
  return { subject, html };
}

// ── Subscription: status change (provider notification) ───────────────────────

export type SubscriptionStatusData = {
  to: string;
  providerName: string;
  status: 'active' | 'past_due' | 'cancelled';
  planName: string;
};

export function subscriptionStatusEmail(data: SubscriptionStatusData): { subject: string; html: string } {
  const dashboardUrl = `${BASE_URL}/${PLATFORM_LOCALE}/dashboard`;
  const statusLabels: Record<string, string> = {
    active: 'Active',
    past_due: 'Payment Past Due',
    cancelled: 'Cancelled',
  };
  const statusColors: Record<string, string> = {
    active: '#16a34a',
    past_due: '#d97706',
    cancelled: '#dc2626',
  };
  const subjectMap: Record<string, string> = {
    active: `Your ${data.planName} subscription is active`,
    past_due: `Action required: your ${data.planName} subscription payment is overdue`,
    cancelled: `Your ${data.planName} subscription has been cancelled`,
  };
  const subject = subjectMap[data.status] ?? `Subscription update: ${data.planName}`;
  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;">Subscription update</h2>
    <p style="margin:0 0 20px;color:${MUTED};">Hi ${data.providerName}, there has been a change to your WorkMate subscription.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};border-radius:8px;padding:16px;margin-bottom:20px;">
      <tr><td style="padding:4px 0;">
        <span style="color:${MUTED};font-size:13px;">Plan</span><br />
        <strong>${data.planName}</strong>
      </td></tr>
      <tr><td style="padding:12px 0 4px;">
        <span style="color:${MUTED};font-size:13px;">Status</span><br />
        <strong style="color:${statusColors[data.status] ?? TEXT};">${statusLabels[data.status] ?? data.status}</strong>
      </td></tr>
    </table>

    ${data.status === 'past_due'
      ? `<p style="margin-bottom:16px;font-size:14px;color:#d97706;">Please update your payment method to avoid losing access to your subscription features.</p>` + ctaButton('Update payment details', dashboardUrl)
      : ctaButton('View your dashboard', dashboardUrl)
    }
  `);
  return { subject, html };
}

// ── Provider first quote milestone (provider notification) ───────────────────

export type ProviderFirstQuoteData = {
  to: string;
  providerName: string;
  jobTitle: string;
  dashboardUrl: string;
};

// ── GDPR account deletion confirmation ──────────────────────────────────────

export type GdprDeletionConfirmData = {
  to: string;
  recipientName?: string;
};

export function gdprDeletionConfirmEmail(data: GdprDeletionConfirmData): { subject: string; html: string } {
  const subject = 'Your WorkMate account has been permanently deleted';
  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;">Account deleted</h2>
    <p style="margin:0 0 20px;color:${MUTED};">Hi${data.recipientName ? ` ${data.recipientName}` : ''}, your WorkMate account and personal data have been permanently deleted as requested.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};border-radius:8px;padding:16px;margin-bottom:20px;">
      <tr><td style="padding:4px 0;">
        <span style="color:${MUTED};font-size:13px;">What was deleted</span><br />
        <strong>Your profile, reviews, jobs, appointments, and saved preferences.</strong>
      </td></tr>
      <tr><td style="padding:12px 0 4px;">
        <span style="color:${MUTED};font-size:13px;">What was retained</span><br />
        <strong>Financial transaction records (7-year statutory requirement).</strong>
      </td></tr>
    </table>

    <p style="margin-top:8px;font-size:13px;color:${MUTED};">This action is irreversible. If you wish to use WorkMate in the future, you will need to create a new account. Thank you for being part of our community.</p>
  `);
  return { subject, html };
}

// ── Job approved (customer notification) ──────────────────────────────────────

export type JobApprovedData = {
  to: string;
  customerName: string;
  jobTitle: string;
  jobId: string;
};

export function jobApprovedEmail(data: JobApprovedData): { subject: string; html: string } {
  const jobUrl = `${BASE_URL}/${PLATFORM_LOCALE}/jobs/${data.jobId}`;
  const subject = `Your job listing is live — "${data.jobTitle}"`;
  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;">Your listing is live</h2>
    <p style="margin:0 0 20px;color:${MUTED};">Hi ${data.customerName}, great news — your job listing has been approved and is now visible to service providers in your area.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};border-radius:8px;padding:16px;margin-bottom:20px;">
      <tr><td style="padding:4px 0;">
        <span style="color:${MUTED};font-size:13px;">Job</span><br />
        <strong>${data.jobTitle}</strong>
      </td></tr>
      <tr><td style="padding:12px 0 4px;">
        <span style="color:${MUTED};font-size:13px;">Status</span><br />
        <strong style="color:${BRAND_COLOR};">Live — accepting quotes</strong>
      </td></tr>
    </table>

    ${ctaButton('View your listing', jobUrl)}

    <p style="margin-top:24px;font-size:13px;color:${MUTED};">We'll notify you as soon as a provider sends you a quote.</p>
  `);
  return { subject, html };
}

// ── Provider first quote milestone (provider notification) ───────────────────

export function providerFirstQuoteEmail(data: ProviderFirstQuoteData): { subject: string; html: string } {
  const subject = `Nice start, ${data.providerName} - your first quote is live`;
  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;">First quote sent</h2>
    <p style="margin:0 0 20px;color:${MUTED};">
      Great work. Your first quote for <strong>${data.jobTitle}</strong> is now visible to the customer.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};border-radius:8px;padding:16px;margin-bottom:20px;">
      <tr><td style="padding:4px 0;">
        <span style="color:${MUTED};font-size:13px;">What to do next</span><br />
        <strong>Open your dashboard tour and complete your provider setup checklist.</strong>
      </td></tr>
    </table>

    ${ctaButton('Open Provider Dashboard Tour', data.dashboardUrl)}

    <p style="margin-top:24px;font-size:13px;color:${MUTED};">
      Tip: Faster responses and complete profile details usually improve your acceptance rate.
    </p>
  `);
  return { subject, html };
}
