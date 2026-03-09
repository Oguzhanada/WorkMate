'use client';

import { useState, useEffect, useCallback } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ContractStatus =
  | 'draft'
  | 'sent'
  | 'signed_customer'
  | 'signed_provider'
  | 'signed_both'
  | 'voided';

interface JobContract {
  id: string;
  job_id: string;
  quote_id: string | null;
  customer_id: string;
  provider_id: string;
  terms: string;
  status: ContractStatus;
  customer_signed_at: string | null;
  provider_signed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type BadgeTone = 'neutral' | 'amber' | 'primary' | 'completed' | 'navy' | 'assigned' | 'open' | 'pending';

function statusTone(status: ContractStatus): BadgeTone {
  switch (status) {
    case 'draft':            return 'neutral';
    case 'sent':             return 'amber';
    case 'signed_customer':  return 'pending';
    case 'signed_provider':  return 'pending';
    case 'signed_both':      return 'primary';
    case 'voided':           return 'neutral';
    default:                 return 'neutral';
  }
}

function statusLabel(status: ContractStatus): string {
  switch (status) {
    case 'draft':            return 'Draft';
    case 'sent':             return 'Awaiting Signatures';
    case 'signed_customer':  return 'Customer Signed';
    case 'signed_provider':  return 'Provider Signed';
    case 'signed_both':      return 'Fully Signed';
    case 'voided':           return 'Voided';
    default:                 return status;
  }
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface JobContractPanelProps {
  jobId: string;
  currentUserId: string;
  userRole: 'customer' | 'verified_pro' | 'admin';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function JobContractPanel({
  jobId,
  currentUserId: _currentUserId,
  userRole,
}: JobContractPanelProps) {
  const isCustomer = userRole === 'customer' || userRole === 'admin';
  const isProvider = userRole === 'verified_pro';

  const [contract, setContract] = useState<JobContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Create-contract form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [termsText, setTermsText] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch contract
  // ---------------------------------------------------------------------------

  const fetchContract = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/contract`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError((body as { error?: string }).error ?? 'Failed to load contract');
        return;
      }
      const body = await res.json() as { contract: JobContract | null };
      setContract(body.contract ?? null);
    } catch {
      setError('Network error — could not load contract');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchContract();
  }, [fetchContract]);

  // ---------------------------------------------------------------------------
  // Create contract (customer / admin only)
  // ---------------------------------------------------------------------------

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/contract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ terms: termsText }),
      });
      const body = await res.json().catch(() => ({})) as { contract?: JobContract; error?: string };
      if (!res.ok) {
        setCreateError(body.error ?? 'Failed to create contract');
        return;
      }
      setContract(body.contract ?? null);
      setShowCreateForm(false);
      setTermsText('');
    } catch {
      setCreateError('Network error — please try again');
    } finally {
      setCreateLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Sign / Void
  // ---------------------------------------------------------------------------

  async function handleAction(action: 'sign' | 'void') {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/contract`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const body = await res.json().catch(() => ({})) as { error?: string };
      if (!res.ok) {
        setActionError(body.error ?? `Failed to ${action} contract`);
        return;
      }
      // Re-fetch to get the full updated contract object
      await fetchContract();
    } catch {
      setActionError('Network error — please try again');
    } finally {
      setActionLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const isFinalised =
    contract?.status === 'voided' || contract?.status === 'signed_both';

  const hasSignedAlready =
    contract !== null &&
    ((isCustomer && contract.customer_signed_at !== null) ||
      (isProvider && contract.provider_signed_at !== null));

  const canSign =
    contract !== null &&
    !isFinalised &&
    !hasSignedAlready &&
    (isCustomer || isProvider);

  const canVoid =
    contract !== null &&
    !isFinalised &&
    isCustomer;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Card>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 16,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--wm-text)',
            fontFamily: 'var(--wm-font-display)',
          }}
        >
          Job Contract
        </h2>
        {contract ? (
          <Badge tone={statusTone(contract.status)} dot>
            {statusLabel(contract.status)}
          </Badge>
        ) : null}
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <Skeleton lines={4} height="h-5" />
      ) : error ? (
        /* Error banner */
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            background: 'var(--wm-destructive-light, rgba(220,38,38,0.08))',
            color: 'var(--wm-destructive)',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </div>
      ) : contract === null ? (
        /* No contract exists */
        isCustomer ? (
          showCreateForm ? (
            /* Create form */
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label
                htmlFor="contract-terms"
                style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--wm-text)' }}
              >
                Contract Terms
                <span style={{ color: 'var(--wm-muted)', fontWeight: 400, marginLeft: 6 }}>
                  (min. 10 characters)
                </span>
              </label>
              <textarea
                id="contract-terms"
                value={termsText}
                onChange={(e) => setTermsText(e.target.value)}
                rows={6}
                placeholder="Describe the scope of work, payment milestones, deadlines, and any special conditions…"
                required
                minLength={10}
                maxLength={10000}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--wm-border)',
                  background: 'var(--wm-surface)',
                  color: 'var(--wm-text)',
                  fontSize: '0.875rem',
                  lineHeight: 1.6,
                  resize: 'vertical',
                  fontFamily: 'var(--wm-font-sans)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {createError ? (
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--wm-destructive)' }}>
                  {createError}
                </p>
              ) : null}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={createLoading}
                  disabled={termsText.trim().length < 10}
                >
                  Create Contract
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowCreateForm(false); setCreateError(null); setTermsText(''); }}
                  disabled={createLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            /* EmptyState with CTA for customer/admin */
            <EmptyState
              icon={
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              }
              title="No contract yet"
              description="Create a contract to formalise the agreement with the provider."
              action={
                <Button variant="outline" size="sm" onClick={() => setShowCreateForm(true)}>
                  Create Contract
                </Button>
              }
              compact
            />
          )
        ) : (
          /* Provider sees a read-only empty state */
          <EmptyState
            title="No contract yet"
            description="The customer has not created a contract for this job yet."
            compact
          />
        )
      ) : (
        /* Contract exists — show details */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Terms */}
          <div>
            <p
              style={{
                margin: '0 0 6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--wm-muted)',
              }}
            >
              Terms
            </p>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid var(--wm-border)',
                background: 'var(--wm-surface)',
                fontSize: '0.875rem',
                lineHeight: 1.7,
                color: 'var(--wm-text)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {contract.terms}
            </div>
          </div>

          {/* Signature status */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 10,
            }}
          >
            <SignatureRow label="Customer signed" timestamp={contract.customer_signed_at} />
            <SignatureRow label="Provider signed" timestamp={contract.provider_signed_at} />
          </div>

          {/* Metadata */}
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--wm-muted)' }}>
            Created {fmtDate(contract.created_at)}
            {contract.updated_at !== contract.created_at
              ? ` · Updated ${fmtDate(contract.updated_at)}`
              : null}
          </p>

          {/* Action error */}
          {actionError ? (
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--wm-destructive)' }}>
              {actionError}
            </p>
          ) : null}

          {/* Actions */}
          {(canSign || canVoid) ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {canSign ? (
                <Button
                  variant="primary"
                  size="sm"
                  loading={actionLoading}
                  onClick={() => handleAction('sign')}
                >
                  Sign Contract
                </Button>
              ) : null}
              {canVoid ? (
                <Button
                  variant="destructive"
                  size="sm"
                  loading={actionLoading}
                  onClick={() => handleAction('void')}
                >
                  Void Contract
                </Button>
              ) : null}
            </div>
          ) : contract.status === 'voided' ? (
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--wm-muted)', fontStyle: 'italic' }}>
              This contract has been voided.
            </p>
          ) : contract.status === 'signed_both' ? (
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--wm-muted)', fontStyle: 'italic' }}>
              Both parties have signed this contract.
            </p>
          ) : hasSignedAlready ? (
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--wm-muted)', fontStyle: 'italic' }}>
              You have signed — awaiting the other party.
            </p>
          ) : null}
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: signature row
// ---------------------------------------------------------------------------

function SignatureRow({ label, timestamp }: { label: string; timestamp: string | null }) {
  const signed = timestamp !== null;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: '10px 12px',
        borderRadius: 10,
        border: '1px solid var(--wm-border)',
        background: signed
          ? 'var(--wm-primary-light, rgba(0,184,148,0.08))'
          : 'var(--wm-surface)',
      }}
    >
      <span
        style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: signed ? 'var(--wm-primary-dark)' : 'var(--wm-muted)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: '0.8rem',
          color: signed ? 'var(--wm-text)' : 'var(--wm-muted)',
          fontStyle: signed ? 'normal' : 'italic',
        }}
      >
        {signed ? fmtDate(timestamp) : 'Not yet signed'}
      </span>
    </div>
  );
}
