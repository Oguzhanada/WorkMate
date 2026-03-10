'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getLocaleRoot, withLocalePrefix } from '@/lib/i18n/locale-path';

type Subscription = {
  plan: 'basic' | 'professional' | 'premium';
  status: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
};

const PLAN_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  basic: { label: 'Basic', color: 'var(--wm-muted)', bg: 'var(--wm-bg)' },
  professional: { label: 'Professional', color: 'var(--wm-blue)', bg: 'var(--wm-blue-soft)' },
  premium: { label: 'Premium', color: 'var(--wm-primary-dark)', bg: 'var(--wm-primary-faint)' },
};

export default function ProviderSubscriptionWidget() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const pricingHref = withLocalePrefix(getLocaleRoot(pathname), '/pricing');

  useEffect(() => {
    fetch('/api/subscriptions')
      .then((res) => res.json())
      .then((payload: { subscription?: Subscription }) => {
        setSubscription(payload.subscription ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p style={{ color: 'var(--wm-muted)', fontSize: '0.875rem', margin: 0 }}>Loading subscription...</p>;
  }

  if (!subscription) return null;

  const plan = PLAN_LABELS[subscription.plan] ?? PLAN_LABELS.basic;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
      <div>
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--wm-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Current Plan
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
          <span
            style={{
              background: plan.bg,
              color: plan.color,
              borderRadius: '999px',
              padding: '0.2rem 0.65rem',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            {plan.label}
          </span>
          <span style={{ fontSize: '0.82rem', color: 'var(--wm-muted)' }}>
            {subscription.status === 'trialing' ? 'Free trial' : subscription.status}
          </span>
        </div>
        {subscription.cancel_at_period_end && subscription.current_period_end ? (
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--wm-amber)' }}>
            Cancels on {new Date(subscription.current_period_end).toLocaleDateString('en-IE')}
          </p>
        ) : null}
      </div>
      {subscription.plan === 'basic' ? (
        <a
          href={pricingHref}
          style={{
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.45rem 0.9rem',
            background: 'var(--wm-primary)',
            color: 'var(--wm-bg)',
            fontWeight: 700,
            fontSize: '0.82rem',
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          Upgrade
        </a>
      ) : null}
    </div>
  );
}
