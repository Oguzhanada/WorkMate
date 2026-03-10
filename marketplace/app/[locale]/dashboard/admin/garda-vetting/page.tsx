'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';

// ─── Types ───────────────────────────────────────────────────────────────────

type VettingStatus = 'pending' | 'approved' | 'rejected' | 'expired';
type StatusFilter = VettingStatus | 'all';

type Provider = {
  id: string;
  full_name: string | null;
  email_masked: string;
  profession: string | null;
  garda_vetting_status: VettingStatus;
  garda_vetting_reference: string | null;
  garda_vetting_expires_at: string | null;
  created_at: string;
  updated_at: string;
};

type Stats = {
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
  total: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

function statusBadge(status: VettingStatus) {
  switch (status) {
    case 'pending':
      return <Badge tone="amber" dot>Pending</Badge>;
    case 'approved':
      return <Badge tone="primary" dot>Approved</Badge>;
    case 'rejected':
      return <Badge tone="navy">Rejected</Badge>;
    case 'expired':
      return <Badge tone="neutral">Expired</Badge>;
    default:
      return <Badge tone="neutral">{status}</Badge>;
  }
}

function defaultExpiryDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 3);
  return d.toISOString().split('T')[0];
}

// ─── Approve Modal ───────────────────────────────────────────────────────────

function ApproveModal({
  count,
  onConfirm,
  onCancel,
}: {
  count: number;
  onConfirm: (reference: string, expiresAt: string) => void;
  onCancel: () => void;
}) {
  const [reference, setReference] = useState('');
  const [expiresAt, setExpiresAt] = useState(defaultExpiryDate());

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(12,27,51,0.55)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl border p-6 space-y-4"
        style={{
          background: 'var(--wm-surface)',
          borderColor: 'var(--wm-border)',
          boxShadow: 'var(--wm-shadow-2xl)',
        }}
      >
        <h2
          className="text-lg font-bold"
          style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
        >
          Approve {count} provider{count > 1 ? 's' : ''}
        </h2>
        <p className="text-sm" style={{ color: 'var(--wm-muted)' }}>
          Enter the NVB disclosure reference number and expiry date. The provider will
          receive a notification and email confirming approval.
        </p>

        <div className="space-y-3">
          <div>
            <label
              className="block text-xs font-semibold mb-1"
              style={{ color: 'var(--wm-foreground)' }}
            >
              NVB Reference Number
            </label>
            <input
              type="text"
              className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2"
              style={{
                borderColor: 'var(--wm-border)',
                background: 'var(--wm-bg)',
                color: 'var(--wm-text)',
              }}
              placeholder="e.g. NVB-2026-123456"
              maxLength={100}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold mb-1"
              style={{ color: 'var(--wm-foreground)' }}
            >
              Expires On (3-year re-vetting cycle)
            </label>
            <input
              type="date"
              className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2"
              style={{
                borderColor: 'var(--wm-border)',
                background: 'var(--wm-bg)',
                color: 'var(--wm-text)',
              }}
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => onConfirm(reference, expiresAt)}
            disabled={reference.trim().length === 0 || !expiresAt}
          >
            Confirm Approve
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Reject Modal ────────────────────────────────────────────────────────────

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
        style={{
          background: 'var(--wm-surface)',
          borderColor: 'var(--wm-border)',
          boxShadow: 'var(--wm-shadow-2xl)',
        }}
      >
        <h2
          className="text-lg font-bold"
          style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
        >
          Reject {count} application{count > 1 ? 's' : ''}
        </h2>
        <p className="text-sm" style={{ color: 'var(--wm-muted)' }}>
          Provide a reason. The provider will be notified and can re-apply.
        </p>
        <textarea
          className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2"
          style={{
            borderColor: 'var(--wm-border)',
            background: 'var(--wm-bg)',
            color: 'var(--wm-text)',
            resize: 'vertical',
            minHeight: '96px',
          }}
          placeholder="e.g. Incomplete e-Vetting form — NVB returned disclosure as unprocessable."
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

// ─── Toast ───────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error';

function Toast({
  message,
  type,
  onDismiss,
}: {
  message: string;
  type: ToastType;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-3 shadow-lg animate-in slide-in-from-bottom-4"
      style={{
        background: type === 'success' ? 'var(--wm-primary-light)' : 'var(--wm-surface)',
        borderColor: type === 'success' ? 'var(--wm-primary)' : 'var(--wm-destructive)',
        color: type === 'success' ? 'var(--wm-primary-dark)' : 'var(--wm-destructive)',
        maxWidth: '420px',
      }}
    >
      {type === 'success' ? (
        <CheckCircle2 size={16} aria-hidden="true" />
      ) : (
        <XCircle size={16} aria-hidden="true" />
      )}
      <span className="text-sm font-medium">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'inherit' }}
        aria-label="Dismiss"
      >
        <XCircle size={14} />
      </button>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function GardaVettingAdminPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    expired: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<StatusFilter>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [pendingActionIds, setPendingActionIds] = useState<string[]>([]);

  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Data fetch ────────────────────────────────────────────────────────────

  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/admin/garda-vetting?status=${activeTab}`,
        { cache: 'no-store' }
      );
      if (!res.ok) throw new Error('Failed to load vetting queue');
      const data = await res.json();
      setProviders(data.providers ?? []);
      setStats(data.stats ?? { pending: 0, approved: 0, rejected: 0, expired: 0, total: 0 });
    } catch {
      setToast({ message: 'Failed to load vetting queue. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    void fetchProviders();
    intervalRef.current = setInterval(() => void fetchProviders(), 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchProviders]);

  // ── Filtering (client-side search within fetched results) ─────────────────

  const filteredProviders = providers.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.full_name ?? '').toLowerCase().includes(q) ||
      p.email_masked.toLowerCase().includes(q) ||
      (p.profession ?? '').toLowerCase().includes(q)
    );
  });

  // ── Selection ─────────────────────────────────────────────────────────────

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProviders.length && filteredProviders.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProviders.map((p) => p.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleApproveRequest = (ids: string[]) => {
    setPendingActionIds(ids);
    setShowApproveModal(true);
  };

  const handleRejectRequest = (ids: string[]) => {
    setPendingActionIds(ids);
    setShowRejectModal(true);
  };

  const performApprove = useCallback(
    async (ids: string[], reference: string, expiresAt: string) => {
      setActionLoading(true);
      let successCount = 0;
      let failCount = 0;

      for (const id of ids) {
        try {
          const res = await fetch(`/api/admin/garda-vetting/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              garda_vetting_status: 'approved',
              garda_vetting_reference: reference,
              garda_vetting_expires_at: expiresAt,
            }),
          });
          if (res.ok) successCount++;
          else failCount++;
        } catch {
          failCount++;
        }
      }

      setActionLoading(false);
      clearSelection();

      if (failCount === 0) {
        setToast({
          message: `${successCount} provider${successCount > 1 ? 's' : ''} approved successfully.`,
          type: 'success',
        });
      } else {
        setToast({
          message: `${successCount} approved, ${failCount} failed. Check the console for details.`,
          type: 'error',
        });
      }

      await fetchProviders();
    },
    [fetchProviders]
  );

  const performReject = useCallback(
    async (ids: string[], _reason: string) => {
      setActionLoading(true);
      let successCount = 0;
      let failCount = 0;

      for (const id of ids) {
        try {
          const res = await fetch(`/api/admin/garda-vetting/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              garda_vetting_status: 'rejected',
            }),
          });
          if (res.ok) successCount++;
          else failCount++;
        } catch {
          failCount++;
        }
      }

      setActionLoading(false);
      clearSelection();

      if (failCount === 0) {
        setToast({
          message: `${successCount} provider${successCount > 1 ? 's' : ''} rejected.`,
          type: 'success',
        });
      } else {
        setToast({
          message: `${successCount} rejected, ${failCount} failed. Check the console for details.`,
          type: 'error',
        });
      }

      await fetchProviders();
    },
    [fetchProviders]
  );

  const handleApproveConfirm = (reference: string, expiresAt: string) => {
    setShowApproveModal(false);
    void performApprove(pendingActionIds, reference, expiresAt);
    setPendingActionIds([]);
  };

  const handleRejectConfirm = (reason: string) => {
    setShowRejectModal(false);
    void performReject(pendingActionIds, reason);
    setPendingActionIds([]);
  };

  // ─── Tabs ─────────────────────────────────────────────────────────────────

  const tabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'pending', label: 'Pending', count: stats.pending },
    { key: 'approved', label: 'Approved', count: stats.approved },
    { key: 'rejected', label: 'Rejected', count: stats.rejected },
    { key: 'expired', label: 'Expired', count: stats.expired },
    { key: 'all', label: 'All', count: stats.total },
  ];

  const allOnPageSelected =
    filteredProviders.length > 0 && filteredProviders.every((p) => selectedIds.has(p.id));

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* Modals */}
      {showApproveModal ? (
        <ApproveModal
          count={pendingActionIds.length}
          onConfirm={handleApproveConfirm}
          onCancel={() => {
            setShowApproveModal(false);
            setPendingActionIds([]);
          }}
        />
      ) : null}
      {showRejectModal ? (
        <RejectModal
          count={pendingActionIds.length}
          onConfirm={handleRejectConfirm}
          onCancel={() => {
            setShowRejectModal(false);
            setPendingActionIds([]);
          }}
        />
      ) : null}

      {/* Toast */}
      {toast ? (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      ) : null}

      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <PageHeader
          title="Garda Vetting Management"
          description="Review NVB vetting disclosures and manage provider vetting status."
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void fetchProviders()}
              loading={loading && providers.length > 0}
              leftIcon={<RefreshCw size={14} />}
            >
              Refresh
            </Button>
          }
        />

        {/* Stats row */}
        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard
            label="Pending Review"
            value={stats.pending}
            accent="amber"
            icon={<Clock size={18} aria-hidden="true" />}
          />
          <StatCard
            label="Approved"
            value={stats.approved}
            accent="primary"
            icon={<CheckCircle2 size={18} aria-hidden="true" />}
          />
          <StatCard
            label="Rejected"
            value={stats.rejected}
            accent="navy"
            icon={<XCircle size={18} aria-hidden="true" />}
          />
          <StatCard
            label="Expired"
            value={stats.expired}
            accent="blue"
            icon={<AlertTriangle size={18} aria-hidden="true" />}
          />
        </div>

        {/* Search + Filter tabs */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Tabs */}
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
                {tab.count > 0 ? (
                  <span
                    className="ml-1.5 text-xs rounded-full px-1.5 py-0.5"
                    style={{
                      background: activeTab === tab.key ? 'rgba(255,255,255,0.2)' : 'var(--wm-subtle)',
                      color: activeTab === tab.key ? 'white' : 'var(--wm-muted)',
                    }}
                  >
                    {tab.count}
                  </span>
                ) : null}
              </Button>
            ))}
          </div>

          {/* Search */}
          <div
            className="flex items-center gap-2 rounded-xl border px-3 py-2"
            style={{ borderColor: 'var(--wm-border)', background: 'var(--wm-bg)' }}
          >
            <Search size={14} style={{ color: 'var(--wm-muted)' }} aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by name, email, profession..."
              className="text-sm outline-none bg-transparent"
              style={{ color: 'var(--wm-text)', minWidth: '220px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Bulk action bar */}
        {selectedIds.size > 0 ? (
          <div
            className="flex flex-wrap items-center gap-3 rounded-2xl border px-5 py-3"
            style={{
              borderColor: 'var(--wm-primary)',
              background: 'var(--wm-primary-light)',
              boxShadow: 'var(--wm-shadow-sm)',
            }}
          >
            <span className="text-sm font-semibold" style={{ color: 'var(--wm-primary-dark)' }}>
              {selectedIds.size} selected
            </span>
            <Button
              variant="primary"
              size="sm"
              loading={actionLoading}
              onClick={() => handleApproveRequest(Array.from(selectedIds))}
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
        {loading && providers.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-2xl"
                style={{ background: 'var(--wm-subtle)' }}
              />
            ))}
          </div>
        ) : filteredProviders.length === 0 ? (
          <EmptyState
            title="No providers found"
            description={
              searchQuery
                ? 'No providers match your search. Try a different query.'
                : 'No providers in this category.'
            }
            icon={<ShieldCheck size={24} aria-hidden="true" />}
          />
        ) : (
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: 'var(--wm-border)', background: 'var(--wm-surface)' }}
          >
            {/* Table header */}
            <div
              className="grid grid-cols-[2rem_1.5fr_1fr_0.8fr_0.8fr_auto] items-center gap-4 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b"
              style={{
                color: 'var(--wm-muted)',
                borderColor: 'var(--wm-border)',
                background: 'var(--wm-bg)',
                fontFamily: 'var(--wm-font-display)',
              }}
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
              <span>Reference</span>
              <span>Requested</span>
              <span>Actions</span>
            </div>

            {/* Table rows */}
            <ul className="divide-y" style={{ borderColor: 'var(--wm-border)' }}>
              {filteredProviders.map((provider) => (
                <li
                  key={provider.id}
                  className="grid grid-cols-[2rem_1.5fr_1fr_0.8fr_0.8fr_auto] items-center gap-4 px-4 py-3 transition-colors duration-100"
                  style={
                    selectedIds.has(provider.id)
                      ? { background: 'var(--wm-primary-light)' }
                      : { background: 'transparent' }
                  }
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    aria-label={`Select ${provider.full_name ?? provider.id}`}
                    checked={selectedIds.has(provider.id)}
                    onChange={() => toggleSelect(provider.id)}
                    className="rounded"
                  />

                  {/* Identity */}
                  <div className="min-w-0">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: 'var(--wm-navy)' }}
                    >
                      {provider.full_name ?? 'Unnamed provider'}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--wm-muted)' }}>
                      {provider.email_masked}
                    </p>
                    {provider.profession ? (
                      <p
                        className="text-xs truncate mt-0.5"
                        style={{ color: 'var(--wm-muted)' }}
                      >
                        {provider.profession}
                      </p>
                    ) : null}
                  </div>

                  {/* Status badge */}
                  <div className="flex flex-wrap gap-1.5">
                    {statusBadge(provider.garda_vetting_status)}
                    {provider.garda_vetting_expires_at ? (
                      <span className="text-xs" style={{ color: 'var(--wm-muted)' }}>
                        Exp:{' '}
                        {new Date(provider.garda_vetting_expires_at).toLocaleDateString('en-IE', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    ) : null}
                  </div>

                  {/* Reference */}
                  <div className="text-xs font-mono truncate" style={{ color: 'var(--wm-muted)' }}>
                    {provider.garda_vetting_reference ?? '—'}
                  </div>

                  {/* Request date */}
                  <div
                    className="text-xs font-medium whitespace-nowrap"
                    style={{ color: 'var(--wm-muted)' }}
                  >
                    {daysSince(provider.updated_at)}d ago
                  </div>

                  {/* Row actions */}
                  <div className="flex items-center gap-2">
                    {provider.garda_vetting_status === 'pending' ||
                    provider.garda_vetting_status === 'expired' ? (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          loading={actionLoading}
                          onClick={() => handleApproveRequest([provider.id])}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          loading={actionLoading}
                          onClick={() => handleRejectRequest([provider.id])}
                        >
                          Reject
                        </Button>
                      </>
                    ) : provider.garda_vetting_status === 'approved' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRejectRequest([provider.id])}
                      >
                        Revoke
                      </Button>
                    ) : provider.garda_vetting_status === 'rejected' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        loading={actionLoading}
                        onClick={() => handleApproveRequest([provider.id])}
                      >
                        Approve
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-xs text-right" style={{ color: 'var(--wm-muted)' }}>
          Auto-refreshes every 60 seconds. {stats.total} total vetting records.
        </p>
      </div>
    </>
  );
}
