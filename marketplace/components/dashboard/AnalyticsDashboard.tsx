'use client';

import { useCallback, useEffect, useState } from 'react';
import styles from './analytics-dashboard.module.css';

// ── Types ──────────────────────────────────────────────────────────────────

type DayPoint = {
  date: string;
  jobs: number;
  completed: number;
  quotes: number;
};

type CategoryRow = {
  category: string;
  count: number;
  pct: number;
};

type ProviderRow = {
  provider_id: string;
  full_name: string;
  avg_rating: number;
  completed_jobs: number;
  ranking_score: number;
};

type Summary = {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  totalRevenueCents: number;
  totalCommissionCents: number;
  avgJobValueCents: number;
  verifiedUsers: number;
  pendingApplications: number;
  totalPayments: number;
};

type AnalyticsData = {
  summary: Summary;
  dailySeries: DayPoint[];
  categoryBreakdown: CategoryRow[];
  topProviders: ProviderRow[];
  generatedAt: string;
  days: number;
};

// ── Helpers ────────────────────────────────────────────────────────────────

function eur(cents: number) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(
    cents / 100
  );
}

function stars(rating: number) {
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(Math.max(0, 5 - full));
}

// ── SVG Line Chart ─────────────────────────────────────────────────────────

const CHART_W = 640;
const CHART_H = 160;
const PAD = { top: 12, right: 16, bottom: 32, left: 40 };

function LineChart({ series, days }: { series: DayPoint[]; days: number }) {
  if (series.length === 0) return <p className={styles.muted}>No data</p>;

  const innerW = CHART_W - PAD.left - PAD.right;
  const innerH = CHART_H - PAD.top - PAD.bottom;

  const maxVal = Math.max(...series.map((d) => Math.max(d.jobs, d.quotes, d.completed)), 1);

  const xScale = (i: number) => PAD.left + (i / (series.length - 1 || 1)) * innerW;
  const yScale = (v: number) => PAD.top + innerH - (v / maxVal) * innerH;

  const polyline = (key: keyof DayPoint) =>
    series.map((d, i) => `${xScale(i)},${yScale(Number(d[key]))}`).join(' ');

  // Tick labels: show every ~7 days
  const tickStep = Math.max(1, Math.floor(days / 6));
  const ticks = series
    .map((d, i) => ({ i, label: d.date.slice(5) }))
    .filter((_, i) => i % tickStep === 0 || i === series.length - 1);

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    y: PAD.top + innerH - f * innerH,
    label: Math.round(f * maxVal),
  }));

  return (
    <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className={styles.chartSvg} aria-label="Daily activity chart">
      {/* Grid */}
      {gridLines.map(({ y, label }) => (
        <g key={y}>
          <line x1={PAD.left} y1={y} x2={PAD.left + innerW} y2={y} stroke="#e2e8f0" strokeWidth={1} />
          <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#94a3b8">{label}</text>
        </g>
      ))}
      {/* X axis labels */}
      {ticks.map(({ i, label }) => (
        <text key={i} x={xScale(i)} y={CHART_H - 6} textAnchor="middle" fontSize={10} fill="#94a3b8">{label}</text>
      ))}
      {/* Lines */}
      <polyline points={polyline('jobs')} fill="none" stroke="#0ea5e9" strokeWidth={2} strokeLinejoin="round" />
      <polyline points={polyline('quotes')} fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeLinejoin="round" strokeDasharray="4 2" />
      <polyline points={polyline('completed')} fill="none" stroke="#10b981" strokeWidth={1.5} strokeLinejoin="round" />
      {/* Dots on jobs line */}
      {series.map((d, i) => (
        <circle key={i} cx={xScale(i)} cy={yScale(d.jobs)} r={2.5} fill="#0ea5e9" />
      ))}
    </svg>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  const load = useCallback((d: number) => {
    setLoading(true);
    setError(null);
    fetch(`/api/admin/analytics?days=${d}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) { setError(json.error); return; }
        setData(json as AnalyticsData);
      })
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(days); }, [days, load]);

  if (error) return <p className={styles.errorMsg}>{error}</p>;
  if (loading || !data) return <p className={styles.muted}>Loading analytics...</p>;

  const { summary, dailySeries, categoryBreakdown, topProviders } = data;

  return (
    <div className={styles.root}>
      {/* Header + range picker */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.heading}>Platform Analytics</h2>
          <p className={styles.sub}>
            Last updated {new Date(data.generatedAt).toLocaleTimeString('en-IE')}
          </p>
        </div>
        <div className={styles.rangePicker}>
          {([7, 14, 30, 90] as const).map((d) => (
            <button
              key={d}
              type="button"
              className={`${styles.rangeBtn} ${days === d ? styles.rangeBtnActive : ''}`}
              onClick={() => setDays(d)}
            >
              {d}d
            </button>
          ))}
          <button type="button" className={styles.refreshBtn} onClick={() => load(days)}>
            Refresh
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className={styles.kpiGrid}>
        <KpiCard label="Total Jobs" value={summary.totalJobs.toLocaleString()} accent="#0ea5e9" />
        <KpiCard label="Active Jobs" value={summary.activeJobs.toLocaleString()} accent="#f59e0b" />
        <KpiCard label="Completed Jobs" value={summary.completedJobs.toLocaleString()} accent="#10b981" />
        <KpiCard label="Total Revenue" value={eur(summary.totalRevenueCents)} accent="#8b5cf6" />
        <KpiCard label="Platform Commission" value={eur(summary.totalCommissionCents)} accent="#ec4899" />
        <KpiCard label="Avg Job Value" value={eur(summary.avgJobValueCents)} accent="#64748b" />
        <KpiCard label="Verified Users" value={summary.verifiedUsers.toLocaleString()} accent="#0ea5e9" />
        <KpiCard label="Pending Applications" value={summary.pendingApplications.toLocaleString()} accent="#ef4444" />
      </div>

      {/* Activity chart */}
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Daily Activity — Last {days} days</h3>
          <div className={styles.legend}>
            <span className={styles.legendDot} style={{ background: '#0ea5e9' }} />Jobs
            <span className={styles.legendDot} style={{ background: '#f59e0b' }} />Quotes
            <span className={styles.legendDot} style={{ background: '#10b981' }} />Completed
          </div>
        </div>
        <div className={styles.chartWrap}>
          <LineChart series={dailySeries} days={days} />
        </div>
      </section>

      <div className={styles.twoCol}>
        {/* Category breakdown */}
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Category Breakdown</h3>
          {categoryBreakdown.length === 0 ? (
            <p className={styles.muted}>No data</p>
          ) : (
            <ul className={styles.catList}>
              {categoryBreakdown.map((row) => (
                <li key={row.category} className={styles.catRow}>
                  <span className={styles.catLabel}>{row.category}</span>
                  <div className={styles.barWrap}>
                    <div className={styles.bar} style={{ width: `${row.pct}%` }} />
                  </div>
                  <span className={styles.catCount}>{row.count} ({row.pct}%)</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Top providers */}
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Top Providers by Ranking</h3>
          {topProviders.length === 0 ? (
            <p className={styles.muted}>No ranking data yet. Refresh provider_rankings view.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Provider</th>
                    <th>Rating</th>
                    <th>Jobs Done</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {topProviders.map((p, i) => (
                    <tr key={p.provider_id}>
                      <td className={styles.rank}>{i + 1}</td>
                      <td>{p.full_name}</td>
                      <td title={`${p.avg_rating.toFixed(2)}/5`}>
                        <span className={styles.stars}>{stars(p.avg_rating)}</span>
                      </td>
                      <td className={styles.num}>{p.completed_jobs}</td>
                      <td className={styles.score}>{p.ranking_score.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ── KPI card sub-component ─────────────────────────────────────────────────

function KpiCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className={styles.kpi}>
      <span className={styles.kpiDot} style={{ background: accent }} />
      <p className={styles.kpiLabel}>{label}</p>
      <p className={styles.kpiValue}>{value}</p>
    </div>
  );
}
