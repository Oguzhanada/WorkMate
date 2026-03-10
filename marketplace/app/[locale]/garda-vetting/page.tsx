import type { Metadata } from 'next';
import Link from 'next/link';

import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';

export const metadata: Metadata = {
  title: 'Garda Vetting for Service Providers — WorkMate',
  description:
    'How Garda Vetting works in Ireland, what providers need to know, and how WorkMate facilitates the National Vetting Bureau process.',
};

/* ── Static data ── */

const PROCESS_STEPS = [
  {
    num: '1',
    title: 'Express interest via your dashboard',
    desc: 'Log in to your WorkMate provider dashboard and request Garda Vetting through the dedicated widget. This registers your intent with our team.',
  },
  {
    num: '2',
    title: 'WorkMate submits the NVB application',
    desc: 'As a registered organisation with the National Vetting Bureau, WorkMate (or our vetting partner) submits a vetting invitation to the NVB e-Vetting system on your behalf. You will receive an email from vetting@garda.ie with a link to complete your part.',
  },
  {
    num: '3',
    title: 'Complete the NVB e-Vetting form',
    desc: 'You fill in the official e-Vetting form online (personal details, address history, etc.). This is submitted directly to the National Vetting Bureau — WorkMate never sees your form answers.',
  },
  {
    num: '4',
    title: 'NVB processes the disclosure',
    desc: 'The National Vetting Bureau checks criminal records and relevant information. Processing typically takes 2 to 4 weeks, though it can take longer during busy periods.',
  },
  {
    num: '5',
    title: 'Disclosure result shared',
    desc: 'The NVB sends the vetting disclosure to WorkMate (as the registered organisation). We update your profile status. You also receive a copy for your own records.',
  },
];

const DOCUMENTS_NEEDED = [
  'Valid government-issued photo ID (passport, driving licence, or Public Services Card)',
  'Proof of current address (utility bill, bank statement, or Revenue correspondence dated within the last 6 months)',
  'Your PPS number',
  'Full address history for the past 5 years',
  'Details of any name changes (e.g. marriage certificate, deed poll)',
];

const FAQ_ITEMS = [
  {
    q: 'Can I apply for Garda Vetting myself, without WorkMate?',
    a: 'No. Under Irish law (National Vetting Bureau (Children and Vulnerable Persons) Acts 2012-2016), individuals cannot self-apply for vetting. Applications must go through a registered organisation. WorkMate acts as (or partners with) a registered organisation to facilitate this for our providers.',
  },
  {
    q: 'How long does vetting take?',
    a: 'The NVB aims to process most applications within 2 to 4 weeks. However, complex cases or high-demand periods may take longer. WorkMate has no control over NVB processing times.',
  },
  {
    q: 'How long is my vetting disclosure valid?',
    a: 'There is no fixed legal expiry date for Garda Vetting disclosures. However, best practice (and most employers/organisations) require re-vetting every 3 to 5 years. WorkMate follows a 3-year re-vetting cycle to maintain trust on the platform.',
  },
  {
    q: 'Does Garda Vetting guarantee a clean record?',
    a: 'No. A vetting disclosure shows information held by An Garda Siochana and other relevant bodies at the time of the check. It is a point-in-time disclosure, not a guarantee of future behaviour. WorkMate uses vetting as one part of our trust and safety framework.',
  },
  {
    q: 'What if my disclosure shows criminal history?',
    a: 'A disclosure that contains information does not automatically prevent you from working on WorkMate. Each case is assessed individually, considering the nature and relevance of the information to the services you provide. The Spent Convictions Act 2016 may also apply.',
  },
  {
    q: 'Is Garda Vetting mandatory on WorkMate?',
    a: 'Garda Vetting is legally required for anyone working with children or vulnerable adults. For other service categories, it is not mandatory but strongly encouraged. Vetted providers receive a "Garda Vetted" badge on their profile, which increases customer trust and booking rates.',
  },
  {
    q: 'Is there a cost for Garda Vetting?',
    a: 'WorkMate covers the cost of Garda Vetting for all active providers on the platform. There is no charge to you.',
  },
  {
    q: 'What is "specified information" on a disclosure?',
    a: 'Under the 2012 Act, the NVB may disclose "specified information" — information that may not amount to a criminal conviction but is considered relevant to your suitability for work with children or vulnerable adults. This could include ongoing investigations or soft intelligence.',
  },
];

/* ── Page ── */

export default async function GardaVettingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <main className="py-14">
      <div style={{ width: 'min(860px, calc(100% - 32px))', margin: '0 auto' }}>
        <div className="mb-6">
          <PageHeader
            title="Garda Vetting for Providers"
            description="How the National Vetting Bureau process works and what you need to know"
          />
        </div>

        <div className="flex flex-col gap-5">
          {/* What is Garda Vetting */}
          <Card>
            <h2
              className="mb-3 text-lg font-bold"
              style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
            >
              What is Garda Vetting?
            </h2>
            <div
              className="flex flex-col gap-3 text-sm leading-relaxed"
              style={{ color: 'var(--wm-foreground)' }}
            >
              <p style={{ margin: 0 }}>
                Garda Vetting is the process by which An Garda Siochana discloses criminal record
                information and specified information to registered organisations. It is managed by the{' '}
                <strong>National Vetting Bureau (NVB)</strong>, which operates under the{' '}
                <em>National Vetting Bureau (Children and Vulnerable Persons) Acts 2012 to 2016</em>.
              </p>
              <p style={{ margin: 0 }}>
                Under Irish law, any person who works or volunteers with children or vulnerable adults
                must be vetted through the NVB. This is a legal requirement, not optional.
              </p>
              <p style={{ margin: 0 }}>
                For tradespeople and service providers who do not work directly with vulnerable groups,
                Garda Vetting is not legally required but is increasingly expected by customers as a
                trust signal — particularly for providers who enter clients&apos; homes.
              </p>
            </div>
          </Card>

          {/* How WorkMate facilitates it */}
          <Card>
            <h2
              className="mb-3 text-lg font-bold"
              style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
            >
              How WorkMate facilitates vetting
            </h2>
            <div
              className="flex flex-col gap-3 text-sm leading-relaxed"
              style={{ color: 'var(--wm-foreground)' }}
            >
              <p style={{ margin: 0 }}>
                Individuals cannot self-apply for Garda Vetting — applications must be submitted by a{' '}
                <strong>registered organisation</strong> with the NVB. WorkMate is in the process of
                completing its registration as an authorised organisation with the National Vetting
                Bureau.
              </p>
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'var(--wm-primary-faint)',
                  border: '1px solid var(--wm-border)',
                }}
              >
                <p
                  className="text-sm font-semibold"
                  style={{ margin: 0, color: 'var(--wm-primary)' }}
                >
                  NVB Registration Status: Pending
                </p>
                <p className="mt-1 text-xs" style={{ margin: 0, color: 'var(--wm-muted)' }}>
                  WorkMate&apos;s registration with the National Vetting Bureau is currently being
                  processed. In the interim, we partner with established registered organisations to
                  facilitate vetting for providers who need it. We will update this page once our
                  direct registration is confirmed.
                </p>
              </div>
              <p style={{ margin: 0 }}>
                When you request Garda Vetting through your WorkMate dashboard, we handle the
                administrative process — submitting the NVB invitation, tracking the status, and
                updating your profile once the disclosure is received. You never need to find a
                registered organisation yourself.
              </p>
            </div>
          </Card>

          {/* The process step by step */}
          <Card>
            <h2
              className="mb-4 text-lg font-bold"
              style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
            >
              The process, step by step
            </h2>
            <div className="flex flex-col gap-4">
              {PROCESS_STEPS.map((step) => (
                <div key={step.num} className="flex gap-3">
                  <div
                    className="flex shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    style={{
                      width: '2rem',
                      height: '2rem',
                      background: 'var(--wm-primary)',
                      color: '#fff',
                      fontFamily: 'var(--wm-font-display)',
                    }}
                  >
                    {step.num}
                  </div>
                  <div className="min-w-0">
                    <h3
                      className="text-sm font-semibold"
                      style={{ margin: 0, color: 'var(--wm-foreground)' }}
                    >
                      {step.title}
                    </h3>
                    <p
                      className="mt-1 text-sm leading-relaxed"
                      style={{ margin: 0, color: 'var(--wm-muted)' }}
                    >
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Timeline */}
          <Card>
            <h2
              className="mb-3 text-lg font-bold"
              style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
            >
              Expected timeline
            </h2>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Request via dashboard', time: 'Instant' },
                { label: 'NVB invitation sent to you', time: '1 - 3 business days' },
                { label: 'You complete e-Vetting form', time: 'Up to you (link valid 30 days)' },
                { label: 'NVB processing', time: '2 - 4 weeks (typically)' },
                { label: 'Profile updated', time: 'Within 24 hours of disclosure' },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm"
                  style={{ background: 'var(--wm-surface)', border: '1px solid var(--wm-border)' }}
                >
                  <span style={{ color: 'var(--wm-foreground)' }}>{row.label}</span>
                  <span
                    className="shrink-0 font-semibold"
                    style={{ color: 'var(--wm-primary)' }}
                  >
                    {row.time}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs" style={{ color: 'var(--wm-muted)' }}>
              Total end-to-end: approximately 3 to 5 weeks. WorkMate has no control over NVB
              processing times.
            </p>
          </Card>

          {/* Documents needed */}
          <Card>
            <h2
              className="mb-3 text-lg font-bold"
              style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
            >
              What you will need
            </h2>
            <p className="mb-3 text-sm" style={{ color: 'var(--wm-muted)' }}>
              Have these ready before starting the NVB e-Vetting form:
            </p>
            <ul className="flex flex-col gap-2">
              {DOCUMENTS_NEEDED.map((doc) => (
                <li
                  key={doc}
                  className="flex items-start gap-2 text-sm"
                  style={{ color: 'var(--wm-foreground)' }}
                >
                  <span
                    className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: 'var(--wm-primary)' }}
                  />
                  {doc}
                </li>
              ))}
            </ul>
          </Card>

          {/* Re-vetting */}
          <Card>
            <h2
              className="mb-3 text-lg font-bold"
              style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
            >
              Re-vetting requirements
            </h2>
            <div
              className="flex flex-col gap-3 text-sm leading-relaxed"
              style={{ color: 'var(--wm-foreground)' }}
            >
              <p style={{ margin: 0 }}>
                While there is no legally mandated expiry on Garda Vetting disclosures, best practice
                across Irish organisations is to re-vet every <strong>3 to 5 years</strong>. WorkMate
                follows a <strong>3-year re-vetting cycle</strong>.
              </p>
              <p style={{ margin: 0 }}>
                You will receive reminders via email and your dashboard 90 days, 30 days, and 7 days
                before your disclosure is due for renewal. The re-vetting process is the same as the
                initial application.
              </p>
              <p style={{ margin: 0 }}>
                If your vetting expires and you have not re-applied, your &quot;Garda Vetted&quot;
                badge will be removed from your public profile. You can re-apply at any time to
                restore it.
              </p>
            </div>
          </Card>

          {/* FAQ */}
          <Card>
            <h2
              className="mb-4 text-lg font-bold"
              style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
            >
              Frequently asked questions
            </h2>
            <div className="flex flex-col gap-4">
              {FAQ_ITEMS.map((item) => (
                <div key={item.q}>
                  <h3
                    className="text-sm font-semibold"
                    style={{ margin: 0, color: 'var(--wm-foreground)' }}
                  >
                    {item.q}
                  </h3>
                  <p
                    className="mt-1 text-sm leading-relaxed"
                    style={{ margin: 0, color: 'var(--wm-muted)' }}
                  >
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Legal references */}
          <Card>
            <h2
              className="mb-3 text-lg font-bold"
              style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
            >
              Legal references
            </h2>
            <ul className="flex flex-col gap-2 text-sm" style={{ color: 'var(--wm-muted)' }}>
              <li>
                National Vetting Bureau (Children and Vulnerable Persons) Act 2012 (No. 47 of 2012)
              </li>
              <li>
                National Vetting Bureau (Children and Vulnerable Persons) (Amendment) Act 2016
              </li>
              <li>
                Spent Convictions and Certain Disclosures Act 2016
              </li>
              <li>
                NVB official website:{' '}
                <a
                  href="https://vetting.garda.ie"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--wm-primary)', textDecoration: 'underline' }}
                >
                  vetting.garda.ie
                </a>
              </li>
            </ul>
          </Card>

          {/* CTA for providers */}
          <div
            className="rounded-2xl p-6 text-center"
            style={{
              background: 'var(--wm-surface)',
              border: '1px solid var(--wm-border)',
              boxShadow: 'var(--wm-shadow-md)',
            }}
          >
            <h2
              className="mb-2 text-lg font-bold"
              style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
            >
              Ready to get vetted?
            </h2>
            <p className="mb-4 text-sm" style={{ color: 'var(--wm-muted)' }}>
              If you are already a WorkMate provider, request Garda Vetting from your dashboard.
              If you are new, sign up first.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href={`/${locale}/dashboard`}
                className="inline-flex items-center rounded-xl px-5 py-2.5 text-sm font-semibold"
                style={{
                  background: 'var(--wm-primary)',
                  color: '#fff',
                }}
              >
                Go to dashboard
              </Link>
              <Link
                href={`/${locale}/become-provider`}
                className="inline-flex items-center rounded-xl border px-5 py-2.5 text-sm font-semibold"
                style={{
                  borderColor: 'var(--wm-border)',
                  color: 'var(--wm-foreground)',
                  background: 'var(--wm-surface)',
                }}
              >
                Become a provider
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
