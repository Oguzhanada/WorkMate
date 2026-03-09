'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, Clock, AlertCircle } from 'lucide-react';
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
  const [data, setData] = useState<VettingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [referenceInput, setReferenceInput] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
        body: JSON.stringify({ reference_number: referenceInput.trim() || undefined }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError((payload as { error?: string }).error ?? 'Request failed.');
      } else {
        const updated = (payload as { profile: VettingData }).profile;
        setData(updated);
        setSuccessMsg('Your Garda vetting request has been submitted. An admin will review it shortly.');
        setReferenceInput('');
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
        <Skeleton lines={2} />
      ) : (
        <>
          {/* Status display */}
          <div style={{ marginBottom: '0.75rem' }}>
            {status === 'not_required' ? (
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--wm-muted)' }}>
                Not yet requested. Providers working with children or vulnerable adults in Ireland
                must hold a valid Garda vetting disclosure.
              </p>
            ) : null}

            {status === 'pending' ? (
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
                <Clock
                  size={15}
                  style={{ color: 'var(--wm-warning, #d97706)', flexShrink: 0, marginTop: '0.1rem' }}
                  aria-hidden="true"
                />
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--wm-foreground)' }}>
                  Your Garda vetting request is under review. We will notify you once a decision
                  has been made.
                </p>
              </div>
            ) : null}

            {status === 'approved' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <GardaVettingBadge status="approved" expiresAt={expiresAt} />
                {expiresAt ? (
                  <span style={{ fontSize: '0.8rem', color: 'var(--wm-muted)' }}>
                    Expires {new Date(expiresAt).toLocaleDateString('en-IE')}
                  </span>
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
                  Your previous request was not approved. You may re-apply below.
                </p>
              </div>
            ) : null}

            {status === 'expired' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <GardaVettingBadge status="expired" expiresAt={expiresAt} />
                <span style={{ fontSize: '0.8rem', color: 'var(--wm-muted)' }}>
                  Please reapply to renew your disclosure.
                </span>
              </div>
            ) : null}
          </div>

          {/* Request form — shown when actionable */}
          {canRequest ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label
                htmlFor="garda-ref"
                style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--wm-foreground)' }}
              >
                NVB Reference number{' '}
                <span style={{ fontWeight: 400, color: 'var(--wm-muted)' }}>(optional)</span>
              </label>
              <input
                id="garda-ref"
                type="text"
                value={referenceInput}
                onChange={(e) => setReferenceInput(e.target.value)}
                maxLength={50}
                placeholder="e.g. NVB-2024-XXXXXXXX"
                style={{
                  padding: '0.45rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--wm-border)',
                  background: 'var(--wm-surface)',
                  color: 'var(--wm-foreground)',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                loading={submitting}
                disabled={submitting}
              >
                Request Garda Vetting
              </Button>
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
            <p
              style={{
                marginTop: '0.5rem',
                fontSize: '0.8rem',
                color: 'var(--wm-primary)',
              }}
            >
              {successMsg}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
