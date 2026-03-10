'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import StatCard from '@/components/ui/StatCard';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';

// ─── Types ────────────────────────────────────────────────────────────────────

type RiskProvider = {
  id: string;
  full_name: string | null;
  email: string | null;
  risk_score: number;
  risk_flags: string[];
  risk_reviewed_at: string | null;
  verification_status: string | null;
};

type ApiResponse = {
  providers?: RiskProvider[];
  error?: string;
};

type Filter = 'all' | 'unreviewed';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function riskScoreStyle(score: number): React.CSSProperties {
  if (score >= 75) return { color: 'var(--wm-destructive)', fontWeight: 800 };
  if (score >= 50) return { color: 'var(--wm-amber-dark)', fontWeight: 800 };
  return { color: 'var(--wm-warning)', fontWeight: 700 };
}

function riskBadgeTone(score: number): 'neutral' | 'amber' | 'pending' {
  if (score >= 75) return 'neutral'; // we'll override with inline style
  if (score >= 50) return 'amber';
  return 'pending';
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Intl.DateTimeFormat('en-IE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

// ─── Component ────────────────────────────────────────────────────────────────

type Props = { locale: string };

export default function RiskAssessmentPanel({ locale }: Props) {
  const [providers, setProviders] = useState<RiskProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // ── Data loading ───────────────────────────────────────────────────────────

  const load = useCallback(async (activeFilter: Filter) => {
    setLoading(true);
    setError('');
    setSelected(new Set());

    const url =
      activeFilter === 'unreviewed'
        ? '/api/admin/risk?unreviewed=true'
        : '/api/admin/risk';

    try {
      const res = await fetch(url, { cache: 'no-store' });
      const payload = (await res.json()) as ApiResponse;
      if (!res.ok || payload.error) {
        setError(payload.error ?? 'Could not load risk data.');
        return;
      }
      setProviders(payload.providers ?? []);
    } catch {
      setError('Network error loading risk data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(filter);
  }, [filter, load]);

  // ── Stats derived from full unfiltered list (loaded once) ──────────────────
  // We compute stats from whichever set is currently loaded; switching to
  // "All" gives the full picture for stat cards.
  const totalFlagged = providers.length;
  const unreviewedCount = providers.filter((p) => p.risk_reviewed_at === null).length;
  const highRiskCount = providers.filter((p) => p.risk_score >= 75).length;

  // ── Selection helpers ──────────────────────────────────────────────────────

  const allIds = providers.map((p) => p.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  function toggleAll(): void {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allIds));
    }
  }

  function toggleOne(id: string): void {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // ── Bulk mark reviewed ─────────────────────────────────────────────────────

  async function markReviewed(): Promise<void> {
    if (selected.size === 0) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/risk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_ids: Array.from(selected) }),
      });
      const payload = (await res.json()) as { updated?: number; error?: string };

      if (!res.ok || payload.error) {
        toast.error(payload.error ?? 'Bulk review failed.');
        return;
      }

      toast.success(`${payload.updated ?? selected.size} provider(s) marked as reviewed.`);
      await load(filter);
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Flagged"
          value={loading ? '—' : totalFlagged}
          accent="navy"
        />
        <StatCard
          label="Unreviewed"
          value={loading ? '—' : unreviewedCount}
          accent="amber"
        />
        <StatCard
          label="High Risk (≥75)"
          value={loading ? '—' : highRiskCount}
          accent="primary"
        />
      </div>

      {/* Filter + bulk action toolbar */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3"
        style={{ borderColor: 'var(--wm-border)', background: 'var(--wm-surface)' }}
      >
        <div className="flex items-center gap-2">
          <Button
            variant={filter === 'all' ? 'navy' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'unreviewed' ? 'navy' : 'ghost'}
            size="sm"
            onClick={() => setFilter('unreviewed')}
          >
            Unreviewed only
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {selected.size > 0 ? (
            <span className="text-xs font-semibold" style={{ color: 'var(--wm-muted)' }}>
              {selected.size} selected
            </span>
          ) : null}
          <Button
            variant="primary"
            size="sm"
            disabled={selected.size === 0 || submitting}
            loading={submitting}
            onClick={() => void markReviewed()}
          >
            Mark Reviewed
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={loading || submitting}
            loading={loading}
            onClick={() => void load(filter)}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error ? (
        <p
          className="rounded-2xl border px-4 py-3 text-sm font-semibold"
          style={{
            borderColor: 'var(--wm-destructive)',
            background: 'rgba(220,38,38,0.06)',
            color: 'var(--wm-destructive)',
          }}
        >
          {error}
        </p>
      ) : null}

      {/* Provider list */}
      {!loading && providers.length === 0 && !error ? (
        <Card>
          <EmptyState
            title="No flagged providers"
            description={
              filter === 'unreviewed'
                ? 'All flagged providers have been reviewed.'
                : 'No providers have a risk score greater than zero.'
            }
          />
        </Card>
      ) : null}

      {providers.length > 0 ? (
        <div
          className="overflow-hidden rounded-2xl border"
          style={{ borderColor: 'var(--wm-border)' }}
        >
          {/* Table header */}
          <div
            className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 border-b px-4 py-3"
            style={{
              borderColor: 'var(--wm-border)',
              background: 'var(--wm-surface)',
            }}
          >
            <input
              type="checkbox"
              aria-label="Select all"
              checked={allSelected}
              onChange={toggleAll}
              className="h-4 w-4 rounded"
              style={{ accentColor: 'var(--wm-primary)' }}
            />
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: 'var(--wm-muted)', fontFamily: 'var(--wm-font-display)' }}
            >
              Provider
            </span>
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: 'var(--wm-muted)', fontFamily: 'var(--wm-font-display)' }}
            >
              Score
            </span>
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: 'var(--wm-muted)', fontFamily: 'var(--wm-font-display)' }}
            >
              Status
            </span>
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: 'var(--wm-muted)', fontFamily: 'var(--wm-font-display)' }}
            >
              Action
            </span>
          </div>

          {/* Table rows */}
          <ul className="divide-y" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {providers.map((provider) => {
              const isChecked = selected.has(provider.id);
              const reviewed = provider.risk_reviewed_at !== null;
              const flags: string[] = Array.isArray(provider.risk_flags)
                ? provider.risk_flags
                : [];

              return (
                <li
                  key={provider.id}
                  className="grid grid-cols-[auto_1fr_auto_auto_auto] items-start gap-4 px-4 py-4 transition-colors"
                  style={{
                    background: isChecked ? 'var(--wm-primary-light)' : 'var(--wm-background)',
                    borderColor: 'var(--wm-border)',
                  }}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    aria-label={`Select ${provider.full_name ?? provider.id}`}
                    checked={isChecked}
                    onChange={() => toggleOne(provider.id)}
                    className="mt-1 h-4 w-4 rounded"
                    style={{ accentColor: 'var(--wm-primary)' }}
                  />

                  {/* Provider info */}
                  <div className="min-w-0 space-y-1">
                    <p
                      className="truncate text-sm font-bold"
                      style={{ color: 'var(--wm-navy)' }}
                    >
                      {provider.full_name ?? '(No name)'}
                    </p>
                    {provider.email ? (
                      <p className="truncate text-xs" style={{ color: 'var(--wm-muted)' }}>
                        {provider.email}
                      </p>
                    ) : null}
                    {/* Risk flags */}
                    {flags.length > 0 ? (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {flags.map((flag) => (
                          <Badge key={flag} tone="neutral">
                            {flag.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                    {/* Last reviewed timestamp */}
                    {reviewed ? (
                      <p className="text-xs" style={{ color: 'var(--wm-muted)' }}>
                        Reviewed {formatDate(provider.risk_reviewed_at)}
                      </p>
                    ) : null}
                  </div>

                  {/* Risk score */}
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className="text-xl tabular-nums"
                      style={riskScoreStyle(provider.risk_score)}
                    >
                      {provider.risk_score}
                    </span>
                    <Badge tone={riskBadgeTone(provider.risk_score)}>
                      {provider.risk_score >= 75
                        ? 'High'
                        : provider.risk_score >= 50
                        ? 'Medium'
                        : 'Low'}
                    </Badge>
                  </div>

                  {/* Reviewed badge */}
                  <div className="flex items-start">
                    {reviewed ? (
                      <Badge tone="primary" dot>
                        Reviewed
                      </Badge>
                    ) : (
                      <Badge tone="amber" dot>
                        Pending
                      </Badge>
                    )}
                  </div>

                  {/* Action: link to individual profile */}
                  <div className="flex items-start">
                    <Button
                      href={`/${locale}/dashboard/admin/applications/${provider.id}`}
                      variant="ghost"
                      size="sm"
                    >
                      View
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
