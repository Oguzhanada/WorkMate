'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import AlertBanner from '@/components/ui/AlertBanner';
import { useToast } from '@/components/ui/Toast';

// ─── Types ───────────────────────────────────────────────────────────────────

type VerificationStatus = 'pending' | 'verified' | 'rejected' | string;
type IdVerificationStatus = 'pending' | 'approved' | 'rejected' | string;

type QueueEntry = {
  id: string;
  full_name: string | null;
  email_masked: string;
  verification_status: VerificationStatus;
  id_verification_status: IdVerificationStatus;
  created_at: string;
  risk_score: number | null;
  document_count: number;
};

type QueueStats = {
  pending: number;
  id_pending: number;
  avg_wait_days: number;
  total: number;
};

type Tab = 'all' | 'id_verification' | 'new_applications';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

function riskBadge(score: number | null) {
  if (score === null) return <Badge tone="neutral">No score</Badge>;
  if (score >= 0.7) return <Badge tone="pending">High {score.toFixed(2)}</Badge>;
  if (score >= 0.4) return <Badge tone="amber">Med {score.toFixed(2)}</Badge>;
  return <Badge tone="primary">Low {score.toFixed(2)}</Badge>;
}

function verificationBadge(status: VerificationStatus) {
  if (status === 'pending') return <Badge tone="amber" dot>Pending</Badge>;
  if (status === 'verified') return <Badge tone="primary" dot>Verified</Badge>;
  if (status === 'rejected') return <Badge tone="navy">Rejected</Badge>;
  return <Badge tone="neutral">{status}</Badge>;
}

function idVerificationBadge(status: IdVerificationStatus) {
  if (status === 'pending') return <Badge tone="amber" dot>ID Pending</Badge>;
  if (status === 'approved') return <Badge tone="primary">ID Approved</Badge>;
  if (status === 'rejected') return <Badge tone="navy">ID Rejected</Badge>;
  return <Badge tone="neutral">{status}</Badge>;
}

// ─── Reject Reason Modal ──────────────────────────────────────────────────────

function RejectModal({
  count,
  onConfirm,
  onCancel,
}: {
  count: number;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(12,27,51,0.55)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl border p-6 space-y-4"
        style={{ background: 'var(--wm-surface)', borderColor: 'var(--wm-border)', boxShadow: 'var(--wm-shadow-2xl)' }}
      >
        <h2
          className="text-lg font-bold"
          style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
        >
          Reject {count} application{count > 1 ? 's' : ''}
        </h2>
        <p className="text-sm" style={{ color: 'var(--wm-muted)' }}>
          Provide a reason that will be sent to the provider(s). This will be stored and shown
          in their notification.
        </p>
        <textarea
          className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2"
          style={{
            borderColor: 'var(--wm-border)',
            background: 'var(--wm-bg)',
            color: 'var(--wm-text)',
            resize: 'vertical',
            minHeight: '96px',
            // focus ring uses wm token via Tailwind ring won't work inline — acceptable
          }}
          placeholder="e.g. Submitted documents were not legible. Please re-upload a clear photo of your ID."
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <p className="text-xs text-right" style={{ color: 'var(--wm-muted)' }}>
          {reason.length}/500
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(reason)}
            disabled={reason.trim().length === 0}
          >
            Confirm Reject
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VerificationQueuePage() {
  const pathname = usePathname();
  const { toast } = useToast();
  // Derive locale prefix from current path (e.g. "/en/dashboard/..." → "/en")
  const localePrefix = pathname.split('/').slice(0, 2).join('/');

  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [stats, setStats] = useState<QueueStats>({ pending: 0, id_pending: 0, avg_wait_days: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [pendingRejectIds, setPendingRejectIds] = useState<string[]>([]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Data fetch ──────────────────────────────────────────────────────────────

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/verification-queue', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load queue');
      const data = await res.json();
      setQueue(data.queue ?? []);
      setStats(data.stats ?? { pending: 0, id_pending: 0, avg_wait_days: 0, total: 0 });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchQueue();
    intervalRef.current = setInterval(() => void fetchQueue(), 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchQueue]);

  // ── Filtering ───────────────────────────────────────────────────────────────

  const filteredQueue = queue.filter((entry) => {
    if (activeTab === 'id_verification') return entry.id_verification_status === 'pending';
    if (activeTab === 'new_applications') return entry.verification_status === 'pending' && entry.document_count > 0;
    return true;
  });

  // ── Selection ───────────────────────────────────────────────────────────────

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredQueue.length && filteredQueue.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredQueue.map((e) => e.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  // ── Actions ─────────────────────────────────────────────────────────────────

  const performAction = useCallback(
    async (ids: string[], action: 'approve' | 'reject', reason?: string) => {
      setActionLoading(true);
      try {
        const res = await fetch('/api/admin/verification-queue', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile_ids: ids, action, reason }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? 'Action failed');
          toast({
            variant: 'error',
            title: `${action === 'approve' ? 'Approval' : 'Rejection'} failed`,
            description: data.error ?? 'Please try again.',
          });
          return;
        }
        toast({
          variant: action === 'approve' ? 'success' : 'warning',
          title: action === 'approve'
            ? `${ids.length} provider${ids.length > 1 ? 's' : ''} approved`
            : `${ids.length} provider${ids.length > 1 ? 's' : ''} rejected`,
          description: action === 'approve'
            ? 'They will be notified by email.'
            : 'A rejection reason has been recorded.',
        });
        // Refresh queue after successful action
        clearSelection();
        await fetchQueue();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Action failed');
      } finally {
        setActionLoading(false);
      }
    },
    [fetchQueue]
  );

  const handleApprove = (ids: string[]) => performAction(ids, 'approve');

  const handleRejectRequest = (ids: string[]) => {
    setPendingRejectIds(ids);
    setShowRejectModal(true);
  };

  const handleRejectConfirm = (reason: string) => {
    setShowRejectModal(false);
    void performAction(pendingRejectIds, 'reject', reason);
    setPendingRejectIds([]);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All Pending' },
    { key: 'id_verification', label: 'ID Verification' },
    { key: 'new_applications', label: 'New Applications' },
  ];

  const allOnPageSelected =
    filteredQueue.length > 0 && filteredQueue.every((e) => selectedIds.has(e.id));

  return (
    <>
      {showRejectModal ? (
        <RejectModal
          count={pendingRejectIds.length}
          onConfirm={handleRejectConfirm}
          onCancel={() => {
            setShowRejectModal(false);
            setPendingRejectIds([]);
          }}
        />
      ) : null}

      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <PageHeader
          title="Verification Queue"
          description="Review and batch-process pending provider verification applications."
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void fetchQueue()}
              loading={loading && queue.length > 0}
            >
              Refresh
            </Button>
          }
        />

        {/* Stats row */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Pending Applications"
            value={stats.pending}
            accent="amber"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            }
          />
          <StatCard
            label="ID Verification Pending"
            value={stats.id_pending}
            accent="blue"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <circle cx="8" cy="12" r="2" />
                <path d="M14 9h4M14 12h4M14 15h2" />
              </svg>
            }
          />
          <StatCard
            label="Avg Wait Time (days)"
            value={stats.avg_wait_days}
            accent="navy"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            }
          />
        </div>

        {/* Error banner */}
        {error && (
          <AlertBanner
            variant="error"
            title="Action failed"
            description={error}
            dismissible
            onDismiss={() => setError(null)}
          />
        )}

        {/* Filter tabs */}
        <div
          className="flex gap-1 rounded-2xl border p-1 w-fit"
          style={{ borderColor: 'var(--wm-border)', background: 'var(--wm-surface)' }}
          role="tablist"
        >
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              variant={activeTab === tab.key ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => {
                setActiveTab(tab.key);
                clearSelection();
              }}
              className="rounded-xl"
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Bulk action bar */}
        {selectedIds.size > 0 ? (
          <div
            className="flex flex-wrap items-center gap-3 rounded-2xl border px-5 py-3"
            style={{ borderColor: 'var(--wm-primary)', background: 'var(--wm-primary-light)', boxShadow: 'var(--wm-shadow-sm)' }}
          >
            <span className="text-sm font-semibold" style={{ color: 'var(--wm-primary-dark)' }}>
              {selectedIds.size} selected
            </span>
            <Button
              variant="primary"
              size="sm"
              loading={actionLoading}
              onClick={() => void handleApprove(Array.from(selectedIds))}
            >
              Approve Selected
            </Button>
            <Button
              variant="destructive"
              size="sm"
              loading={actionLoading}
              onClick={() => handleRejectRequest(Array.from(selectedIds))}
            >
              Reject Selected
            </Button>
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              Clear
            </Button>
          </div>
        ) : null}

        {/* Provider list */}
        {loading && queue.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-2xl"
                style={{ background: 'var(--wm-subtle)' }}
              />
            ))}
          </div>
        ) : filteredQueue.length === 0 ? (
          <EmptyState
            title="No pending applications"
            description="All applications in this category have been reviewed."
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            }
          />
        ) : (
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: 'var(--wm-border)', background: 'var(--wm-surface)' }}
          >
            {/* Table header */}
            <div
              className="grid grid-cols-[2rem_1fr_1fr_auto_auto_auto_auto] items-center gap-4 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b"
              style={{ color: 'var(--wm-muted)', borderColor: 'var(--wm-border)', background: 'var(--wm-bg)', fontFamily: 'var(--wm-font-display)' }}
            >
              <input
                type="checkbox"
                aria-label="Select all"
                checked={allOnPageSelected}
                onChange={toggleSelectAll}
                className="rounded"
              />
              <span>Provider</span>
              <span>Status</span>
              <span>Risk</span>
              <span>Wait</span>
              <span>Docs</span>
              <span>Actions</span>
            </div>

            {/* Table rows */}
            <ul className="divide-y" style={{ borderColor: 'var(--wm-border)' }}>
              {filteredQueue.map((entry) => (
                <li
                  key={entry.id}
                  className="grid grid-cols-[2rem_1fr_1fr_auto_auto_auto_auto] items-center gap-4 px-4 py-3 transition-colors duration-100"
                  style={
                    selectedIds.has(entry.id)
                      ? { background: 'var(--wm-primary-light)' }
                      : { background: 'transparent' }
                  }
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    aria-label={`Select ${entry.full_name ?? entry.id}`}
                    checked={selectedIds.has(entry.id)}
                    onChange={() => toggleSelect(entry.id)}
                    className="rounded"
                  />

                  {/* Identity */}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--wm-navy)' }}>
                      {entry.full_name ?? 'Unnamed provider'}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--wm-muted)' }}>
                      {entry.email_masked}
                    </p>
                  </div>

                  {/* Status badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {verificationBadge(entry.verification_status)}
                    {idVerificationBadge(entry.id_verification_status)}
                  </div>

                  {/* Risk score */}
                  <div>{riskBadge(entry.risk_score)}</div>

                  {/* Wait time */}
                  <div className="text-xs font-medium whitespace-nowrap" style={{ color: 'var(--wm-muted)' }}>
                    {daysSince(entry.created_at)}d
                  </div>

                  {/* Document count */}
                  <div className="text-xs font-medium" style={{ color: 'var(--wm-muted)' }}>
                    {entry.document_count} doc{entry.document_count !== 1 ? 's' : ''}
                  </div>

                  {/* Row actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      loading={actionLoading}
                      onClick={() => void handleApprove([entry.id])}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      loading={actionLoading}
                      onClick={() => handleRejectRequest([entry.id])}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      href={`${localePrefix}/dashboard/admin/applications/${entry.id}`}
                    >
                      View
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-xs text-right" style={{ color: 'var(--wm-muted)' }}>
          Auto-refreshes every 60 seconds. {stats.total} total in queue.
        </p>
      </div>
    </>
  );
}
