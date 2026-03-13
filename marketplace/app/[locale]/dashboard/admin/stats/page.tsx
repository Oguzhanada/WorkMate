'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import Shell from '@/components/ui/Shell';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import AlertBanner from '@/components/ui/AlertBanner';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';

import type { PlatformStats, MonthlyDataPoint } from '@/app/api/admin/stats/route';

// ─── Constants ────────────────────────────────────────────────────────────────

const AUTO_REFRESH_MS = 5 * 60 * 1000; // 5 minutes

type DateFilter = 'today' | 'week' | 'month' | 'all';

const DATE_FILTER_LABELS: Record<DateFilter, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  all: 'All Time',
};

// ─── Growth bar chart (recharts) ──────────────────────────────────────────────

const CHART_EMERALD = '#169B62';
const CHART_NAVY = '#1B2A4A';

function GrowthChartTooltip({
  active, payload, label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '10px 14px',
        fontSize: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
      }}
    >
      {label && <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#0f172a' }}>{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} style={{ margin: '2px 0', color: entry.color }}>
          <span style={{ fontWeight: 500 }}>{entry.name}: </span>
          <span style={{ fontWeight: 700 }}>{entry.value.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
}

function GrowthChart({ data }: { data: MonthlyDataPoint[] }) {
  if (!data.length) return null;

  const chartData = data.map((point) => {
    const [year, month] = point.month.split('-');
    const label = new Date(Number(year), Number(month) - 1, 1).toLocaleString('en-IE', { month: 'short' });
    return { month: label, 'New Users': point.new_users, 'New Jobs': point.new_jobs };
  });

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ borderColor: 'var(--wm-border)', background: 'var(--wm-surface)', boxShadow: 'var(--wm-shadow-sm)' }}
    >
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 10, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<GrowthChartTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
          />
          <Bar dataKey="New Users" fill={CHART_EMERALD} radius={[4, 4, 0, 0]}>
            {chartData.map((_, i) => <Cell key={i} fill={CHART_EMERALD} />)}
          </Bar>
          <Bar dataKey="New Jobs" fill={CHART_NAVY} radius={[4, 4, 0, 0]} opacity={0.85}>
            {chartData.map((_, i) => <Cell key={i} fill={CHART_NAVY} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return (
    <p
      className="text-xs font-bold uppercase tracking-widest"
      style={{ color: 'var(--wm-muted)', fontFamily: 'var(--wm-font-display)' }}
    >
      {children}
    </p>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function AdminStatsPage() {
  const router = useRouter();

  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [monthly, setMonthly] = useState<MonthlyDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<DateFilter>('all');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    setError(null);
    try {
      const [statsRes, monthlyRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/stats?monthly=true'),
      ]);

      if (statsRes.status === 401 || statsRes.status === 403) {
        router.replace('/');
        return;
      }

      if (!statsRes.ok || !monthlyRes.ok) {
        throw new Error('Failed to load platform stats.');
      }

      const [statsData, monthlyData] = await Promise.all([
        statsRes.json() as Promise<PlatformStats>,
        monthlyRes.json() as Promise<MonthlyDataPoint[]>,
      ]);

      setStats(statsData);
      setMonthly(monthlyData);
      setLastRefreshed(new Date());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unexpected error.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Initial load + auto-refresh
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchStats]);

  // ── Derive filter-adjusted counts ──────────────────────────────────────────
  // The API returns pre-computed week/month counts. For "today" we can't know
  // without a dedicated query, so we fall back to displaying "This Week" data
  // and note it in the UI. Filtering is primarily a UX signal here; the counts
  // displayed reflect the best available server-side aggregation.

  const usersNewDisplay =
    filter === 'week' || filter === 'today'
      ? stats?.users.new_this_week
      : filter === 'month'
        ? stats?.users.new_this_month
        : stats?.users.total;

  const jobsDisplay =
    filter === 'month'
      ? stats?.jobs.this_month
      : stats?.jobs.total;

  const appointmentsDisplay =
    filter === 'month'
      ? stats?.appointments.this_month
      : stats?.appointments.total;

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return null; // Suspense/loading.tsx handles skeleton

  if (!loading && !stats && error) {
    return (
      <Shell>
        <EmptyState
          title="Failed to load stats"
          description={error}
          action={
            <Button variant="primary" onClick={fetchStats}>
              Retry
            </Button>
          }
        />
      </Shell>
    );
  }

  if (!stats) return null;

  return (
    <Shell>
      <div className="space-y-8">
        {/* Header */}
        <PageHeader
          title="Platform Overview"
          description="Real-time platform health: users, jobs, revenue, and growth."
          action={
            <div className="flex items-center gap-3">
              {lastRefreshed ? (
                <span className="text-xs" style={{ color: 'var(--wm-muted)' }}>
                  Updated {lastRefreshed.toLocaleTimeString('en-IE', { timeStyle: 'short' })}
                </span>
              ) : null}
              <Button variant="secondary" size="sm" onClick={fetchStats}>
                Refresh
              </Button>
            </div>
          }
        />

        {/* Inline error alert (soft refresh failures) */}
        {error && (
          <AlertBanner
            variant="error"
            title="Failed to refresh stats"
            description={error}
            dismissible
            onDismiss={() => setError(null)}
          />
        )}

        {/* Date filter */}
        <div
          className="flex flex-wrap gap-2 rounded-2xl border p-4"
          style={{ borderColor: 'var(--wm-border)', background: 'var(--wm-surface)', boxShadow: 'var(--wm-shadow-xs)' }}
        >
          {(Object.keys(DATE_FILTER_LABELS) as DateFilter[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {DATE_FILTER_LABELS[f]}
            </Button>
          ))}
        </div>

        {/* ── Section 1: Users & Providers ────────────────────────────────── */}
        <div className="space-y-4">
          <SectionLabel>Users &amp; Providers</SectionLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Users"
              value={stats.users.total.toLocaleString('en-IE')}
              accent="navy"
              trend="up"
              trendLabel={`+${stats.users.new_this_week} this week`}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
            />
            <StatCard
              label="Verified Providers"
              value={stats.providers.verified.toLocaleString('en-IE')}
              accent="primary"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              }
            />
            <StatCard
              label="Pending Verification"
              value={stats.providers.pending.toLocaleString('en-IE')}
              accent="amber"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              }
            />
            <StatCard
              label={filter === 'today' || filter === 'week' ? 'New Users (Week)' : filter === 'month' ? 'New Users (Month)' : 'Total Users'}
              value={(usersNewDisplay ?? 0).toLocaleString('en-IE')}
              accent="blue"
              trend="up"
              trendLabel={`+${stats.providers.new_this_month} new providers this month`}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              }
            />
          </div>
        </div>

        {/* ── Section 2: Jobs & Activity ──────────────────────────────────── */}
        <div className="space-y-4">
          <SectionLabel>Jobs &amp; Activity</SectionLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={filter === 'month' ? 'Jobs This Month' : 'Total Jobs'}
              value={(jobsDisplay ?? 0).toLocaleString('en-IE')}
              accent="navy"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              }
            />
            <StatCard
              label="Open Jobs"
              value={stats.jobs.open.toLocaleString('en-IE')}
              accent="primary"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              }
            />
            <StatCard
              label="In Progress"
              value={stats.jobs.in_progress.toLocaleString('en-IE')}
              accent="amber"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              }
            />
            <StatCard
              label="Completed This Month"
              value={stats.jobs.completed.toLocaleString('en-IE')}
              accent="blue"
              trend="up"
              trendLabel={`${stats.jobs.this_month} posted this month`}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              }
            />
          </div>
        </div>

        {/* ── Section 3: Quality ───────────────────────────────────────────── */}
        <div className="space-y-4">
          <SectionLabel>Quality &amp; Engagement</SectionLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Total Reviews"
              value={stats.reviews.total.toLocaleString('en-IE')}
              accent="primary"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              }
            />
            <StatCard
              label="Avg Rating"
              value={stats.reviews.avg_rating > 0 ? `${stats.reviews.avg_rating} / 5` : '—'}
              accent="amber"
              trendLabel={stats.reviews.avg_rating >= 4 ? 'Excellent' : stats.reviews.avg_rating >= 3 ? 'Good' : 'Needs attention'}
              trend={stats.reviews.avg_rating >= 4 ? 'up' : stats.reviews.avg_rating >= 3 ? 'neutral' : 'down'}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              }
            />
            <StatCard
              label={filter === 'month' ? 'Appointments (Month)' : 'Total Appointments'}
              value={(appointmentsDisplay ?? 0).toLocaleString('en-IE')}
              accent="blue"
              trendLabel={`${stats.appointments.upcoming} upcoming`}
              trend="neutral"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              }
            />
          </div>
        </div>

        {/* ── Section 4: Growth Chart ──────────────────────────────────────── */}
        <div className="space-y-4">
          <SectionLabel>Growth — Last 6 Months</SectionLabel>
          {monthly.length > 0 ? (
            <GrowthChart data={monthly} />
          ) : (
            <EmptyState
              title="No growth data"
              description="Not enough data to display the monthly growth chart yet."
            />
          )}
        </div>

        {/* ── Revenue note ─────────────────────────────────────────────────── */}
        <div
          className="flex items-start gap-3 rounded-2xl border p-4"
          style={{ borderColor: 'var(--wm-border)', background: 'var(--wm-surface)' }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="mt-0.5 shrink-0"
            style={{ color: 'var(--wm-muted)' }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm" style={{ color: 'var(--wm-muted)' }}>
            <strong style={{ color: 'var(--wm-navy)' }}>
              Active paid subscriptions: {stats.revenue.total_stripe_captured}
            </strong>
            {' '}— Full revenue figures (EUR captured) will appear once Stripe invoice sync is enabled.
          </p>
        </div>
      </div>
    </Shell>
  );
}
