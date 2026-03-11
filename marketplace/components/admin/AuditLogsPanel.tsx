'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';

// ─── Types ────────────────────────────────────────────────────────────────────

type AuditLog = {
  id: string;
  admin_user_id: string | null;
  admin_email: string | null;
  action: string;
  target_type: string;
  target_profile_id: string | null;
  target_label: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

type ApiResponse = {
  logs: AuditLog[];
  total: number;
  limit: number;
  offset: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

const ACTION_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'batch_verification_approved',   label: 'Verification approved' },
  { value: 'batch_verification_rejected',   label: 'Verification rejected' },
  { value: 'gdpr_deletion_processed',       label: 'GDPR deletion' },
  { value: 'risk_reviewed',                 label: 'Risk reviewed' },
  { value: 'feature_flag_toggled',          label: 'Feature flag' },
];

const DAYS_OPTIONS = [
  { value: '7',   label: 'Last 7 days' },
  { value: '30',  label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
];

// ─── Action badge mapping ─────────────────────────────────────────────────────

type BadgeTone = 'open' | 'pending' | 'completed' | 'assigned' | 'neutral' | 'primary' | 'amber' | 'navy';

function actionTone(action: string): BadgeTone {
  if (action.includes('approved') || action.includes('deleted') || action.includes('processed')) return 'primary';
  if (action.includes('rejected') || action.includes('risk')) return 'amber';
  if (action.includes('gdpr')) return 'navy';
  if (action.includes('flag')) return 'assigned';
  return 'neutral';
}

function formatAction(action: string): string {
  return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── CSV export ───────────────────────────────────────────────────────────────

function exportToCsv(logs: AuditLog[]) {
  const headers = ['ID', 'Timestamp', 'Admin Email', 'Action', 'Target Type', 'Target ID', 'Target Label', 'Details'];
  const rows = logs.map((log) => [
    log.id,
    log.created_at,
    log.admin_email ?? '',
    log.action,
    log.target_type ?? '',
    log.target_profile_id ?? '',
    log.target_label ?? '',
    JSON.stringify(log.details ?? {}),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AuditLogsPanel() {
  const [logs, setLogs]           = useState<AuditLog[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  // Filters
  const [action, setAction]       = useState('');
  const [days, setDays]           = useState('30');
  const [adminId, setAdminId]     = useState('');
  const [offset, setOffset]       = useState(0);

  // For CSV: we need a ref to the current filter state to pass to the full-fetch
  const filtersRef = useRef({ action, days, adminId });
  filtersRef.current = { action, days, adminId };

  const fetchLogs = useCallback(async (currentOffset: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit:  String(PAGE_SIZE),
        offset: String(currentOffset),
        days:   days || '30',
      });
      if (action)  params.set('action',   action);
      if (adminId) params.set('admin_id', adminId);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error ?? 'Failed to load audit logs');
      }
      const data: ApiResponse = await res.json();
      setLogs(data.logs);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [action, days, adminId]);

  // Re-fetch when filters change; reset to page 0
  useEffect(() => {
    setOffset(0);
    fetchLogs(0);
  }, [fetchLogs]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  function handlePrev() {
    const newOffset = Math.max(offset - PAGE_SIZE, 0);
    setOffset(newOffset);
    fetchLogs(newOffset);
  }

  function handleNext() {
    const newOffset = offset + PAGE_SIZE;
    if (newOffset < total) {
      setOffset(newOffset);
      fetchLogs(newOffset);
    }
  }

  async function handleExport() {
    // Fetch up to 1000 rows for export (no pagination)
    const { action: a, days: d, adminId: ai } = filtersRef.current;
    const params = new URLSearchParams({ limit: '1000', offset: '0', days: d || '30' });
    if (a)  params.set('action',   a);
    if (ai) params.set('admin_id', ai);
    const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
    if (!res.ok) return;
    const data: ApiResponse = await res.json();
    exportToCsv(data.logs);
  }

  return (
    <div className="space-y-4">
      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div
        className="flex flex-wrap gap-3 rounded-2xl border p-4"
        style={{ borderColor: 'var(--wm-border)', background: 'var(--wm-surface)' }}
      >
        {/* Action filter */}
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="rounded-xl border px-3 py-2 text-sm"
          style={{
            borderColor: 'var(--wm-border)',
            background: 'var(--wm-bg)',
            color: 'var(--wm-text)',
          }}
        >
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Date range filter */}
        <select
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className="rounded-xl border px-3 py-2 text-sm"
          style={{
            borderColor: 'var(--wm-border)',
            background: 'var(--wm-bg)',
            color: 'var(--wm-text)',
          }}
        >
          {DAYS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Admin UUID filter */}
        <input
          type="text"
          placeholder="Filter by admin UUID"
          value={adminId}
          onChange={(e) => setAdminId(e.target.value.trim())}
          className="rounded-xl border px-3 py-2 text-sm"
          style={{
            borderColor: 'var(--wm-border)',
            background: 'var(--wm-bg)',
            color: 'var(--wm-text)',
            minWidth: '220px',
          }}
        />

        <div className="ml-auto flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => fetchLogs(offset)}>
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={handleExport}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* ── Results summary ─────────────────────────────────────────────────── */}
      {!loading && !error && (
        <p className="text-sm" style={{ color: 'var(--wm-muted)' }}>
          {total === 0
            ? 'No audit log entries match the current filters.'
            : `Showing ${offset + 1}–${Math.min(offset + PAGE_SIZE, total)} of ${total} entries`}
        </p>
      )}

      {/* ── Error state ─────────────────────────────────────────────────────── */}
      {error && (
        <div
          className="rounded-2xl border p-4 text-sm"
          style={{
            borderColor: 'var(--wm-border)',
            background: 'var(--wm-surface)',
            color: 'var(--wm-error, #e53e3e)',
          }}
        >
          {error}
        </div>
      )}

      {/* ── Loading skeleton ────────────────────────────────────────────────── */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {!loading && !error && logs.length === 0 && (
        <div
          className="rounded-2xl border"
          style={{ borderColor: 'var(--wm-border)', background: 'var(--wm-surface)' }}
        >
          <EmptyState
            title="No audit entries found"
            description="No admin actions have been recorded for the selected filters."
            compact
          />
        </div>
      )}

      {/* ── Audit log table ─────────────────────────────────────────────────── */}
      {!loading && !error && logs.length > 0 && (
        <div
          className="overflow-x-auto rounded-2xl border"
          style={{ borderColor: 'var(--wm-border)', background: 'var(--wm-surface)' }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                className="border-b text-left text-xs uppercase tracking-wider"
                style={{ borderColor: 'var(--wm-border)', color: 'var(--wm-muted)' }}
              >
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr
                  key={log.id}
                  className="border-b last:border-0 transition-colors"
                  style={{
                    borderColor: 'var(--wm-border)',
                    background: idx % 2 === 0 ? 'transparent' : 'var(--wm-surface-alt, var(--wm-surface))',
                  }}
                >
                  {/* Timestamp */}
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--wm-muted)', fontVariantNumeric: 'tabular-nums' }}>
                    <time dateTime={log.created_at} title={log.created_at}>
                      {new Date(log.created_at).toLocaleString('en-IE', {
                        day:    '2-digit',
                        month:  'short',
                        year:   'numeric',
                        hour:   '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </td>

                  {/* Admin */}
                  <td className="px-4 py-3" style={{ color: 'var(--wm-text)' }}>
                    {log.admin_email ? (
                      <span title={log.admin_user_id ?? undefined}>{log.admin_email}</span>
                    ) : (
                      <span style={{ color: 'var(--wm-muted)' }}>—</span>
                    )}
                  </td>

                  {/* Action badge */}
                  <td className="px-4 py-3">
                    <Badge tone={actionTone(log.action)} dot>
                      {formatAction(log.action)}
                    </Badge>
                  </td>

                  {/* Target */}
                  <td className="px-4 py-3" style={{ color: 'var(--wm-text)' }}>
                    {log.target_type ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium" style={{ color: 'var(--wm-muted)' }}>
                          {log.target_type}
                        </span>
                        {log.target_label && (
                          <span>{log.target_label}</span>
                        )}
                        {log.target_profile_id && !log.target_label && (
                          <span
                            className="font-mono text-xs"
                            style={{ color: 'var(--wm-muted)' }}
                            title={log.target_profile_id}
                          >
                            {log.target_profile_id.slice(0, 8)}…
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--wm-muted)' }}>—</span>
                    )}
                  </td>

                  {/* Details */}
                  <td className="px-4 py-3 max-w-xs">
                    {log.details && Object.keys(log.details).length > 0 ? (
                      <details className="cursor-pointer">
                        <summary className="text-xs" style={{ color: 'var(--wm-muted)' }}>
                          {Object.keys(log.details).slice(0, 2).join(', ')}
                          {Object.keys(log.details).length > 2 && ', …'}
                        </summary>
                        <pre
                          className="mt-1 overflow-auto rounded-lg p-2 text-xs"
                          style={{
                            background: 'var(--wm-bg)',
                            color: 'var(--wm-text)',
                            maxHeight: '120px',
                          }}
                        >
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    ) : (
                      <span style={{ color: 'var(--wm-muted)' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-end gap-3">
          <span className="text-sm" style={{ color: 'var(--wm-muted)' }}>
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePrev}
            disabled={offset === 0}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleNext}
            disabled={offset + PAGE_SIZE >= total}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
