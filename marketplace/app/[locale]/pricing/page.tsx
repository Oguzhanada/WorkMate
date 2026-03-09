import type { Metadata } from 'next';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Pricing — WorkMate',
  description: 'Simple, transparent pricing for service providers on WorkMate. Start free or unlock more with a Professional or Premium plan.',
};

type Feature = string;

type Tier = {
  id: 'basic' | 'professional' | 'premium';
  name: string;
  price: string;
  priceNote: string;
  cta: string;
  ctaHref: string;
  popular: boolean;
  features: Feature[];
};

type TierDef = Omit<Tier, 'ctaHref'> & { ctaPath: string };

const TIER_DEFS: TierDef[] = [
  {
    id: 'basic',
    name: 'Starter',
    price: 'Free',
    priceNote: 'No credit card required',
    cta: 'Get started free',
    ctaPath: '/auth/register',
    popular: false,
    features: [
      '3 job bids per month',
      'Basic provider profile',
      'Public listing on WorkMate',
      'Customer messaging',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '€29',
    priceNote: 'per month, billed monthly',
    cta: 'Start Professional',
    ctaPath: '/auth/register?plan=professional',
    popular: true,
    features: [
      '20 job bids per month',
      'Verified badge on profile',
      'Priority listing in search results',
      'Email job alerts',
      'Customer messaging',
      'Public listing on WorkMate',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '€59',
    priceNote: 'per month, billed monthly',
    cta: 'Start Premium',
    ctaPath: '/auth/register?plan=premium',
    popular: false,
    features: [
      'Unlimited job bids',
      'Top Pro badge on profile',
      'Smart Match boost in search',
      'AI-powered job alerts',
      'Priority listing in search results',
      'Dedicated support',
      'Customer messaging',
      'Public listing on WorkMate',
    ],
  },
];

function buildTiers(locale: string): Tier[] {
  return TIER_DEFS.map((def) => ({
    ...def,
    ctaHref: `/${locale}${def.ctaPath}`,
  }));
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function TierCard({ tier }: { tier: Tier }) {
  return (
    <Card
      hover
      className={tier.popular ? 'relative' : ''}
      {...(tier.popular
        ? {
            style: {
              borderColor: 'var(--wm-primary)',
              boxShadow: 'var(--wm-glow-primary), var(--wm-shadow-xl)',
            } as React.CSSProperties,
          }
        : {})}
    >
      {tier.popular && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-xs font-semibold text-white"
          style={{ background: 'var(--wm-primary)', fontFamily: 'var(--wm-font-sans)' }}
        >
          Most Popular
        </div>
      )}

      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--wm-primary)', fontFamily: 'var(--wm-font-sans)' }}
          >
            {tier.id}
          </span>
          <h2
            className="text-xl font-bold leading-tight"
            style={{ color: 'var(--wm-navy)', fontFamily: 'var(--wm-font-display)' }}
          >
            {tier.name}
          </h2>
        </div>

        {/* Price */}
        <div className="flex flex-col gap-0.5">
          <div
            className="text-4xl font-bold leading-none"
            style={{ color: 'var(--wm-navy)', fontFamily: 'var(--wm-font-display)' }}
          >
            {tier.price}
          </div>
          <span className="text-xs" style={{ color: 'var(--wm-muted)' }}>
            {tier.priceNote}
          </span>
        </div>

        {/* CTA */}
        <Button
          href={tier.ctaHref}
          variant={tier.popular ? 'primary' : 'outline'}
          size="lg"
          className="w-full justify-center"
        >
          {tier.cta}
        </Button>

        {/* Divider */}
        <hr style={{ borderColor: 'var(--wm-border)' }} />

        {/* Features */}
        <ul className="flex flex-col gap-2.5">
          {tier.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5">
              <span style={{ color: 'var(--wm-primary)' }}>
                <CheckIcon />
              </span>
              <span className="text-sm leading-snug" style={{ color: 'var(--wm-text)' }}>
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tiers = buildTiers(locale);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <PageHeader
        title="Pricing"
        description="Start free and upgrade as your business grows. All plans include a public WorkMate profile."
      />

      {/* Tier grid */}
      <div className="grid gap-6 sm:grid-cols-3">
        {tiers.map((tier) => (
          <TierCard key={tier.id} tier={tier} />
        ))}
      </div>

      {/* Footer note */}
      <p className="text-center text-sm" style={{ color: 'var(--wm-muted)' }}>
        All prices include VAT where applicable. Cancel any time — no lock-in.
        Questions?{' '}
        <a
          href="mailto:support@workmate.ie"
          className="underline underline-offset-2 transition-colors hover:no-underline"
          style={{ color: 'var(--wm-primary)' }}
        >
          Contact support
        </a>
        .
      </p>
    </div>
  );
}
