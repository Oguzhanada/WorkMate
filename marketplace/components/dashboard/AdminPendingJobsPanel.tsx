'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle, XCircle, FileText, RefreshCw, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import AlertBanner from '@/components/ui/AlertBanner';
import { useToast } from '@/components/ui/Toast';

type PendingJob = {
  id: string;
  title: string;
  description?: string;
  category: string;
  county: string | null;
  locality: string | null;
  budget_range: string;
  status: string;
  review_status: 'pending_review' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  customer_id: string;
  customer_name: string | null;
  photo_urls?: string[];
};

// ─── Design tokens (matches AdminDashboard.tsx) ────────────────────────────
const T = {
  cardBg: '#ffffff',
  cardBorder: '#e2e8f0',
  cardRadius: '14px',
  cardShadow: '0 1px 3px rgba(0,0,0,0.07)',
  text: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  emerald: '#169B62',
  navy: '#1B2A4A',
  amber: '#d97706',
  rose: '#e11d48',
  headerBg: '#f8fafc',
  rowHover: '#f8fafc',
} as const;

export default function AdminPendingJobsPanel() {
  const { toast } = useToast();
  const [items, setItems] = useState<PendingJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<PendingJob | null>(null);
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/pending-jobs', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || 'Pending jobs could not be loaded.');
        return;
      }
      setItems(payload.jobs ?? []);
    } catch {
      setError('Network error — could not reach the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  const approve = async (jobId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/jobs/${jobId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: 'Approved by admin' }),
      });
      const payload = await response.json();
      if (!response.ok) {
        toast({ variant: 'error', title: 'Approval failed', description: payload.error || 'Please try again.' });
        return;
      }
      toast({ variant: 'success', title: 'Job approved', description: 'The job is now published and visible to providers.' });
      setItems((current) => current.filter((item) => item.id !== jobId));
      setActive(null);
    } finally {
      setActionLoading(false);
    }
  };

  const reject = async () => {
    if (!active) return;
    if (!reason.trim()) {
      toast({ variant: 'warning', title: 'Reason required', description: 'Please enter a rejection reason before submitting.' });
      return;
    }
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/jobs/${active.id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: reason.trim() }),
      });
      const payload = await response.json();
      if (!response.ok) {
        toast({ variant: 'error', title: 'Rejection failed', description: payload.error || 'Please try again.' });
        return;
      }
      toast({ variant: 'warning', title: 'Job rejected', description: 'The customer has been notified with the reason.' });
      setItems((current) => current.filter((item) => item.id !== active.id));
      setActive(null);
      setReason('');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = useMemo(() => items.length, [items]);

  useEffect(() => {
    let alive = true;
    queueMicrotask(() => { if (alive) load(); });
    return () => { alive = false; };
  }, [load]);

  return (
    <div
      style={{
        background: T.cardBg,
        border: `1.5px solid ${T.cardBorder}`,
        borderRadius: T.cardRadius,
        boxShadow: T.cardShadow,
        overflow: 'hidden',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 20px',
          borderBottom: `1px solid ${T.border}`,
          background: T.headerBg,
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: 700,
                color: T.text,
                fontFamily: 'var(--wm-font-heading, Poppins, sans-serif)',
              }}
            >
              Pending Job Reviews
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: T.muted }}>
              Admin review queue for job publishing.
            </p>
          </div>
          {pendingCount > 0 && (
            <Badge tone="amber">{pendingCount} pending</Badge>
          )}
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={load}
          disabled={loading}
          leftIcon={<RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />}
        >
          {loading ? 'Loading…' : 'Refresh'}
        </Button>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* ── Error ── */}
        {error && (
          <AlertBanner
            variant="error"
            title="Failed to load jobs"
            description={error}
            dismissible
            onDismiss={() => setError(null)}
          />
        )}

        {/* ── Table ── */}
        {items.length === 0 && !loading ? (
          <EmptyState
            title="No pending jobs"
            description="All job listings have been reviewed. New submissions will appear here."
            icon={<FileText size={32} style={{ color: T.emerald }} />}
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: `2px solid ${T.border}`,
                    textAlign: 'left',
                  }}
                >
                  {['Customer', 'Title', 'Category', 'Location', 'Budget', 'Date', 'Actions'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 12px',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: T.muted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: `1px solid ${T.border}`,
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = T.rowHover; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '12px', fontWeight: 600, color: T.text, whiteSpace: 'nowrap' }}>
                      {item.customer_name ?? item.customer_id.slice(0, 8)}
                    </td>
                    <td style={{ padding: '12px', color: T.text, maxWidth: '180px' }}>
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.title}
                      </span>
                    </td>
                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                      <Badge tone="neutral">{item.category}</Badge>
                    </td>
                    <td style={{ padding: '12px', color: T.muted, whiteSpace: 'nowrap' }}>
                      {item.locality ?? '—'}, {item.county ?? '—'}
                    </td>
                    <td style={{ padding: '12px', color: T.text, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {item.budget_range}
                    </td>
                    <td style={{ padding: '12px', color: T.muted, whiteSpace: 'nowrap' }}>
                      {new Date(item.created_at).toLocaleDateString('en-IE')}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<CheckCircle size={12} />}
                          onClick={() => approve(item.id)}
                          disabled={actionLoading}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          leftIcon={<XCircle size={12} />}
                          onClick={() => { setActive(item); setReason(''); }}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<FileText size={12} />}
                          onClick={() => setActive(item)}
                        >
                          Details
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Detail / Reject Modal ── */}
      {active && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.55)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setActive(null)}
        >
          <div
            style={{
              background: T.cardBg,
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <h4
                  style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 700,
                    color: T.text,
                    fontFamily: 'var(--wm-font-heading, Poppins, sans-serif)',
                  }}
                >
                  {active.title}
                </h4>
                <Badge tone="amber">Pending Review</Badge>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '13px', color: T.muted }}>
                {active.category} &bull; {active.locality ?? '—'}, {active.county ?? '—'} &bull; Budget: {active.budget_range}
              </p>
            </div>

            {/* Description */}
            {active.description && (
              <div
                style={{
                  background: T.headerBg,
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '13px',
                  color: T.muted,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  border: `1px solid ${T.border}`,
                }}
              >
                {active.description}
              </div>
            )}

            {/* Photos */}
            {active.photo_urls && active.photo_urls.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {active.photo_urls.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={url}
                    alt={`Job photo ${i + 1}`}
                    style={{
                      width: '120px',
                      height: '90px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: `1px solid ${T.border}`,
                      cursor: 'pointer',
                    }}
                    onClick={() => window.open(url, '_blank')}
                  />
                ))}
              </div>
            )}

            {/* Rejection reason field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label
                style={{ fontSize: '12px', fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                Rejection reason <span style={{ color: T.rose }}>*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain what should be fixed before publishing…"
                rows={3}
                style={{
                  width: '100%',
                  border: `1.5px solid ${T.border}`,
                  borderRadius: '10px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  color: T.text,
                  resize: 'vertical',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Modal actions */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActive(null)}
                disabled={actionLoading}
              >
                Close
              </Button>
              <Button
                variant="destructive"
                size="sm"
                leftIcon={<XCircle size={13} />}
                onClick={reject}
                disabled={actionLoading || !reason.trim()}
              >
                {actionLoading ? 'Rejecting…' : 'Reject with reason'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<CheckCircle size={13} />}
                onClick={() => approve(active.id)}
                disabled={actionLoading}
              >
                {actionLoading ? 'Approving…' : 'Approve'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
