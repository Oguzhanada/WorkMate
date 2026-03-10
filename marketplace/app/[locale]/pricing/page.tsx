import type { Metadata } from 'next';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Pricing — WorkMate',
  description:
    'Transparent pricing for customers and service providers. Start free, pay only when you get results. No hidden fees.',
};

/* ─── Data ─── */

type Feature = { text: string; highlight?: boolean };

type ProviderTier = {
  id: 'starter' | 'pro' | 'pro-plus';
  name: string;
  price: string;
  period: string;
  note: string;
  cta: string;
  ctaPath: string;
  popular: boolean;
  features: Feature[];
};

const PROVIDER_TIERS: ProviderTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'Free',
    period: '',
    note: 'No credit card required',
    cta: 'Get started free',
    ctaPath: '/become-provider/apply',
    popular: false,
    features: [
      { text: '5 quotes per month' },
      { text: 'Basic provider profile' },
      { text: 'Public listing on WorkMate' },
      { text: 'Customer messaging' },
      { text: 'Review collection' },
      { text: '3% commission on jobs over €100' },
    ],
  },
  {
    id: 'pro',
    name: 'WorkMate Pro',
    price: '€19',
    period: '/month',
    note: '€179/year (save €49)',
    cta: 'Start Pro — 14 day trial',
    ctaPath: '/become-provider/apply?plan=pro',
    popular: true,
    features: [
      { text: 'Unlimited quotes', highlight: true },
      { text: 'Verified Pro badge', highlight: true },
      { text: 'Priority in search results', highlight: true },
      { text: 'Email + push job alerts' },
      { text: 'Earnings analytics dashboard' },
      { text: 'Repeat booking discount: 1.5% commission', highlight: true },
      { text: 'Customer messaging' },
      { text: 'Review collection' },
    ],
  },
  {
    id: 'pro-plus',
    name: 'WorkMate Pro+',
    price: '€39',
    period: '/month',
    note: '€349/year (save €119)',
    cta: 'Start Pro+ — 14 day trial',
    ctaPath: '/become-provider/apply?plan=pro-plus',
    popular: false,
    features: [
      { text: 'Everything in Pro', highlight: true },
      { text: 'Top Pro badge — featured in category', highlight: true },
      { text: 'AI-powered quote writer', highlight: true },
      { text: 'Smart Match boost (2x visibility)' },
      { text: 'Customer insights & preferences' },
      { text: 'Priority support' },
      { text: '1.5% commission on all jobs', highlight: true },
    ],
  },
];

const FEE_EXAMPLES = [
  { job: 'Garden tidy-up', amount: 80, isFree: true },
  { job: 'Bathroom plumbing repair', amount: 250, isFree: false },
  { job: 'Full house painting', amount: 1200, isFree: false },
];

const FAQ_ITEMS = [
  {
    q: 'Are there any fees for jobs under €100?',
    a: 'No. Jobs under €100 are completely free for both customers and providers. You can arrange payment directly — cash, bank transfer, or Revolut. We believe small jobs should stay simple.',
  },
  {
    q: 'How does the 5% customer service fee work?',
    a: 'For jobs €100 and above, customers pay a 5% service fee on top of the quoted price. This covers Stripe secure payment hold, dispute protection, and the WorkMate Happiness Pledge. For a €250 job, that\'s €12.50.',
  },
  {
    q: 'What does the provider commission cover?',
    a: 'The 3% provider commission (1.5% for Pro/Pro+ subscribers) is deducted from the payout. It covers payment processing, platform maintenance, and customer acquisition. You receive the remaining amount directly to your bank account via Stripe.',
  },
  {
    q: 'How does the repeat booking discount work?',
    a: 'When a customer books the same provider again, the customer fee drops from 5% to 3%, and the provider commission drops to 1.5% (all tiers). This rewards loyalty and encourages long-term working relationships.',
  },
  {
    q: 'When do I get paid?',
    a: 'Payment is held by Stripe when the customer accepts a quote. Once the job is marked as complete and the customer confirms satisfaction, funds are released to your bank account within 2-3 business days via SEPA transfer.',
  },
  {
    q: 'Is there a lock-in or cancellation fee?',
    a: 'No. All subscriptions are month-to-month with no lock-in. Cancel anytime from your dashboard. Annual plans are refunded pro-rata for unused months.',
  },
  {
    q: 'What happens if there\'s a dispute?',
    a: 'WorkMate holds the payment in escrow until the dispute is resolved. Our team reviews evidence from both sides and aims to resolve within 7 days. The Happiness Pledge means customers can request a review within 7 days of job completion.',
  },
  {
    q: 'Do prices include VAT?',
    a: 'All displayed subscription prices include Irish VAT at 23%. Service fees and commissions are calculated on the net job amount. WorkMate is registered for VAT in Ireland (registration pending).',
  },
];

/* ─── Components ─── */

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
    </svg>
  );
}

function ProviderTierCard({ tier, locale }: { tier: ProviderTier; locale: string }) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl p-6 ${tier.popular ? '' : ''}`}
      style={{
        background: 'var(--wm-surface)',
        border: tier.popular ? '2px solid var(--wm-primary)' : '1px solid var(--wm-border)',
        boxShadow: tier.popular ? 'var(--wm-glow-primary), var(--wm-shadow-xl)' : 'var(--wm-shadow-sm)',
      }}
    >
      {tier.popular && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold text-white"
          style={{ background: 'var(--wm-primary)', fontFamily: 'var(--wm-font-display)' }}
        >
          Most Popular
        </div>
      )}

      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--wm-primary)' }}>
          {tier.id === 'starter' ? 'Free forever' : tier.id === 'pro' ? 'For growing pros' : 'For top performers'}
        </span>
        <h3 className="text-xl font-bold" style={{ color: 'var(--wm-navy)', fontFamily: 'var(--wm-font-display)' }}>
          {tier.name}
        </h3>
      </div>

      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-extrabold" style={{ color: 'var(--wm-navy)', fontFamily: 'var(--wm-font-display)' }}>
          {tier.price}
        </span>
        {tier.period && <span className="text-sm" style={{ color: 'var(--wm-muted)' }}>{tier.period}</span>}
      </div>
      <p className="mt-1 text-xs" style={{ color: 'var(--wm-muted)' }}>{tier.note}</p>

      <Button
        href={`/${locale}${tier.ctaPath}`}
        variant={tier.popular ? 'primary' : 'outline'}
        size="lg"
        className="mt-5 w-full justify-center"
      >
        {tier.cta}
      </Button>

      <hr className="my-5" style={{ borderColor: 'var(--wm-border)' }} />

      <ul className="flex flex-col gap-2.5">
        {tier.features.map((f) => (
          <li key={f.text} className="flex items-start gap-2.5">
            <span style={{ color: f.highlight ? 'var(--wm-primary)' : 'var(--wm-muted)' }}>
              <CheckIcon />
            </span>
            <span
              className={`text-sm leading-snug ${f.highlight ? 'font-semibold' : ''}`}
              style={{ color: f.highlight ? 'var(--wm-navy)' : 'var(--wm-text)' }}
            >
              {f.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── Page ─── */

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="min-h-screen" style={{ background: 'var(--wm-bg)' }}>
      {/* Hero */}
      <section className="px-5 pb-16 pt-12 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <span
            className="text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: 'var(--wm-primary)', fontFamily: 'var(--wm-font-display)' }}
          >
            Pricing
          </span>
          <h1
            className="mt-3"
            style={{
              fontFamily: 'var(--wm-font-display)',
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: 'var(--wm-navy)',
            }}
          >
            Transparent pricing.<br />No surprises.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed" style={{ color: 'var(--wm-muted)' }}>
            Post jobs for free. Pay a small service fee only when work gets done through the platform.
            Providers start free and upgrade as their business grows.
          </p>
        </div>
      </section>

      {/* ─── SECTION 1: Customer Fees ─── */}
      <section className="px-5 pb-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <h2
            className="mb-3 text-sm font-bold uppercase tracking-[0.15em]"
            style={{ color: 'var(--wm-primary)', fontFamily: 'var(--wm-font-display)' }}
          >
            For customers
          </h2>
          <h3
            className="mb-8"
            style={{
              fontFamily: 'var(--wm-font-display)',
              fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
              fontWeight: 800,
              color: 'var(--wm-navy)',
              letterSpacing: '-0.02em',
            }}
          >
            Pay only when you&apos;re satisfied.
          </h3>

          {/* Two-column: explanation + examples */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left: fee breakdown */}
            <div className="space-y-6">
              {/* Under €100 */}
              <Card>
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-black"
                    style={{ background: 'var(--wm-primary-faint)', color: 'var(--wm-primary)', fontFamily: 'var(--wm-font-display)' }}
                  >
                    €0
                  </div>
                  <div>
                    <h4 className="font-bold" style={{ color: 'var(--wm-navy)' }}>Jobs under €100</h4>
                    <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--wm-muted)' }}>
                      No fees at all. Arrange payment directly with your provider — cash, bank transfer, or Revolut.
                      We believe small jobs should stay simple.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Over €100 */}
              <Card>
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-black"
                    style={{ background: 'var(--wm-blue-soft)', color: 'var(--wm-blue)', fontFamily: 'var(--wm-font-display)' }}
                  >
                    5%
                  </div>
                  <div>
                    <h4 className="font-bold" style={{ color: 'var(--wm-navy)' }}>Jobs €100 and above</h4>
                    <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--wm-muted)' }}>
                      A 5% service fee is added to the quoted price. This covers Stripe secure payment hold,
                      dispute protection, and the WorkMate Happiness Pledge.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Repeat booking */}
              <Card>
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-black"
                    style={{ background: 'var(--wm-amber-light)', color: 'var(--wm-amber-dark)', fontFamily: 'var(--wm-font-display)' }}
                  >
                    3%
                  </div>
                  <div>
                    <h4 className="font-bold" style={{ color: 'var(--wm-navy)' }}>Repeat bookings</h4>
                    <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--wm-muted)' }}>
                      Rebook the same provider? Your fee drops to 3%. Loyalty rewarded — both you and your
                      provider benefit from working together again.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right: real examples */}
            <div
              className="rounded-2xl p-6"
              style={{ background: 'var(--wm-surface)', border: '1px solid var(--wm-border)' }}
            >
              <h4 className="mb-5 text-sm font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--wm-navy)' }}>
                Real-world examples
              </h4>
              <div className="space-y-4">
                {FEE_EXAMPLES.map((ex) => {
                  const fee = ex.isFree ? 0 : ex.amount * 0.05;
                  const total = ex.amount + fee;
                  return (
                    <div
                      key={ex.job}
                      className="rounded-xl p-4"
                      style={{ background: 'var(--wm-bg)', border: '1px solid var(--wm-border)' }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold" style={{ color: 'var(--wm-navy)' }}>{ex.job}</span>
                        {ex.isFree && (
                          <span
                            className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                            style={{ background: 'var(--wm-primary-faint)', color: 'var(--wm-primary)' }}
                          >
                            No fees
                          </span>
                        )}
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                        <div>
                          <span className="block text-xs" style={{ color: 'var(--wm-muted)' }}>Quote</span>
                          <span className="text-sm font-bold" style={{ color: 'var(--wm-navy)' }}>€{ex.amount}</span>
                        </div>
                        <div>
                          <span className="block text-xs" style={{ color: 'var(--wm-muted)' }}>Fee</span>
                          <span className="text-sm font-bold" style={{ color: ex.isFree ? 'var(--wm-primary)' : 'var(--wm-navy)' }}>
                            {ex.isFree ? '€0' : `€${fee.toFixed(2)}`}
                          </span>
                        </div>
                        <div>
                          <span className="block text-xs" style={{ color: 'var(--wm-muted)' }}>You pay</span>
                          <span className="text-sm font-extrabold" style={{ color: 'var(--wm-navy)', fontFamily: 'var(--wm-font-display)' }}>
                            €{total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Comparison */}
              <div className="mt-6 rounded-xl p-4" style={{ background: 'var(--wm-primary-faint)' }}>
                <p className="text-xs font-bold" style={{ color: 'var(--wm-primary-dark)' }}>
                  How WorkMate compares
                </p>
                <div className="mt-2 space-y-1.5">
                  {[
                    { name: 'WorkMate', fee: '5%', highlight: true },
                    { name: 'TaskRabbit', fee: '15%', highlight: false },
                    { name: 'Bark', fee: '€2-€15 per lead (no job guarantee)', highlight: false },
                    { name: 'MyBuilder', fee: '8-12% + subscription', highlight: false },
                  ].map((c) => (
                    <div key={c.name} className="flex items-center justify-between text-sm">
                      <span style={{ color: c.highlight ? 'var(--wm-primary-dark)' : 'var(--wm-muted)', fontWeight: c.highlight ? 700 : 400 }}>
                        {c.name}
                      </span>
                      <span style={{ color: c.highlight ? 'var(--wm-primary-dark)' : 'var(--wm-muted)', fontWeight: c.highlight ? 700 : 400 }}>
                        {c.fee}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: Provider Tiers ─── */}
      <section
        className="px-5 py-20 sm:px-8 lg:px-12"
        style={{ background: 'linear-gradient(180deg, rgba(240,253,244,0.3) 0%, var(--wm-bg) 100%)' }}
      >
        <div className="mx-auto max-w-5xl">
          <h2
            className="mb-3 text-sm font-bold uppercase tracking-[0.15em]"
            style={{ color: 'var(--wm-primary)', fontFamily: 'var(--wm-font-display)' }}
          >
            For providers
          </h2>
          <h3
            className="mb-4"
            style={{
              fontFamily: 'var(--wm-font-display)',
              fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
              fontWeight: 800,
              color: 'var(--wm-navy)',
              letterSpacing: '-0.02em',
            }}
          >
            Start free. Grow at your own pace.
          </h3>
          <p className="mb-10 max-w-2xl text-base leading-relaxed" style={{ color: 'var(--wm-muted)' }}>
            Every plan includes a public WorkMate profile, customer messaging, and review collection.
            Upgrade to unlock more quotes, priority visibility, and lower commission rates.
          </p>

          {/* Tier grid */}
          <div className="grid gap-6 sm:grid-cols-3">
            {PROVIDER_TIERS.map((tier) => (
              <ProviderTierCard key={tier.id} tier={tier} locale={locale} />
            ))}
          </div>

          {/* Provider fee breakdown */}
          <div
            className="mt-10 rounded-2xl p-6"
            style={{ background: 'var(--wm-surface)', border: '1px solid var(--wm-border)' }}
          >
            <h4 className="mb-4 text-sm font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--wm-navy)' }}>
              Provider commission explained
            </h4>
            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <span className="text-2xl font-extrabold" style={{ color: 'var(--wm-navy)', fontFamily: 'var(--wm-font-display)' }}>3%</span>
                <span className="ml-1 text-sm" style={{ color: 'var(--wm-muted)' }}>Starter</span>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--wm-muted)' }}>
                  On a €250 job, we deduct €7.50 — you receive €242.50 to your bank account.
                </p>
              </div>
              <div>
                <span className="text-2xl font-extrabold" style={{ color: 'var(--wm-primary)', fontFamily: 'var(--wm-font-display)' }}>1.5%</span>
                <span className="ml-1 text-sm" style={{ color: 'var(--wm-muted)' }}>Pro & Pro+</span>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--wm-muted)' }}>
                  On a €250 job, we deduct €3.75 — you receive €246.25. Save €45/year on average.
                </p>
              </div>
              <div>
                <span className="text-2xl font-extrabold" style={{ color: 'var(--wm-amber-dark)', fontFamily: 'var(--wm-font-display)' }}>0%</span>
                <span className="ml-1 text-sm" style={{ color: 'var(--wm-muted)' }}>Under €100</span>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--wm-muted)' }}>
                  No commission on small jobs. Keep every cent. Payment arranged directly with the customer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: How Payment Works ─── */}
      <section className="px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <h2
            className="mb-10 text-center"
            style={{
              fontFamily: 'var(--wm-font-display)',
              fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
              fontWeight: 800,
              color: 'var(--wm-navy)',
              letterSpacing: '-0.02em',
            }}
          >
            How payment works
          </h2>

          <div className="grid gap-4 sm:grid-cols-4">
            {[
              { step: '1', title: 'Customer posts job', desc: 'Free to post. Set your budget and requirements.' },
              { step: '2', title: 'Provider sends quote', desc: 'Customer reviews offers and accepts the best one.' },
              { step: '3', title: 'Payment held by Stripe', desc: 'Secure escrow. Provider starts the work with confidence.' },
              { step: '4', title: 'Customer approves', desc: 'Funds released to provider within 2-3 business days.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div
                  className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full text-sm font-black"
                  style={{ background: 'var(--wm-primary-faint)', color: 'var(--wm-primary)', fontFamily: 'var(--wm-font-display)' }}
                >
                  {s.step}
                </div>
                <h4 className="text-sm font-bold" style={{ color: 'var(--wm-navy)' }}>{s.title}</h4>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--wm-muted)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: FAQ ─── */}
      <section
        className="px-5 py-20 sm:px-8 lg:px-12"
        style={{ background: 'linear-gradient(180deg, rgba(240,253,244,0.2) 0%, var(--wm-bg) 100%)' }}
      >
        <div className="mx-auto max-w-3xl">
          <h2
            className="mb-10 text-center"
            style={{
              fontFamily: 'var(--wm-font-display)',
              fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
              fontWeight: 800,
              color: 'var(--wm-navy)',
              letterSpacing: '-0.02em',
            }}
          >
            Frequently asked questions
          </h2>

          <div className="space-y-4">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl"
                style={{ background: 'var(--wm-surface)', border: '1px solid var(--wm-border)' }}
              >
                <summary
                  className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold"
                  style={{ color: 'var(--wm-navy)' }}
                >
                  {item.q}
                  <span
                    className="ml-3 shrink-0 text-lg transition-transform duration-200 group-open:rotate-45"
                    style={{ color: 'var(--wm-muted)' }}
                  >
                    +
                  </span>
                </summary>
                <div className="px-5 pb-4">
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--wm-muted)' }}>
                    {item.a}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="px-5 pb-20 sm:px-8 lg:px-12">
        <div
          className="mx-auto max-w-5xl rounded-2xl px-8 py-12 text-center sm:py-16"
          style={{
            background: 'linear-gradient(155deg, var(--wm-navy) 0%, #0c1a2e 100%)',
          }}
        >
          <h2
            className="text-white"
            style={{
              fontFamily: 'var(--wm-font-display)',
              fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
            }}
          >
            Ready to get started?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Post your first job for free or sign up as a provider. No credit card required.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={`/${locale}/post-job`}
              className="inline-flex items-center rounded-full px-7 py-3 text-sm font-bold"
              style={{ background: 'white', color: 'var(--wm-navy)', fontFamily: 'var(--wm-font-display)' }}
            >
              Post a Job — Free
            </Link>
            <Link
              href={`/${locale}/become-provider`}
              className="inline-flex items-center rounded-full px-7 py-3 text-sm font-semibold text-white"
              style={{ background: 'var(--wm-grad-primary)', fontFamily: 'var(--wm-font-display)' }}
            >
              Become a Provider
            </Link>
          </div>
        </div>
      </section>

      {/* Footer note */}
      <div className="px-5 pb-12 text-center">
        <p className="text-xs" style={{ color: 'var(--wm-muted)' }}>
          All prices include VAT at 23% where applicable. Subscription plans can be cancelled at any time — no lock-in.
          Questions?{' '}
          <a href="mailto:support@workmate.ie" className="underline" style={{ color: 'var(--wm-primary)' }}>
            Contact support
          </a>
          .
        </p>
      </div>
    </div>
  );
}
