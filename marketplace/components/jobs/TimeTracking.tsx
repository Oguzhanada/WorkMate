'use client';

import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

type TimeEntry = {
  id: string;
  provider_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  hourly_rate: number | null;
  effective_hourly_rate: number;
  description: string | null;
  approved: boolean;
  approved_at: string | null;
  billable_cents: number;
};

type Summary = {
  total_minutes: number;
  approved_minutes: number;
  total_billable_cents: number;
  approved_billable_cents: number;
};

type Props = {
  jobId: string;
  isCustomer: boolean;
  isProvider: boolean;
  isAdmin: boolean;
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours <= 0) return `${remainder} min`;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

export default function TimeTracking({ jobId, isCustomer, isProvider, isAdmin }: Props) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total_minutes: 0,
    approved_minutes: 0,
    total_billable_cents: 0,
    approved_billable_cents: 0,
  });
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const activeEntry = useMemo(
    () => entries.find((entry) => entry.id === activeEntryId) ?? null,
    [entries, activeEntryId]
  );

  const loadEntries = async () => {
    setLoading(true);
    setError('');
    const response = await fetch(`/api/jobs/${jobId}/time-entries`, { cache: 'no-store' });
    const payload = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setError(payload.error || 'Time entries could not be loaded.');
      return;
    }
    setEntries(payload.entries ?? []);
    setSummary(payload.summary ?? summary);
    setActiveEntryId(payload.active_entry_id ?? null);
  };

  useEffect(() => {
    loadEntries();
  }, [jobId]);

  const startTimer = async () => {
    setPending(true);
    setError('');
    setOk('');
    try {
      const response = await fetch(`/api/jobs/${jobId}/time-entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          description: description.trim() || undefined,
          hourly_rate: hourlyRate.trim() ? Number(hourlyRate) : null,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || 'Timer could not be started.');
        return;
      }
      setDescription('');
      setHourlyRate('');
      setOk('Timer started.');
      await loadEntries();
    } finally {
      setPending(false);
    }
  };

  const stopTimer = async () => {
    setPending(true);
    setError('');
    setOk('');
    try {
      const response = await fetch(`/api/jobs/${jobId}/time-entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'stop',
          entry_id: activeEntryId ?? undefined,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || 'Timer could not be stopped.');
        return;
      }
      setOk('Timer stopped.');
      await loadEntries();
    } finally {
      setPending(false);
    }
  };

  const setApproval = async (entryId: string, approved: boolean) => {
    setPending(true);
    setError('');
    setOk('');
    try {
      const response = await fetch(`/api/jobs/${jobId}/time-entries/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || 'Approval update failed.');
        return;
      }
      setOk(approved ? 'Time entry approved.' : 'Approval removed.');
      await loadEntries();
    } finally {
      setPending(false);
    }
  };

  const removeEntry = async (entryId: string) => {
    setPending(true);
    setError('');
    setOk('');
    try {
      const response = await fetch(`/api/jobs/${jobId}/time-entries/${entryId}`, { method: 'DELETE' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || 'Entry could not be deleted.');
        return;
      }
      setOk('Time entry deleted.');
      await loadEntries();
    } finally {
      setPending(false);
    }
  };

  const createInvoice = async () => {
    setPending(true);
    setError('');
    setOk('');
    try {
      const response = await fetch(`/api/jobs/${jobId}/create-invoice`, { method: 'POST' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || 'Invoice could not be created.');
        return;
      }
      setOk(`Invoice created: ${payload.stripe_invoice_id}`);
      await loadEntries();
    } finally {
      setPending(false);
    }
  };

  return (
    <Card className="rounded-2xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3>Time Tracking</h3>
          <p className="mt-1 text-sm" style={{ color: 'var(--wm-muted)' }}>
            Track worked time, approve entries, and generate hourly invoice.
          </p>
        </div>
        <Badge tone={activeEntry ? 'open' : 'neutral'}>{activeEntry ? 'Timer active' : 'Timer idle'}</Badge>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl px-3 py-2" style={{ border: '1px solid var(--wm-border)' }}>
          <p className="text-xs" style={{ color: 'var(--wm-muted)' }}>Total tracked</p>
          <p className="mt-1 text-lg font-semibold">{formatMinutes(summary.total_minutes)}</p>
        </div>
        <div className="rounded-xl px-3 py-2" style={{ border: '1px solid var(--wm-border)' }}>
          <p className="text-xs" style={{ color: 'var(--wm-muted)' }}>Approved time</p>
          <p className="mt-1 text-lg font-semibold">{formatMinutes(summary.approved_minutes)}</p>
        </div>
        <div className="rounded-xl px-3 py-2" style={{ border: '1px solid var(--wm-border)' }}>
          <p className="text-xs" style={{ color: 'var(--wm-muted)' }}>Approved billable</p>
          <p className="mt-1 text-lg font-semibold">{formatCurrency(summary.approved_billable_cents)}</p>
        </div>
      </div>

      {isProvider ? (
        <div className="mt-4 rounded-xl p-3" style={{ border: '1px solid var(--wm-border)' }}>
          <p className="text-sm font-medium">Provider timer controls</p>
          <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
            <input
              className="rounded-lg px-3 py-2 text-sm"
              style={{ border: '1px solid var(--wm-border)', background: 'var(--wm-surface)' }}
              placeholder="Work description (optional)"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={2000}
              disabled={pending || Boolean(activeEntry)}
            />
            <input
              className="rounded-lg px-3 py-2 text-sm"
              style={{ border: '1px solid var(--wm-border)', background: 'var(--wm-surface)' }}
              placeholder="Hourly rate (cents, optional)"
              type="number"
              min={1}
              value={hourlyRate}
              onChange={(event) => setHourlyRate(event.target.value)}
              disabled={pending || Boolean(activeEntry)}
            />
            <div className="flex gap-2">
              <Button variant="primary" onClick={startTimer} disabled={pending || Boolean(activeEntry)}>
                Start
              </Button>
              <Button variant="secondary" onClick={stopTimer} disabled={pending || !activeEntry}>
                Stop
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={loadEntries} disabled={pending || loading}>
          Refresh
        </Button>
        {(isProvider || isAdmin) ? (
          <Button variant="primary" onClick={createInvoice} disabled={pending || summary.approved_billable_cents <= 0}>
            Create Invoice
          </Button>
        ) : null}
      </div>

      <div className="mt-4 space-y-2">
        {loading ? <p className="text-sm" style={{ color: 'var(--wm-muted)' }}>Loading time entries...</p> : null}
        {!loading && entries.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--wm-muted)' }}>No time entries yet.</p>
        ) : null}
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="rounded-xl p-3"
            style={{ border: '1px solid var(--wm-border)' }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">
                  {new Date(entry.started_at).toLocaleString('en-IE', { dateStyle: 'short', timeStyle: 'short' })}
                  {' -> '}
                  {entry.ended_at
                    ? new Date(entry.ended_at).toLocaleString('en-IE', { dateStyle: 'short', timeStyle: 'short' })
                    : 'Active'}
                </p>
                <p className="text-xs" style={{ color: 'var(--wm-muted)' }}>
                  {entry.duration_minutes ? formatMinutes(entry.duration_minutes) : '-'} • Rate {formatCurrency(entry.effective_hourly_rate)} / hr
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <Badge tone={entry.approved ? 'completed' : 'pending'}>
                  {entry.approved ? 'Approved' : 'Pending approval'}
                </Badge>
                {entry.ended_at ? <Badge tone="neutral">{formatCurrency(entry.billable_cents)}</Badge> : null}
              </div>
            </div>

            {entry.description ? (
              <p className="mt-2 text-sm" style={{ color: 'var(--wm-text)' }}>{entry.description}</p>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2">
              {isCustomer && entry.ended_at ? (
                <Button
                  size="sm"
                  variant={entry.approved ? 'secondary' : 'primary'}
                  onClick={() => setApproval(entry.id, !entry.approved)}
                  disabled={pending}
                >
                  {entry.approved ? 'Remove approval' : 'Approve'}
                </Button>
              ) : null}
              {(isProvider || isAdmin) && !entry.approved ? (
                <Button size="sm" variant="ghost" onClick={() => removeEntry(entry.id)} disabled={pending}>
                  Delete
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {error ? <p className="mt-3 text-sm text-[var(--wm-destructive)]">{error}</p> : null}
      {ok ? <p className="mt-3 text-sm" style={{ color: 'var(--wm-primary)' }}>{ok}</p> : null}
    </Card>
  );
}
