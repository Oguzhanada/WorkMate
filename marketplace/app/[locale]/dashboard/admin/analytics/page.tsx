import { redirect } from 'next/navigation';
import { canAccessAdmin, getUserRoles } from '@/lib/auth/rbac';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import Shell from '@/components/ui/Shell';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { TrendingDown, ArrowRight, Users, Briefcase, FileText, AlertTriangle } from 'lucide-react';

export const metadata = { title: 'Analytics — WorkMate Admin' };

// ─── Platform overview types ──────────────────────────────────────────────────

type PlatformStats = {
  customers: number;
  verified_pros: number;
  open_jobs: number;
  total_quotes: number;
  high_risk_providers: number;
  pending_applications: number;
};

// ─── Types ────────────────────────────────────────────────────────────────────

type FunnelRow = {
  funnel_name: string;
  step_name: string;
  step_number: number;
  count: number;
};

type FunnelGroup = {
  name: string;
  label: string;
  steps: (FunnelRow & { pctFromFirst: number; pctFromPrev: number })[];
};

type DaysParam = '7' | '30' | 'all';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FUNNEL_LABELS: Record<string, string> = {
  job_posting: 'Job Posting',
  provider_onboarding: 'Provider Onboarding',
  booking: 'Booking',
};

function formatStepName(raw: string): string {
  return raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function groupByFunnel(rows: FunnelRow[]): FunnelGroup[] {
  const map = new Map<string, FunnelRow[]>();
  for (const row of rows) {
    if (!map.has(row.funnel_name)) map.set(row.funnel_name, []);
    map.get(row.funnel_name)!.push(row);
  }

  const groups: FunnelGroup[] = [];
  for (const [name, steps] of map) {
    const sorted = [...steps].sort((a, b) => a.step_number - b.step_number);
    const firstCount = sorted[0]?.count ?? 1;
    groups.push({
      name,
      label: FUNNEL_LABELS[name] ?? formatStepName(name),
      steps: sorted.map((s, i) => ({
        ...s,
        pctFromFirst: firstCount > 0 ? Math.round((s.count / firstCount) * 100) : 0,
        pctFromPrev:
          i === 0
            ? 100
            : sorted[i - 1].count > 0
              ? Math.round((s.count / sorted[i - 1].count) * 100)
              : 0,
      })),
    });
  }

  // Sort funnels in a consistent order: job_posting, provider_onboarding, booking
  const ORDER = ['job_posting', 'provider_onboarding', 'booking'];
  groups.sort((a, b) => {
    const ai = ORDER.indexOf(a.name);
    const bi = ORDER.indexOf(b.name);
    if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return groups;
}

function computeSummaryStats(groups: FunnelGroup[], totalToday: number) {
  let totalStarted = 0;
  let totalCompleted = 0;

  for (const g of groups) {
    if (g.steps.length === 0) continue;
    totalStarted += g.steps[0].count;
    totalCompleted += g.steps[g.steps.length - 1].count;
  }

  const overallRate =
    totalStarted > 0 ? Math.round((totalCompleted / totalStarted) * 100) : 0;

  return { totalToday, totalStarted, totalCompleted, overallRate };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FunnelBar({ pct, accent }: { pct: number; accent?: 'primary' | 'navy' }) {
  const bg = accent === 'navy' ? 'var(--wm-navy)' : 'var(--wm-primary)';
  const opacity = pct < 20 ? 0.45 : pct < 50 ? 0.7 : 1;
  return (
    <div
      className="overflow-hidden rounded-lg"
      style={{
        height: '24px',
        width: '100%',
        background: 'var(--wm-subtle)',
        borderRadius: 'var(--wm-radius)',
      }}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        style={{
          width: `${Math.max(pct, 2)}%`,
          height: '100%',
          background: bg,
          opacity,
          borderRadius: 'var(--wm-radius)',
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  );
}

function FunnelPanel({ group }: { group: FunnelGroup }) {
  return (
    <div
      className="rounded-2xl border p-6"
      style={{ borderColor: 'var(--wm-border)', background: 'var(--wm-surface)', boxShadow: 'var(--wm-shadow-sm)' }}
    >
      <div className="mb-4 flex items-center gap-3">
        <h2
          className="text-base font-bold"
          style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
        >
          {group.label}
        </h2>
        <Badge tone="navy">{group.steps.length} steps</Badge>
        {group.steps.length > 0 && (
          <Badge tone="primary">
            {group.steps[group.steps.length - 1].pctFromFirst}% overall
          </Badge>
        )}
      </div>

      {group.steps.length === 0 ? (
        <EmptyState
          title="No data yet"
          description="Events will appear here once users enter this funnel."
          compact
        />
      ) : (
        <div className="space-y-3">
          {group.steps.map((step, i) => (
            <div key={step.step_name} className="flex items-center gap-3">
              {/* Step number */}
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{
                  background: 'var(--wm-primary-light)',
                  color: 'var(--wm-primary-dark)',
                  fontFamily: 'var(--wm-font-display)',
                }}
              >
                {i + 1}
              </div>

              {/* Step name */}
              <div className="w-48 shrink-0">
                <p className="truncate text-sm font-medium" style={{ color: 'var(--wm-foreground)' }}>
                  {formatStepName(step.step_name)}
                </p>
              </div>

              {/* Bar */}
              <div className="flex-1">
                <FunnelBar pct={step.pctFromFirst} />
              </div>

              {/* Stats */}
              <div className="flex w-32 shrink-0 items-center justify-end gap-2 text-right">
                <span
                  className="text-sm font-bold tabular-nums"
                  style={{ color: 'var(--wm-navy)', fontFamily: 'var(--wm-font-display)' }}
                >
                  {step.count.toLocaleString()}
                </span>
                <span className="text-xs" style={{ color: 'var(--wm-muted)' }}>
                  {step.pctFromFirst}%
                </span>
                {i > 0 && (
                  <span
                    className="hidden text-xs xl:inline"
                    style={{ color: step.pctFromPrev < 60 ? 'var(--wm-destructive)' : 'var(--wm-muted)' }}
                  >
                    ({step.pctFromPrev}% prev)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FunnelDropOffPanel({ groups }: { groups: FunnelGroup[] }) {
  if (groups.length === 0) return null;

  return (
    <div
      className="rounded-2xl border p-6"
      style={{ borderColor: 'var(--wm-border)', background: 'var(--wm-surface)', boxShadow: 'var(--wm-shadow-sm)' }}
    >
      <div className="mb-4 flex items-center gap-3">
        <TrendingDown size={18} style={{ color: 'var(--wm-destructive)' }} />
        <h2
          className="text-base font-bold"
          style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
        >
          Conversion &amp; Drop-Off Summary
        </h2>
      </div>
      <div className="space-y-4">
        {groups.map((group) => {
          if (group.steps.length < 2) return null;
          const first = group.steps[0];
          const last = group.steps[group.steps.length - 1];
          const overallConversion = first.count > 0 ? Math.round((last.count / first.count) * 100) : 0;

          // Find the worst drop-off step
          let worstDropIdx = 1;
          let worstDropPct = 100;
          for (let i = 1; i < group.steps.length; i++) {
            if (group.steps[i].pctFromPrev < worstDropPct) {
              worstDropPct = group.steps[i].pctFromPrev;
              worstDropIdx = i;
            }
          }
          const dropOffPct = 100 - worstDropPct;

          return (
            <div
              key={group.name}
              className="rounded-xl border p-4"
              style={{ borderColor: 'var(--wm-border)', background: 'var(--wm-subtle)' }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3
                  className="text-sm font-bold"
                  style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-foreground)' }}
                >
                  {group.label}
                </h3>
                <Badge tone={overallConversion >= 50 ? 'primary' : overallConversion >= 20 ? 'amber' : 'pending'}>
                  {overallConversion}% overall conversion
                </Badge>
              </div>

              {/* Step-by-step drop-offs */}
              <div className="flex flex-wrap items-center gap-1 text-xs" style={{ color: 'var(--wm-muted)' }}>
                {group.steps.map((step, i) => (
                  <span key={step.step_name} className="flex items-center gap-1">
                    <span
                      className="font-medium"
                      style={{ color: i === 0 ? 'var(--wm-foreground)' : undefined }}
                    >
                      {formatStepName(step.step_name)}
                    </span>
                    <span className="tabular-nums" style={{ color: 'var(--wm-navy)' }}>
                      ({step.count.toLocaleString()})
                    </span>
                    {i < group.steps.length - 1 && (
                      <>
                        <ArrowRight size={12} style={{ color: 'var(--wm-muted)', flexShrink: 0 }} />
                        <span
                          className="font-semibold tabular-nums"
                          style={{
                            color: group.steps[i + 1].pctFromPrev < 60
                              ? 'var(--wm-destructive)'
                              : 'var(--wm-muted)',
                          }}
                        >
                          {100 - group.steps[i + 1].pctFromPrev}% drop
                        </span>
                        <ArrowRight size={12} style={{ color: 'var(--wm-muted)', flexShrink: 0 }} />
                      </>
                    )}
                  </span>
                ))}
              </div>

              {/* Worst drop-off callout */}
              <div
                className="mt-3 rounded-lg px-3 py-2 text-xs"
                style={{
                  background: dropOffPct > 50
                    ? 'rgba(var(--wm-destructive-rgb, 220, 38, 38), 0.08)'
                    : 'rgba(var(--wm-amber-rgb, 245, 158, 11), 0.08)',
                  color: dropOffPct > 50 ? 'var(--wm-destructive)' : 'var(--wm-amber-dark, var(--wm-foreground))',
                }}
              >
                Biggest drop-off: <strong>{dropOffPct}%</strong> between{' '}
                <strong>{formatStepName(group.steps[worstDropIdx - 1].step_name)}</strong>
                {' and '}
                <strong>{formatStepName(group.steps[worstDropIdx].step_name)}</strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlatformOverview({ stats, locale }: { stats: PlatformStats; locale: string }) {
  const items = [
    {
      label: 'Customers',
      value: stats.customers,
      icon: <Users size={16} />,
      href: `/${locale}/dashboard/admin`,
      accent: 'navy' as const,
    },
    {
      label: 'Verified Pros',
      value: stats.verified_pros,
      icon: <Users size={16} />,
      href: `/${locale}/dashboard/admin/applications`,
      accent: 'primary' as const,
    },
    {
      label: 'Open Jobs',
      value: stats.open_jobs,
      icon: <Briefcase size={16} />,
      href: `/${locale}/dashboard/admin/jobs`,
      accent: 'blue' as const,
    },
    {
      label: 'Total Quotes',
      value: stats.total_quotes,
      icon: <FileText size={16} />,
      href: `/${locale}/dashboard/admin`,
      accent: 'amber' as const,
    },
    {
      label: 'High Risk Providers',
      value: stats.high_risk_providers,
      icon: <AlertTriangle size={16} />,
      href: `/${locale}/dashboard/admin/risk`,
      accent: 'amber' as const,
    },
    {
      label: 'Pending Applications',
      value: stats.pending_applications,
      icon: <FileText size={16} />,
      href: `/${locale}/dashboard/admin/applications`,
      accent: 'navy' as const,
    },
  ];

  return (
    <div
      className="rounded-2xl border p-6"
      style={{ borderColor: 'var(--wm-border)', background: 'var(--wm-surface)', boxShadow: 'var(--wm-shadow-sm)' }}
    >
      <h2
        className="mb-4 text-base font-bold"
        style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
      >
        Platform Overview
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="group flex flex-col gap-1.5 rounded-xl border p-3 transition-colors hover:border-[var(--wm-primary)] hover:bg-[var(--wm-primary-faint,rgba(22,155,98,0.05))]"
            style={{ borderColor: 'var(--wm-border)', textDecoration: 'none' }}
          >
            <div className="flex items-center gap-1.5" style={{ color: 'var(--wm-muted)' }}>
              {item.icon}
              <span className="text-xs font-semibold">{item.label}</span>
            </div>
            <span
              className="text-2xl font-extrabold tabular-nums"
              style={{ color: 'var(--wm-navy)', fontFamily: 'var(--wm-font-display)' }}
            >
              {item.value.toLocaleString()}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

function DateFilterBar({ locale, currentDays }: { locale: string; currentDays: DaysParam }) {
  const options: { label: string; value: DaysParam }[] = [
    { label: 'Last 7 days', value: '7' },
    { label: 'Last 30 days', value: '30' },
    { label: 'All time', value: 'all' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--wm-muted)' }}>
        Period:
      </span>
      {options.map((opt) => (
        <Button
          key={opt.value}
          href={`/${locale}/dashboard/admin/analytics?days=${opt.value}`}
          variant={currentDays === opt.value ? 'primary' : 'secondary'}
          size="sm"
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const roles = await getUserRoles(supabase, user.id);
  if (!canAccessAdmin(roles)) {
    redirect(`/${locale}/profile`);
  }

  // Validate days param
  const rawDays = sp?.days;
  const days: DaysParam =
    rawDays === '7' || rawDays === '30' ? rawDays : 'all';

  // Platform overview stats (parallel fetch)
  const platformStats: PlatformStats = { customers: 0, verified_pros: 0, open_jobs: 0, total_quotes: 0, high_risk_providers: 0, pending_applications: 0 };
  try {
    const [
      { count: customers },
      { count: verified_pros },
      { count: open_jobs },
      { count: total_quotes },
      { count: high_risk_providers },
      { count: pending_applications },
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'verified_pro'),
      supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('quotes').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gt('risk_score', 74),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending'),
    ]);
    platformStats.customers = customers ?? 0;
    platformStats.verified_pros = verified_pros ?? 0;
    platformStats.open_jobs = open_jobs ?? 0;
    platformStats.total_quotes = total_quotes ?? 0;
    platformStats.high_risk_providers = high_risk_providers ?? 0;
    platformStats.pending_applications = pending_applications ?? 0;
  } catch { /* non-fatal */ }

  // Fetch data from API (server-side, cookies forwarded automatically via supabase client)
  let funnelData: FunnelRow[] = [];
  let totalToday = 0;
  let fetchError = false;

  try {
    // Build date cutoff
    let cutoff: string | null = null;
    if (days === '7') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      cutoff = d.toISOString();
    } else if (days === '30') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      cutoff = d.toISOString();
    }

    let query = supabase
      .from('funnel_events')
      .select('funnel_name, step_name, step_number, created_at');

    if (cutoff) {
      query = query.gte('created_at', cutoff);
    }

    const { data: raw, error } = await query;

    if (error) {
      console.error('[admin/analytics] funnel_events query failed:', error.message);
      fetchError = true;
    } else {
      // Aggregate
      const groupMap = new Map<
        string,
        { funnel_name: string; step_name: string; step_number: number; count: number }
      >();

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      for (const row of raw ?? []) {
        const key = `${row.funnel_name}:${row.step_name}`;
        if (groupMap.has(key)) {
          groupMap.get(key)!.count += 1;
        } else {
          groupMap.set(key, {
            funnel_name: row.funnel_name,
            step_name: row.step_name,
            step_number: row.step_number,
            count: 1,
          });
        }
        if (new Date(row.created_at) >= todayStart) {
          totalToday += 1;
        }
      }

      funnelData = Array.from(groupMap.values());
    }
  } catch (err) {
    console.error('[admin/analytics] unexpected error:', err);
    fetchError = true;
  }

  const groups = groupByFunnel(funnelData);
  const stats = computeSummaryStats(groups, totalToday);

  return (
    <Shell>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        {/* Header */}
        <PageHeader
          title="Analytics"
          description="Platform overview and step-by-step conversion rates across all key funnels."
          action={
            <Button href={`/${locale}/dashboard/admin`} variant="secondary" size="sm">
              Back to Dashboard
            </Button>
          }
        />

        {/* Platform overview */}
        <PlatformOverview stats={platformStats} locale={locale} />

        {/* Summary stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Events Today"
            value={stats.totalToday.toLocaleString()}
            accent="primary"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            }
          />
          <StatCard
            label="Funnels Started"
            value={stats.totalStarted.toLocaleString()}
            accent="blue"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            }
          />
          <StatCard
            label="Funnels Completed"
            value={stats.totalCompleted.toLocaleString()}
            accent="navy"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            }
          />
          <StatCard
            label="Overall Completion"
            value={`${stats.overallRate}%`}
            accent="amber"
            trend={stats.overallRate >= 50 ? 'up' : 'down'}
            trendLabel={stats.overallRate >= 50 ? 'Healthy conversion' : 'Needs attention'}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            }
          />
        </div>

        {/* Date filter + drop-off summary */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <DateFilterBar locale={locale} currentDays={days} />
          {!fetchError && groups.length > 0 && (
            <span className="text-xs" style={{ color: 'var(--wm-muted)' }}>
              Showing {groups.reduce((n, g) => n + g.steps.reduce((s, step) => s + step.count, 0), 0).toLocaleString()} total events
            </span>
          )}
        </div>

        {/* Conversion & Drop-Off Summary */}
        {!fetchError && groups.length > 0 && (
          <FunnelDropOffPanel groups={groups} />
        )}

        {/* Error state */}
        {fetchError && (
          <div
            className="rounded-2xl border p-6"
            style={{ borderColor: 'var(--wm-destructive)', background: 'var(--wm-surface)' }}
          >
            <EmptyState
              title="Could not load funnel data"
              description="There was an error fetching analytics. Please try again or check the server logs."
            />
          </div>
        )}

        {/* No data at all */}
        {!fetchError && groups.length === 0 && (
          <div
            className="rounded-2xl border p-10"
            style={{ borderColor: 'var(--wm-border)', background: 'var(--wm-surface)' }}
          >
            <EmptyState
              title="No funnel events recorded yet"
              description="Events will appear here once users start tracking through job posting, provider onboarding, or booking flows."
              icon={
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              }
            />
          </div>
        )}

        {/* Funnel panels */}
        {!fetchError && groups.map((group) => (
          <FunnelPanel key={group.name} group={group} />
        ))}

        {/* Legend */}
        {!fetchError && groups.length > 0 && (
          <div
            className="rounded-xl border px-4 py-3"
            style={{ borderColor: 'var(--wm-border)', background: 'var(--wm-subtle)' }}
          >
            <p className="text-xs" style={{ color: 'var(--wm-muted)' }}>
              Bar width = % of step 1 count (conversion from funnel entry).
              &ldquo;(prev)&rdquo; shown on wide screens = drop-off from preceding step.
              Data period: {days === 'all' ? 'all time' : `last ${days} days`}.
            </p>
          </div>
        )}
      </div>
    </Shell>
  );
}
