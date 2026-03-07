import type { Metadata } from 'next';

import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';

export const metadata: Metadata = {
  title: 'Privacy Policy — WorkMate',
  description:
    'How WorkMate collects, uses, and protects your personal data under GDPR and Irish law.',
};

export default function PrivacyPage() {
  return (
    <main className="py-14">
      <div style={{ width: 'min(860px, calc(100% - 32px))', margin: '0 auto' }}>
        <div className="mb-6">
          <PageHeader
            title="Privacy Policy"
            description="WorkMate Ltd — Data Controller. Last updated: March 2026"
          />
        </div>

        <div className="flex flex-col gap-5">

          {/* 1. Introduction */}
          <Card>
            <h2
              className="mb-3 text-base font-bold"
              style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
            >
              1. Introduction
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--wm-muted)' }}>
              WorkMate Ltd (&quot;WorkMate&quot;, &quot;we&quot;, &quot;us&quot;) operates the
              WorkMate services marketplace at workmate.ie. We are the Data Controller responsible
              for personal data collected through this platform. We are committed to protecting your
              privacy and complying with the General Data Protection Regulation (GDPR), the Data
              Protection Act 2018, and all applicable Irish data protection law.
            </p>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--wm-muted)' }}>
              For any privacy-related queries, contact us at:{' '}
              <a
                href="mailto:privacy@workmate.ie"
                style={{ color: 'var(--wm-primary)', fontWeight: 600 }}
              >
                privacy@workmate.ie
              </a>
            </p>
          </Card>

          {/* 2. Data We Collect */}
          <Card>
            <h2
              className="mb-3 text-base font-bold"
              style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
            >
              2. Data We Collect
            </h2>
            <p className="mb-2 text-sm leading-relaxed" style={{ color: 'var(--wm-muted)' }}>
              Depending on how you use the platform, we may collect:
            </p>
            <ul
              className="ml-5 flex list-disc flex-col gap-1 text-sm"
              style={{ color: 'var(--wm-muted)' }}
            >
              <li>
                <strong style={{ color: 'var(--wm-text)' }}>Identity &amp; contact:</strong> full
                name, email address, phone number (normalised to Irish +353 format).
              </li>
              <li>
                <strong style={{ color: 'var(--wm-text)' }}>Location:</strong> Eircode, county,
                and service area preferences.
              </li>
              <li>
                <strong style={{ color: 'var(--wm-text)' }}>Service history:</strong> jobs posted,
                quotes received, bookings made, reviews given and received.
              </li>
              <li>
                <strong style={{ color: 'var(--wm-text)' }}>Payment information:</strong> payment
                is processed by Stripe. WorkMate does not store full card details — we hold only
                Stripe customer and payment intent references.
              </li>
              <li>
                <strong style={{ color: 'var(--wm-text)' }}>Identity verification:</strong>{' '}
                documents uploaded for Garda vetting, business registration, and Safe Pass
                compliance checks.
              </li>
              <li>
                <strong style={{ color: 'var(--wm-text)' }}>Usage data:</strong> browser type, IP
                address, pages visited, and session activity for security and platform improvement.
              </li>
            </ul>
          </Card>

          {/* 3. How We Use Your Data */}
          <Card>
            <h2
              className="mb-3 text-base font-bold"
              style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
            >
              3. How We Use Your Data
            </h2>
            <ul
              className="ml-5 flex list-disc flex-col gap-1 text-sm"
              style={{ color: 'var(--wm-muted)' }}
            >
              <li>Delivering and operating the marketplace platform.</li>
              <li>Matching customers with suitable service providers.</li>
              <li>
                Processing payments and managing the Stripe Connect escrow/hold flow.
              </li>
              <li>Sending transactional emails (booking confirmations, alerts, receipts).</li>
              <li>
                Verifying provider identity, vetting status, and professional qualifications.
              </li>
              <li>Fraud prevention, risk scoring, and platform safety.</li>
              <li>Handling disputes and customer support requests.</li>
              <li>Meeting legal and regulatory obligations under Irish and EU law.</li>
            </ul>
          </Card>

          {/* 4. Legal Basis */}
          <Card>
            <h2
              className="mb-3 text-base font-bold"
              style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
            >
              4. Legal Basis (GDPR Article 6)
            </h2>
            <ul
              className="ml-5 flex list-disc flex-col gap-1 text-sm"
              style={{ color: 'var(--wm-muted)' }}
            >
              <li>
                <strong style={{ color: 'var(--wm-text)' }}>Contract performance</strong> (Art.
                6(1)(b)): processing necessary to provide the service you have signed up for,
                including job posting, quoting, booking, and payment processing.
              </li>
              <li>
                <strong style={{ color: 'var(--wm-text)' }}>Legitimate interests</strong> (Art.
                6(1)(f)): fraud detection, platform security, improving our matching algorithms,
                and sending service-related communications.
              </li>
              <li>
                <strong style={{ color: 'var(--wm-text)' }}>Consent</strong> (Art. 6(1)(a)):
                optional marketing communications and non-essential cookies (where applicable).
              </li>
              <li>
                <strong style={{ color: 'var(--wm-text)' }}>Legal obligation</strong> (Art.
                6(1)(c)): tax records, financial reporting, and compliance with Irish statutory
                requirements.
              </li>
            </ul>
          </Card>

          {/* 5. Data Sharing */}
          <Card>
            <h2
              className="mb-3 text-base font-bold"
              style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
            >
              5. Data Sharing
            </h2>
            <p className="mb-2 text-sm leading-relaxed" style={{ color: 'var(--wm-muted)' }}>
              We do not sell your personal data. We share data only with trusted processors
              required to operate the platform:
            </p>
            <ul
              className="ml-5 flex list-disc flex-col gap-1 text-sm"
              style={{ color: 'var(--wm-muted)' }}
            >
              <li>
                <strong style={{ color: 'var(--wm-text)' }}>Stripe</strong> — payment processing
                and Connect payouts (Stripe Inc., subject to Stripe&apos;s Privacy Policy).
              </li>
              <li>
                <strong style={{ color: 'var(--wm-text)' }}>Resend</strong> — transactional email
                delivery. Sender address: notifications@workmate.ie.
              </li>
              <li>
                <strong style={{ color: 'var(--wm-text)' }}>Supabase</strong> — database and file
                storage (hosted in EU region where available).
              </li>
              <li>
                <strong style={{ color: 'var(--wm-text)' }}>Competent authorities</strong> — where
                required by Irish law, including the Revenue Commissioners and An Garda
                S&iacute;och&aacute;na.
              </li>
            </ul>
          </Card>

          {/* 6. Data Retention */}
          <Card>
            <h2
              className="mb-3 text-base font-bold"
              style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
            >
              6. Data Retention
            </h2>
            <ul
              className="ml-5 flex list-disc flex-col gap-1 text-sm"
              style={{ color: 'var(--wm-muted)' }}
            >
              <li>
                <strong style={{ color: 'var(--wm-text)' }}>Active accounts:</strong> data is
                retained for the duration of your account.
              </li>
              <li>
                <strong style={{ color: 'var(--wm-text)' }}>Post-closure:</strong> financial
                records and transaction history are retained for 7 years after account closure to
                comply with Irish tax and accounting obligations.
              </li>
              <li>
                <strong style={{ color: 'var(--wm-text)' }}>Identity documents:</strong> removed
                from active storage within 30 days of verification approval or as soon as possible
                after rejection.
              </li>
            </ul>
          </Card>

          {/* 7. Your Rights */}
          <Card>
            <h2
              className="mb-3 text-base font-bold"
              style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
            >
              7. Your Rights
            </h2>
            <p className="mb-2 text-sm leading-relaxed" style={{ color: 'var(--wm-muted)' }}>
              Under GDPR you have the right to:
            </p>
            <ul
              className="ml-5 flex list-disc flex-col gap-1 text-sm"
              style={{ color: 'var(--wm-muted)' }}
            >
              <li>
                <strong style={{ color: 'var(--wm-text)' }}>Access</strong> — request a copy of
                the personal data we hold about you.
              </li>
              <li>
                <strong style={{ color: 'var(--wm-text)' }}>Rectification</strong> — have
                inaccurate data corrected.
              </li>
              <li>
                <strong style={{ color: 'var(--wm-text)' }}>Erasure</strong> — request deletion of
                your data (&quot;right to be forgotten&quot;), subject to legal retention
                obligations.
              </li>
              <li>
                <strong style={{ color: 'var(--wm-text)' }}>Portability</strong> — receive your
                data in a structured, machine-readable format.
              </li>
              <li>
                <strong style={{ color: 'var(--wm-text)' }}>Objection</strong> — object to
                processing based on legitimate interests.
              </li>
              <li>
                <strong style={{ color: 'var(--wm-text)' }}>Lodge a complaint</strong> — with the
                Data Protection Commission Ireland at{' '}
                <a
                  href="https://www.dataprotection.ie"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--wm-primary)', fontWeight: 600 }}
                >
                  www.dataprotection.ie
                </a>
                .
              </li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--wm-muted)' }}>
              To exercise any of these rights, email{' '}
              <a
                href="mailto:privacy@workmate.ie"
                style={{ color: 'var(--wm-primary)', fontWeight: 600 }}
              >
                privacy@workmate.ie
              </a>
              . We will respond within 30 days.
            </p>
          </Card>

          {/* 8. Cookies */}
          <Card>
            <h2
              className="mb-3 text-base font-bold"
              style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
            >
              8. Cookies
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--wm-muted)' }}>
              WorkMate uses session cookies strictly necessary to keep you logged in and maintain
              your preferences. We do not place third-party advertising cookies. Analytics cookies,
              if used, are anonymised and subject to consent. You can manage cookie preferences via
              the consent banner displayed on your first visit.
            </p>
          </Card>

          {/* 9. Contact */}
          <Card>
            <h2
              className="mb-3 text-base font-bold"
              style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
            >
              9. Contact &amp; Updates
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--wm-muted)' }}>
              For all privacy enquiries:{' '}
              <a
                href="mailto:privacy@workmate.ie"
                style={{ color: 'var(--wm-primary)', fontWeight: 600 }}
              >
                privacy@workmate.ie
              </a>
              . This policy was last updated in{' '}
              <strong style={{ color: 'var(--wm-text)' }}>March 2026</strong>. We will notify
              registered users of material changes via email with at least 14 days&apos; notice.
            </p>
          </Card>

        </div>
      </div>
    </main>
  );
}
