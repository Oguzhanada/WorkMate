const BASE_URL = process.env.NEXT_PUBLIC_PLATFORM_BASE_URL ?? 'https://workmate.ie';

const BRAND_COLOR = '#1a56db';
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
  const jobUrl = `${BASE_URL}/en/jobs/${data.jobId}`;
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
  const jobUrl = `${BASE_URL}/en/jobs/${data.jobId}`;
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
  const jobUrl = `${BASE_URL}/en/jobs/${data.jobId}`;
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

// ── Provider first quote milestone (provider notification) ───────────────────

export type ProviderFirstQuoteData = {
  to: string;
  providerName: string;
  jobTitle: string;
  dashboardUrl: string;
};

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
