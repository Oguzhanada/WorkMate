'use client';

import { useState } from 'react';
import { Shield, AlertTriangle, Clock, CreditCard } from 'lucide-react';
import { CUSTOMER_FEE_TIERS } from '@/lib/pricing/fee-calculator';

type Props = {
  priceCents: number;
  providerName: string;
  onCancel: () => void;
  onConfirm: () => void;
};

function getServiceFeeCents(subtotalCents: number): number {
  const subtotalEur = subtotalCents / 100;
  const tier = CUSTOMER_FEE_TIERS.find((t) => subtotalEur >= t.min && subtotalEur <= t.max);
  const rate = tier ? tier.rate : 0;
  return Math.round(subtotalCents * rate);
}

function formatEur(cents: number): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export default function AcceptOfferModal({ priceCents, providerName, onCancel, onConfirm }: Props) {
  const [agreed, setAgreed] = useState(false);

  const serviceFeeCents = getServiceFeeCents(priceCents);
  const totalCents = priceCents + serviceFeeCents;

  return (
    /* Backdrop */
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="accept-offer-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(2px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      {/* Panel */}
      <div
        style={{
          width: '100%',
          maxWidth: '32rem',
          borderRadius: 'var(--wm-radius-2xl)',
          background: 'var(--wm-surface)',
          border: '1px solid var(--wm-border)',
          boxShadow: 'var(--wm-shadow-2xl)',
          padding: '1.75rem',
          display: 'grid',
          gap: '1.25rem',
        }}
      >
        {/* Header */}
        <div>
          <h3
            id="accept-offer-modal-title"
            style={{
              margin: 0,
              fontFamily: 'var(--wm-font-display)',
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--wm-navy)',
              letterSpacing: '-0.02em',
            }}
          >
            Confirm offer acceptance
          </h3>
          <p
            style={{
              margin: '0.35rem 0 0',
              fontSize: '0.875rem',
              color: 'var(--wm-muted)',
            }}
          >
            From <strong style={{ color: 'var(--wm-text)' }}>{providerName}</strong>
          </p>
        </div>

        {/* Amount breakdown */}
        <div
          style={{
            borderRadius: 'var(--wm-radius-lg)',
            border: '1px solid var(--wm-border)',
            background: 'var(--wm-bg)',
            padding: '1rem 1.125rem',
          }}
        >
          <p
            style={{
              margin: '0 0 0.75rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--wm-muted)',
            }}
          >
            Payment summary
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--wm-text)' }}>Provider fee</span>
              <span style={{ color: 'var(--wm-text)', fontWeight: 600 }}>{formatEur(priceCents)}</span>
            </div>
            {serviceFeeCents > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--wm-muted)' }}>Service fee</span>
                <span style={{ color: 'var(--wm-muted)' }}>{formatEur(serviceFeeCents)}</span>
              </div>
            ) : null}
            <div
              style={{
                borderTop: '1px solid var(--wm-border)',
                paddingTop: '0.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1rem',
              }}
            >
              <span style={{ fontWeight: 700, color: 'var(--wm-navy)' }}>Total authorisation</span>
              <span style={{ fontWeight: 800, color: 'var(--wm-navy)', fontFamily: 'var(--wm-font-display)' }}>
                {formatEur(totalCents)}
              </span>
            </div>
          </div>
        </div>

        {/* Terms list */}
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'grid',
            gap: '0.65rem',
          }}
        >
          <li style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
            <Shield
              style={{
                width: '1rem',
                height: '1rem',
                color: 'var(--wm-primary)',
                flexShrink: 0,
                marginTop: '0.125rem',
              }}
            />
            <span style={{ fontSize: '0.875rem', color: 'var(--wm-text)', lineHeight: 1.5 }}>
              Payment is held securely — the provider is paid only when the work is marked complete.
            </span>
          </li>
          <li style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
            <AlertTriangle
              style={{
                width: '1rem',
                height: '1rem',
                color: 'var(--wm-amber)',
                flexShrink: 0,
                marginTop: '0.125rem',
              }}
            />
            <span style={{ fontSize: '0.875rem', color: 'var(--wm-text)', lineHeight: 1.5 }}>
              If you cancel <strong>after the job starts</strong>, a cancellation fee may apply depending on how
              far the work has progressed.
            </span>
          </li>
          <li style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
            <Clock
              style={{
                width: '1rem',
                height: '1rem',
                color: 'var(--wm-muted)',
                flexShrink: 0,
                marginTop: '0.125rem',
              }}
            />
            <span style={{ fontSize: '0.875rem', color: 'var(--wm-text)', lineHeight: 1.5 }}>
              If the provider does not respond or begin work within <strong>14 days</strong>, you will be
              automatically refunded in full.
            </span>
          </li>
          <li style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
            <CreditCard
              style={{
                width: '1rem',
                height: '1rem',
                color: 'var(--wm-muted)',
                flexShrink: 0,
                marginTop: '0.125rem',
              }}
            />
            <span style={{ fontSize: '0.875rem', color: 'var(--wm-text)', lineHeight: 1.5 }}>
              Your card will be authorised for <strong>{formatEur(totalCents)}</strong> now. No charge is taken
              until work is complete.
            </span>
          </li>
        </ul>

        {/* Checkbox agreement */}
        <label
          style={{
            display: 'flex',
            gap: '0.625rem',
            alignItems: 'flex-start',
            cursor: 'pointer',
            padding: '0.75rem',
            borderRadius: 'var(--wm-radius-md)',
            border: agreed ? '1.5px solid var(--wm-primary)' : '1.5px solid var(--wm-border)',
            background: agreed ? 'var(--wm-primary-light)' : 'var(--wm-bg)',
            transition: 'border-color 0.15s, background 0.15s',
          }}
        >
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{ marginTop: '0.1rem', accentColor: 'var(--wm-primary)', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '0.875rem', color: 'var(--wm-text)', lineHeight: 1.5 }}>
            I understand and agree to these payment terms
          </span>
        </label>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: 'var(--wm-radius-md)',
              border: '1.5px solid var(--wm-border)',
              background: 'var(--wm-surface)',
              color: 'var(--wm-text)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!agreed}
            onClick={onConfirm}
            style={{
              padding: '0.65rem 1.5rem',
              borderRadius: 'var(--wm-radius-md)',
              border: 'none',
              background: agreed ? 'var(--wm-grad-primary)' : 'var(--wm-border)',
              color: agreed ? 'white' : 'var(--wm-muted)',
              fontSize: '0.875rem',
              fontFamily: 'var(--wm-font-display)',
              fontWeight: 700,
              cursor: agreed ? 'pointer' : 'not-allowed',
              boxShadow: agreed ? '0 4px 12px rgba(0, 184, 148, 0.30)' : 'none',
              transition: 'background 0.15s, box-shadow 0.15s',
            }}
          >
            Authorise payment →
          </button>
        </div>
      </div>
    </div>
  );
}
