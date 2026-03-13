'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Shell from '@/components/ui/Shell';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import Card from '@/components/ui/Card';
import AlertBanner from '@/components/ui/AlertBanner';
import { useToast } from '@/components/ui/Toast';

type DeletionRequest = {
  id: string;
  full_name: string | null;
  email: string | null;
  deletion_requested_at: string;
  days_since_request: number;
  is_eligible: boolean;
};

function maskEmail(email: string | null): string {
  if (!email) return '—';
  const [local, domain] = email.split('@');
  if (!domain) return `${local[0]}***`;
  return `${local[0]}***@${domain}`;
}

function maskName(name: string | null): string {
  if (!name) return '—';
  const parts = name.trim().split(' ');
  return parts.map((p) => `${p[0]}***`).join(' ');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminGdprPage() {
  const params = useParams();
  const locale = typeof params?.locale === 'string' ? params.locale : 'en';

  const { toast } = useToast();
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/gdpr');
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      setRequests(json.requests ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load deletion requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleDelete = async (request: DeletionRequest) => {
    const confirmed = window.confirm(
      `PERMANENT DELETION\n\n` +
      `You are about to permanently delete all data for:\n` +
      `  Name: ${maskName(request.full_name)}\n` +
      `  Email: ${maskEmail(request.email)}\n\n` +
      `This action is irreversible. Financial records (contracts, invoices) are retained per 7-year statutory requirement.\n\n` +
      `Confirm deletion?`
    );
    if (!confirmed) return;

    setProcessingId(request.id);
    setError(null);
    try {
      const res = await fetch('/api/admin/gdpr', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: request.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Deletion failed');
      // Remove from local state on success
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
      toast({ variant: 'success', title: 'Account deleted', description: 'All personal data has been permanently removed.' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Deletion failed. Please try again.';
      setError(msg);
      toast({ variant: 'error', title: 'Deletion failed', description: msg });
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = requests.filter((r) => !r.is_eligible).length;
  const eligibleCount = requests.filter((r) => r.is_eligible).length;
  const totalCount = requests.length;

  return (
    <Shell>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <PageHeader
          title="GDPR Deletion Requests"
          description="Review and process user account deletion requests after the mandatory 30-day hold."
          action={
            <div className="flex gap-2">
              <Button
                onClick={fetchRequests}
                variant="secondary"
                size="sm"
                disabled={loading}
              >
                {loading ? 'Refreshing…' : 'Refresh'}
              </Button>
              <Button href={`/${locale}/dashboard/admin`} variant="secondary" size="sm">
                Back to Dashboard
              </Button>
            </div>
          }
        />

        {/* Legal notice */}
        <div
          className="rounded-xl border px-4 py-3 text-sm font-medium"
          style={{
            borderColor: 'var(--wm-destructive)',
            background: 'rgba(220,38,38,0.06)',
            color: 'var(--wm-destructive)',
          }}
        >
          Deletion is permanent and irreversible. Ensure the legal team has been notified before
          processing any request. Financial records (contracts, invoices, Stripe data) are retained
          for 7 years per statutory obligation and are not removed.
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total Requests"
            value={totalCount}
            accent="navy"
            icon={<span aria-hidden="true">📋</span>}
          />
          <StatCard
            label="Awaiting Hold Period"
            value={pendingCount}
            accent="amber"
            icon={<span aria-hidden="true">⏳</span>}
          />
          <StatCard
            label="Eligible for Deletion"
            value={eligibleCount}
            accent="primary"
            icon={<span aria-hidden="true">✓</span>}
            trend={eligibleCount > 0 ? 'down' : 'neutral'}
            trendLabel={eligibleCount > 0 ? `${eligibleCount} account(s) overdue` : 'None overdue'}
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

        {/* Table */}
        {!loading && requests.length === 0 ? (
          <EmptyState
            title="No deletion requests"
            description="No users have requested account deletion. Requests will appear here once submitted."
          />
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    className="border-b text-left text-xs font-bold uppercase tracking-wider"
                    style={{
                      borderColor: 'var(--wm-border)',
                      color: 'var(--wm-muted)',
                      fontFamily: 'var(--wm-font-display)',
                    }}
                  >
                    <th className="pb-3 pr-4">Name</th>
                    <th className="pb-3 pr-4">Email</th>
                    <th className="pb-3 pr-4">Requested</th>
                    <th className="pb-3 pr-4">Days Waiting</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--wm-border)' }}>
                  {requests.map((req) => {
                    const daysRemaining = Math.max(0, 30 - req.days_since_request);
                    const isProcessing = processingId === req.id;

                    return (
                      <tr
                        key={req.id}
                        className="transition-colors"
                        style={{ color: 'var(--wm-foreground)' }}
                      >
                        <td className="py-4 pr-4 font-medium">{maskName(req.full_name)}</td>
                        <td
                          className="py-4 pr-4 font-mono text-xs"
                          style={{ color: 'var(--wm-muted)' }}
                        >
                          {maskEmail(req.email)}
                        </td>
                        <td className="py-4 pr-4" style={{ color: 'var(--wm-muted)' }}>
                          {formatDate(req.deletion_requested_at)}
                        </td>
                        <td className="py-4 pr-4 tabular-nums font-semibold">
                          {req.days_since_request}d
                        </td>
                        <td className="py-4 pr-4">
                          {req.is_eligible ? (
                            <Badge tone="open" dot>
                              Eligible
                            </Badge>
                          ) : (
                            <Badge tone="pending" dot>
                              Pending
                            </Badge>
                          )}
                        </td>
                        <td className="py-4">
                          {req.is_eligible ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(req)}
                              disabled={isProcessing || processingId !== null}
                            >
                              {isProcessing ? 'Deleting…' : 'Process Deletion'}
                            </Button>
                          ) : (
                            <Button variant="secondary" size="sm" disabled>
                              {daysRemaining}d remaining
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </Shell>
  );
}
