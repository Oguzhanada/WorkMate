import type { Metadata } from 'next';

import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';

export const metadata: Metadata = {
  title: 'Terms & Conditions — WorkMate',
  description:
    'Terms and conditions governing use of the WorkMate services marketplace in Ireland.',
};

export default function TermsPage() {
  return (
    <main className="py-14">
      <div style={{ width: 'min(860px, calc(100% - 32px))', margin: '0 auto' }}>
        <div className="mb-6">
          <PageHeader
            title="Terms & Conditions"
            description="WorkMate Ltd — Last updated: March 2026"
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
              WorkMate Ltd (&quot;WorkMate&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;)
              operates the WorkMate online services marketplace at workmate.ie, which connects
              customers seeking home and business services with independent service providers across
              Ireland. By accessing or using WorkMate you agree to be bound by these Terms &amp;
              Conditions. If you do not agree, you must not use the platform.
            </p>
          </Card>

          {/* 2. Eligibility */}
          <Card>
            <h2
              className="mb-3 text-base font-bold"
              style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
            >
              2. Eligibility
            </h2>
            <ul
              className="ml-5 flex list-disc flex-col gap-1 text-sm"
              style={{ color: 'var(--wm-muted)' }}
            >
              <li>You must be at least 18 years of age to register or transact on WorkMate.</li>
              <li>
                The platform is intended for use by Irish residents and businesses registered in
                the Republic of Ireland.
              </li>
              <li>
                By registering, you confirm that the information you provide is accurate, current,
                and complete.
              </li>
            </ul>
          </Card>

          {/* 3. Account Registration */}
          <Card>
            <h2
              className="mb-3 text-base font-bold"
              style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
            >
              3. Account Registration
            </h2>
            <ul
              className="ml-5 flex list-disc flex-col gap-1 text-sm"
              style={{ color: 'var(--wm-muted)' }}
            >
              <li>You may only hold one account per individual or business entity.</li>
              <li>
                You are responsible for maintaining the confidentiality of your login credentials
                and for all activity that occurs under your account.
              </li>
              <li>
                You must notify us immediately at{' '}
                <a
                  href="mailto:legal@workmate.ie"
                  style={{ color: 'var(--wm-primary-dark)', fontWeight: 600 }}
                >
                  legal@workmate.ie
                </a>{' '}
                if you suspect unauthorised access to your account.
              </li>
              <li>
                WorkMate reserves the right to suspend or terminate accounts that breach these
                terms.
              </li>
            </ul>
          </Card>

          {/* 4. Service Listings & Job Posts */}
          <Card>
            <h2
              className="mb-3 text-base font-bold"
              style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
            >
              4. Service Listings &amp; Job Posts
            </h2>
            <ul
              className="ml-5 flex list-disc flex-col gap-1 text-sm"
              style={{ color: 'var(--wm-muted)' }}
            >
              <li>
                All job descriptions and service listings must be accurate, truthful, and
                complete.
              </li>
              <li>
                You may not post listings for illegal services, services requiring unlicensed
                practice, or any content that is fraudulent, offensive, or harmful.
              </li>
              <li>
                WorkMate reserves the right to remove any listing or job post that violates these
                terms or our Community Guidelines, without prior notice.
              </li>
              <li>
                Customers are responsible for specifying job requirements accurately to enable fair
                and accurate quoting.
              </li>
            </ul>
          </Card>

          {/* 5. Payments */}
          <Card>
            <h2
              className="mb-3 text-base font-bold"
              style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
            >
              5. Payments
            </h2>
            <p className="mb-2 text-sm leading-relaxed" style={{ color: 'var(--wm-muted)' }}>
              All payments on WorkMate are processed through Stripe Connect. By transacting on the
              platform you agree to Stripe&apos;s Terms of Service in addition to these terms.
            </p>
            <ul
              className="ml-5 flex list-disc flex-col gap-1 text-sm"
              style={{ color: 'var(--wm-muted)' }}
            >
              <li>
                Payments are held in a secure escrow-style hold and released to the provider upon
                job completion and customer confirmation.
              </li>
              <li>
                In the event of a dispute, WorkMate will mediate in good faith. Funds may be held
                pending resolution.
              </li>
              <li>
                All amounts are displayed and charged in Euro (EUR). WorkMate does not accept
                off-platform cash payments for jobs booked through the marketplace.
              </li>
              <li>
                Refunds are subject to WorkMate&apos;s refund and dispute policy, available on
                request.
              </li>
            </ul>
          </Card>

          {/* 6. Provider Obligations */}
          <Card>
            <h2
              className="mb-3 text-base font-bold"
              style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
            >
              6. Provider Obligations
            </h2>
            <ul
              className="ml-5 flex list-disc flex-col gap-1 text-sm"
              style={{ color: 'var(--wm-muted)' }}
            >
              <li>
                Providers must hold <strong style={{ color: 'var(--wm-text)' }}>Verified Pro</strong>{' '}
                status, which requires identity verification via WorkMate&apos;s two-layer
                verification process.
              </li>
              <li>
                Providers working with vulnerable adults or children must hold a valid{' '}
                <strong style={{ color: 'var(--wm-text)' }}>Garda vetting</strong> disclosure
                where required by law or WorkMate policy.
              </li>
              <li>
                Providers are solely responsible for holding appropriate public liability insurance,
                trade qualifications, and any licences required to perform their services under
                Irish law.
              </li>
              <li>
                Providers are independent contractors — not employees or agents of WorkMate. WorkMate
                is not liable for the quality, legality, or safety of services performed.
              </li>
            </ul>
          </Card>

          {/* 7. Fees */}
          <Card>
            <h2
              className="mb-3 text-base font-bold"
              style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
            >
              7. Fees
            </h2>
            <ul
              className="ml-5 flex list-disc flex-col gap-1 text-sm"
              style={{ color: 'var(--wm-muted)' }}
            >
              <li>
                WorkMate charges a platform service fee on each completed job, deducted from the
                provider payout. The applicable fee rate is displayed during the quoting and
                checkout process.
              </li>
              <li>
                Providers may subscribe to a paid subscription tier for enhanced visibility and
                additional platform features. Subscription fees are charged monthly in advance and
                are non-refundable.
              </li>
              <li>
                WorkMate reserves the right to update its fee structure with 30 days&apos; notice
                to affected users.
              </li>
            </ul>
          </Card>

          {/* 8. Prohibited Conduct */}
          <Card>
            <h2
              className="mb-3 text-base font-bold"
              style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
            >
              8. Prohibited Conduct
            </h2>
            <p className="mb-2 text-sm leading-relaxed" style={{ color: 'var(--wm-muted)' }}>
              The following conduct is strictly prohibited on WorkMate:
            </p>
            <ul
              className="ml-5 flex list-disc flex-col gap-1 text-sm"
              style={{ color: 'var(--wm-muted)' }}
            >
              <li>Fraud, impersonation, or misrepresentation of identity or qualifications.</li>
              <li>
                Harassment, abuse, discrimination, or threatening behaviour toward any user.
              </li>
              <li>Posting, soliciting, or submitting fake reviews or ratings.</li>
              <li>
                Circumventing platform payments by arranging off-platform transactions for jobs
                introduced through WorkMate.
              </li>
              <li>Scraping, automated access, or reverse engineering of the platform.</li>
              <li>
                Any activity that violates applicable Irish, EU, or international law.
              </li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--wm-muted)' }}>
              Violation of these prohibitions may result in immediate account suspension, removal
              of funds, and referral to law enforcement authorities.
            </p>
          </Card>

          {/* 9. Limitation of Liability */}
          <Card>
            <h2
              className="mb-3 text-base font-bold"
              style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
            >
              9. Limitation of Liability
            </h2>
            <p className="mb-2 text-sm leading-relaxed" style={{ color: 'var(--wm-muted)' }}>
              WorkMate operates as a marketplace intermediary and is not the employer, principal, or
              agent of any service provider. To the maximum extent permitted by Irish law:
            </p>
            <ul
              className="ml-5 flex list-disc flex-col gap-1 text-sm"
              style={{ color: 'var(--wm-muted)' }}
            >
              <li>
                WorkMate is not liable for any damage, injury, loss, or expense arising from
                services performed by providers found through the platform.
              </li>
              <li>
                Our total aggregate liability to you for any claim arising from or relating to
                these terms or your use of the platform shall not exceed the total fees paid by
                you to WorkMate in the 12 months preceding the claim.
              </li>
              <li>
                Nothing in these terms limits liability for death or personal injury caused by
                negligence, or for fraud or fraudulent misrepresentation.
              </li>
            </ul>
          </Card>

          {/* 10. Governing Law */}
          <Card>
            <h2
              className="mb-3 text-base font-bold"
              style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
            >
              10. Governing Law
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--wm-muted)' }}>
              These Terms &amp; Conditions are governed by and construed in accordance with the
              laws of the Republic of Ireland. Any dispute arising out of or in connection with
              these terms shall be subject to the exclusive jurisdiction of the Irish courts.
            </p>
          </Card>

          {/* 11. Changes to Terms */}
          <Card>
            <h2
              className="mb-3 text-base font-bold"
              style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
            >
              11. Changes to These Terms
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--wm-muted)' }}>
              WorkMate may update these Terms &amp; Conditions from time to time. We will provide
              at least{' '}
              <strong style={{ color: 'var(--wm-text)' }}>30 days&apos; written notice</strong> of
              any material changes via the email address registered to your account. Continued use
              of the platform after the effective date of changes constitutes acceptance of the
              revised terms.
            </p>
          </Card>

          {/* 12. Contact */}
          <Card>
            <h2
              className="mb-3 text-base font-bold"
              style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
            >
              12. Contact
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--wm-muted)' }}>
              For legal enquiries or notices:{' '}
              <a
                href="mailto:legal@workmate.ie"
                style={{ color: 'var(--wm-primary-dark)', fontWeight: 600 }}
              >
                legal@workmate.ie
              </a>
              . This document was last updated in{' '}
              <strong style={{ color: 'var(--wm-text)' }}>March 2026</strong>.
            </p>
          </Card>

        </div>
      </div>
    </main>
  );
}
