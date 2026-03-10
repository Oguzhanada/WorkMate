'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Clock, AlertCircle, ExternalLink, Info } from 'lucide-react';
import { getLocaleRoot, withLocalePrefix } from '@/lib/i18n/locale-path';
import Button from '@/components/ui/Button';
import GardaVettingBadge from '@/components/ui/GardaVettingBadge';
import Skeleton from '@/components/ui/Skeleton';

type VettingStatus = 'not_required' | 'pending' | 'approved' | 'rejected' | 'expired';

type VettingData = {
  garda_vetting_status: VettingStatus;
  garda_vetting_reference: string | null;
  garda_vetting_expires_at: string | null;
};

export default function GardaVettingRequestWidget() {
  const pathname = usePathname() || '/';
  const localeRoot = useMemo(() => getLocaleRoot(pathname), [pathname]);
  const [data, setData] = useState<VettingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetch('/api/profile/garda-vetting')
      .then((res) => res.json())
      .then((payload: VettingData) => {
        setData(payload);
      })
      .catch(() => {
        setError('Could not load vetting status.');
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(): Promise<void> {
    setSubmitting(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/profile/garda-vetting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError((payload as { error?: string }).error ?? 'Request failed.');
      } else {
        const updated = (payload as { profile: VettingData }).profile;
        setData(updated);
        setSuccessMsg(
          'Your request has been received. We will submit a vetting invitation to the National Vetting Bureau on your behalf. You will receive an email from vetting@garda.ie within 1-3 business days with a link to complete the e-Vetting form.'
        );
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const status = data?.garda_vetting_status ?? 'not_required';
  const expiresAt = data?.garda_vetting_expires_at ?? null;
  const canRequest = status === 'not_required' || status === 'rejected' || status === 'expired';

  // Calculate days until expiry for renewal reminders
  const daysUntilExpiry = expiresAt
    ? Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const showRenewalWarning = status === 'approved' && daysUntilExpiry !== null && daysUntilExpiry <= 90;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.75rem',
        }}
      >
        <ShieldCheck size={16} style={{ color: 'var(--wm-primary)' }} aria-hidden="true" />
        <p
          style={{
            margin: 0,
            fontSize: '0.78rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--wm-muted)',
          }}
        >
          Garda Vetting
        </p>
      </div>

      {loading ? (
        <Skeleton lines={3} />
      ) : (
        <>
          {/* Status display */}
          <div style={{ marginBottom: '0.75rem' }}>
            {status === 'not_required' ? (
              <div className="flex flex-col gap-2">
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--wm-foreground)' }}>
                  Garda Vetting is managed by the{' '}
                  <strong>National Vetting Bureau (NVB)</strong>. Individuals cannot self-apply
                  — WorkMate submits the application on your behalf as a registered organisation.
                </p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--wm-muted)' }}>
                  Required for providers working with children or vulnerable adults.
                  Recommended for all providers entering clients&apos; homes.
                </p>
              </div>
            ) : null}

            {status === 'pending' ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  padding: '0.75rem 0.85rem',
                  borderRadius: '0.75rem',
                  background: 'var(--wm-surface)',
                  border: '1px solid var(--wm-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <Clock
                    size={15}
                    style={{ color: 'var(--wm-warning, #d97706)', flexShrink: 0, marginTop: '0.1rem' }}
                    aria-hidden="true"
                  />
                  <div>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--wm-foreground)' }}>
                      Vetting in progress
                    </p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--wm-muted)' }}>
                      Your application has been submitted to the National Vetting Bureau.
                      NVB processing typically takes 2 to 4 weeks. Check your email for a
                      message from <strong>vetting@garda.ie</strong> — you may need to
                      complete the e-Vetting form if you have not already.
                    </p>
                  </div>
                </div>
                {data?.garda_vetting_reference ? (
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--wm-muted)' }}>
                    Reference: {data.garda_vetting_reference}
                  </p>
                ) : null}
              </div>
            ) : null}

            {status === 'approved' ? (
              <div className="flex flex-col gap-2">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <GardaVettingBadge status="approved" expiresAt={expiresAt} />
                  {expiresAt ? (
                    <span style={{ fontSize: '0.8rem', color: 'var(--wm-muted)' }}>
                      Valid until {new Date(expiresAt).toLocaleDateString('en-IE', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  ) : null}
                </div>
                {data?.garda_vetting_reference ? (
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--wm-muted)' }}>
                    NVB Disclosure Ref: {data.garda_vetting_reference}
                  </p>
                ) : null}
                {showRenewalWarning ? (
                  <div
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      background: 'var(--wm-primary-faint)',
                      border: '1px solid var(--wm-border)',
                      fontSize: '0.8rem',
                      color: 'var(--wm-foreground)',
                    }}
                  >
                    <strong>Renewal reminder:</strong> Your vetting disclosure is due for renewal
                    in {daysUntilExpiry} days. WorkMate follows a 3-year re-vetting cycle.
                    Request re-vetting below to maintain your badge.
                  </div>
                ) : null}
              </div>
            ) : null}

            {status === 'rejected' ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '0.75rem',
                  background: 'var(--wm-surface)',
                  border: '1px solid var(--wm-border)',
                }}
              >
                <AlertCircle
                  size={15}
                  style={{ color: 'var(--wm-destructive)', flexShrink: 0, marginTop: '0.1rem' }}
                  aria-hidden="true"
                />
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--wm-foreground)' }}>
                  Your previous vetting request could not be completed. This may be due to
                  an incomplete e-Vetting form, expired invitation link, or an issue flagged by
                  the NVB. You may re-apply below.
                </p>
              </div>
            ) : null}

            {status === 'expired' ? (
              <div className="flex flex-col gap-2">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <GardaVettingBadge status="expired" expiresAt={expiresAt} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--wm-muted)' }}>
                    Your disclosure has exceeded the 3-year re-vetting period.
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--wm-muted)' }}>
                  Re-apply below to start a new NVB application. The process is the same as
                  your initial vetting.
                </p>
              </div>
            ) : null}
          </div>

          {/* Request form — shown when actionable */}
          {canRequest ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                loading={submitting}
                disabled={submitting}
              >
                {status === 'not_required'
                  ? 'Request Garda Vetting'
                  : status === 'expired'
                    ? 'Request Re-Vetting'
                    : 'Re-apply for Garda Vetting'}
              </Button>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--wm-muted)' }}>
                Free for all WorkMate providers. Processing takes 2-4 weeks via the NVB.
              </p>
            </div>
          ) : null}

          {/* Approved providers can request re-vetting when nearing expiry */}
          {status === 'approved' && showRenewalWarning ? (
            <div style={{ marginTop: '0.5rem' }}>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                loading={submitting}
                disabled={submitting}
              >
                Request Re-Vetting
              </Button>
            </div>
          ) : null}

          {/* Toggle to show/hide detailed information */}
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              marginTop: '0.5rem',
              padding: 0,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.75rem',
              color: 'var(--wm-primary)',
              fontWeight: 600,
            }}
          >
            <Info size={12} aria-hidden="true" />
            {showDetails ? 'Hide details' : 'How does this work?'}
          </button>

          {showDetails ? (
            <div
              style={{
                marginTop: '0.5rem',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                background: 'var(--wm-surface)',
                border: '1px solid var(--wm-border)',
                fontSize: '0.8rem',
                color: 'var(--wm-muted)',
              }}
            >
              <ol style={{ margin: 0, paddingLeft: '1.25rem' }} className="flex flex-col gap-1.5">
                <li>You click &quot;Request Garda Vetting&quot; above</li>
                <li>WorkMate submits a vetting invitation to the NVB on your behalf</li>
                <li>You receive an email from <strong>vetting@garda.ie</strong> (1-3 business days)</li>
                <li>You complete the official NVB e-Vetting form online</li>
                <li>The NVB processes your disclosure (2-4 weeks)</li>
                <li>Your WorkMate profile is updated with a &quot;Garda Vetted&quot; badge</li>
              </ol>
              <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                <Link
                  href={withLocalePrefix(localeRoot, '/garda-vetting')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.75rem',
                    color: 'var(--wm-primary)',
                    fontWeight: 600,
                    textDecoration: 'underline',
                  }}
                >
                  Full guide
                  <ExternalLink size={10} aria-hidden="true" />
                </Link>
                <a
                  href="https://vetting.garda.ie"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.75rem',
                    color: 'var(--wm-primary)',
                    fontWeight: 600,
                    textDecoration: 'underline',
                  }}
                >
                  NVB website
                  <ExternalLink size={10} aria-hidden="true" />
                </a>
              </div>
            </div>
          ) : null}

          {/* Feedback messages */}
          {error ? (
            <p
              style={{
                marginTop: '0.5rem',
                fontSize: '0.8rem',
                color: 'var(--wm-destructive)',
              }}
            >
              {error}
            </p>
          ) : null}
          {successMsg ? (
            <div
              style={{
                marginTop: '0.5rem',
                padding: '0.6rem 0.75rem',
                borderRadius: '0.5rem',
                background: 'var(--wm-primary-faint)',
                border: '1px solid var(--wm-border)',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '0.8rem',
                  color: 'var(--wm-primary)',
                  lineHeight: 1.5,
                }}
              >
                {successMsg}
              </p>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
