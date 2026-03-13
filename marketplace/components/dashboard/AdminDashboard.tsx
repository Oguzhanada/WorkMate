'use client';

import Link from 'next/link';
import {
  AreaChart, Area,
  BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Users, UserCheck, Briefcase, CreditCard,
  TrendingUp, AlertTriangle, ArrowUpRight, ArrowRight,
} from 'lucide-react';
import type { AdminDashboardData } from './types';
import AdminCalendar from '@/components/admin/AdminCalendar';
import AdminAnalyticsCharts from '@/components/admin/AdminAnalyticsCharts';

// ─── Design tokens (admin content area — light) ───────────────────────────────
const T = {
  cardBg: '#ffffff',
  cardBorder: '#e2e8f0',
  cardRadius: '14px',
  cardShadow: '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
  contentBg: '#f1f5f9',
  text: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  emerald: '#169B62',
  emeraldBg: 'rgba(22,155,98,0.10)',
  navy: '#1B2A4A',
  navyBg: 'rgba(27,42,74,0.10)',
  violet: '#7c3aed',
  violetBg: 'rgba(124,58,237,0.10)',
  amber: '#d97706',
  amberBg: 'rgba(217,119,6,0.10)',
  rose: '#e11d48',
  roseBg: 'rgba(225,29,72,0.10)',
  sky: '#0284c7',
  skyBg: 'rgba(2,132,199,0.10)',
} as const;

// ─── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
  sub,
  urgent,
  href,
  locale,
}: {
  icon: React.ComponentType<{ size: number; style?: React.CSSProperties }>;
  iconColor: string;
  iconBg: string;
  label: string;
  value: number;
  sub?: string;
  urgent?: boolean;
  href?: string;
  locale: string;
}) {
  const card = (
    <div
      style={{
        background: T.cardBg,
        border: `1.5px solid ${urgent && value > 0 ? T.amber : T.cardBorder}`,
        borderRadius: T.cardRadius,
        boxShadow: T.cardShadow,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        cursor: href ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={18} style={{ color: iconColor }} />
        </div>
        {href && (
          <ArrowUpRight size={14} style={{ color: T.muted, marginTop: '2px' }} />
        )}
      </div>
      <div>
        <p
          style={{
            margin: '0 0 2px',
            fontSize: '28px',
            fontWeight: 800,
            color: T.text,
            lineHeight: 1,
            fontFamily: 'var(--wm-font-display)',
          }}
        >
          {value.toLocaleString()}
        </p>
        <p style={{ margin: 0, fontSize: '12px', fontWeight: 500, color: T.muted }}>
          {label}
        </p>
      </div>
      {sub && (
        <p
          style={{
            margin: 0,
            fontSize: '11px',
            color: urgent && value > 0 ? T.amber : T.muted,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={`/${locale}${href}`} style={{ textDecoration: 'none' }}>
        {card}
      </Link>
    );
  }
  return card;
}

// ─── Section header ────────────────────────────────────────────────────────────
function SectionHeader({
  title,
  linkLabel,
  linkHref,
  locale,
}: {
  title: string;
  linkLabel?: string;
  linkHref?: string;
  locale: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px',
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: '13px',
          fontWeight: 700,
          color: T.text,
          fontFamily: 'var(--wm-font-display)',
        }}
      >
        {title}
      </h2>
      {linkLabel && linkHref && (
        <Link
          href={`/${locale}${linkHref}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '11px',
            fontWeight: 600,
            color: T.emerald,
            textDecoration: 'none',
          }}
        >
          {linkLabel} <ArrowRight size={11} />
        </Link>
      )}
    </div>
  );
}

// ─── Action badge ──────────────────────────────────────────────────────────────
function ActionBadge({ action }: { action: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    approve: { bg: T.emeraldBg, color: T.emerald },
    reject:  { bg: T.roseBg,   color: T.rose },
    suspend: { bg: T.amberBg,  color: T.amber },
    flag:    { bg: T.amberBg,  color: T.amber },
  };
  const match = Object.keys(map).find((k) => action.startsWith(k));
  const style = match ? map[match] : { bg: T.navyBg, color: T.navy };
  return (
    <span
      style={{
        fontSize: '10px',
        fontWeight: 600,
        color: style.color,
        background: style.bg,
        borderRadius: '6px',
        padding: '2px 7px',
        textTransform: 'capitalize',
        whiteSpace: 'nowrap',
      }}
    >
      {action.replace(/_/g, ' ')}
    </span>
  );
}

// ─── Custom chart tooltip ──────────────────────────────────────────────────────
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: T.cardBg,
        border: `1px solid ${T.border}`,
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '12px',
        boxShadow: T.cardShadow,
      }}
    >
      <p style={{ margin: 0, color: T.muted }}>{label}</p>
      <p style={{ margin: '2px 0 0', fontWeight: 700, color: T.text }}>
        {payload[0].value}
      </p>
    </div>
  );
}

// ─── Progress bar ──────────────────────────────────────────────────────────────
function LinearProgress({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 500, color: T.text }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color,
            }}
          >
            {pct}%
          </span>
          <span style={{ fontSize: '10px', color: T.muted }}>
            {value.toLocaleString()} / {max.toLocaleString()}
          </span>
        </div>
      </div>
      <div
        style={{
          height: '7px',
          background: T.border,
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
            borderRadius: '4px',
            transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function AdminDashboard({
  data,
  locale,
}: {
  data: AdminDashboardData;
  locale: string;
}) {
  const totalJobs  = data.openJobs + data.activeJobs + data.completedJobs;
  const totalUsers = data.pros + data.customers;
  const enabledFlags = data.featureFlags.filter((f) => f.enabled).length;

  const jobChartData = [
    { label: 'Open',      value: data.openJobs,      fill: T.emerald },
    { label: 'Active',    value: data.activeJobs,    fill: T.sky },
    { label: 'Completed', value: data.completedJobs, fill: T.navy },
    { label: 'Reviews',   value: data.totalReviews,  fill: T.violet },
  ];

  // Verification completion rate
  const verifiedTotal = data.pros;
  const pendingTotal  = data.pendingVerification + data.pendingDocs;
  const jobCompletionPct = totalJobs > 0
    ? Math.round((data.completedJobs / totalJobs) * 100)
    : 0;

  return (
    <div style={{ padding: '24px', background: T.contentBg, minHeight: '100%' }}>

      {/* Sub-header: date + urgent alert */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <p style={{ margin: 0, fontSize: '12px', color: T.muted }}>{data.dateLabel}</p>
        {data.pendingVerification > 0 && (
          <Link
            href={`/${locale}/dashboard/admin/applications`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              background: '#fef3c7',
              color: T.amber,
              border: '1px solid #fde68a',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <AlertTriangle size={13} />
            {data.pendingVerification} pending application
            {data.pendingVerification > 1 ? 's' : ''}
          </Link>
        )}
      </div>

      {/* ── Row 1: KPI cards ───────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        <KpiCard
          icon={Users}
          iconColor={T.emerald}
          iconBg={T.emeraldBg}
          label="Total Users"
          value={totalUsers}
          sub={`${data.pros} providers · ${data.customers} customers`}
          locale={locale}
        />
        <KpiCard
          icon={TrendingUp}
          iconColor={T.violet}
          iconBg={T.violetBg}
          label="New This Week"
          value={data.newUsers7d}
          sub="Registered in last 7 days"
          locale={locale}
        />
        <KpiCard
          icon={Briefcase}
          iconColor={T.sky}
          iconBg={T.skyBg}
          label="Total Jobs"
          value={totalJobs}
          sub={`${data.openJobs} open · ${data.activeJobs} active`}
          locale={locale}
        />
        <KpiCard
          icon={CreditCard}
          iconColor={T.amber}
          iconBg={T.amberBg}
          label="Active Subscriptions"
          value={data.activeSubs}
          sub="Provider paid plans"
          locale={locale}
        />
      </div>

      {/* ── Row 2: Secondary KPIs ──────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        <KpiCard
          icon={UserCheck}
          iconColor={T.amber}
          iconBg={T.amberBg}
          label="Pending Verification"
          value={data.pendingVerification}
          sub="ID applications to review"
          urgent
          href="/dashboard/admin/applications"
          locale={locale}
        />
        <KpiCard
          icon={UserCheck}
          iconColor={T.sky}
          iconBg={T.skyBg}
          label="Pending Documents"
          value={data.pendingDocs}
          sub="Documents awaiting review"
          href="/dashboard/admin/verification"
          locale={locale}
        />
        <KpiCard
          icon={AlertTriangle}
          iconColor={T.rose}
          iconBg={T.roseBg}
          label="Rejected IDs"
          value={data.rejectedVerification}
          sub="Failed identity checks"
          locale={locale}
        />
        <KpiCard
          icon={Users}
          iconColor={T.navy}
          iconBg={T.navyBg}
          label="Total Reviews"
          value={data.totalReviews}
          sub="Platform-wide reviews"
          locale={locale}
        />
      </div>

      {/* ── Row 3: Charts ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        {/* User registrations — area chart */}
        <div
          style={{
            background: T.cardBg,
            border: `1.5px solid ${T.cardBorder}`,
            borderRadius: T.cardRadius,
            boxShadow: T.cardShadow,
            padding: '20px',
          }}
        >
          <SectionHeader title="User Registrations — Last 7 Days" locale={locale} />
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart
              data={data.weeklyRegistrations}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={T.emerald} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={T.emerald} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: T.muted }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: T.muted }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke={T.emerald}
                strokeWidth={2}
                fill="url(#regGrad)"
                dot={{ fill: T.emerald, r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Jobs by status — bar chart */}
        <div
          style={{
            background: T.cardBg,
            border: `1.5px solid ${T.cardBorder}`,
            borderRadius: T.cardRadius,
            boxShadow: T.cardShadow,
            padding: '20px',
          }}
        >
          <SectionHeader title="Jobs by Status" locale={locale} />
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={jobChartData}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: T.muted }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: T.muted }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {jobChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row 4: Activity + Flags + Quick Actions ────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        {/* Recent audit activity */}
        <div
          style={{
            background: T.cardBg,
            border: `1.5px solid ${T.cardBorder}`,
            borderRadius: T.cardRadius,
            boxShadow: T.cardShadow,
            padding: '20px',
          }}
        >
          <SectionHeader
            title="Recent Activity"
            linkLabel={`All ${data.auditTotal} logs`}
            linkHref="/dashboard/admin/audit-logs"
            locale={locale}
          />
          {data.recentAuditLogs.length === 0 ? (
            <p style={{ fontSize: '12px', color: T.muted, margin: 0 }}>No activity yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {data.recentAuditLogs.map((log, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 0',
                    borderBottom:
                      i < data.recentAuditLogs.length - 1
                        ? `1px solid ${T.border}`
                        : 'none',
                  }}
                >
                  <ActionBadge action={log.action} />
                  <span
                    style={{
                      fontSize: '11px',
                      color: T.muted,
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {log.target_type.replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontSize: '10px', color: T.muted, flexShrink: 0 }}>
                    {new Date(log.created_at).toLocaleDateString('en-IE', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Feature flags */}
        <div
          style={{
            background: T.cardBg,
            border: `1.5px solid ${T.cardBorder}`,
            borderRadius: T.cardRadius,
            boxShadow: T.cardShadow,
            padding: '20px',
          }}
        >
          <SectionHeader title="Feature Flags" locale={locale} />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '12px',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: T.emerald,
                background: T.emeraldBg,
                borderRadius: '6px',
                padding: '2px 8px',
              }}
            >
              {enabledFlags} on
            </span>
            <span style={{ fontSize: '11px', color: T.muted }}>
              / {data.featureFlags.length} total
            </span>
          </div>
          {data.featureFlags.length === 0 ? (
            <p style={{ fontSize: '12px', color: T.muted, margin: 0 }}>
              No flags configured
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {data.featureFlags.slice(0, 6).map((flag, i) => (
                <div
                  key={flag.flag_key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 0',
                    borderBottom:
                      i < Math.min(data.featureFlags.length, 6) - 1
                        ? `1px solid ${T.border}`
                        : 'none',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      color: T.text,
                      fontFamily: 'var(--wm-font-mono)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      marginRight: '8px',
                    }}
                  >
                    {flag.flag_key}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      borderRadius: '5px',
                      padding: '2px 7px',
                      flexShrink: 0,
                      color: flag.enabled ? T.emerald : T.muted,
                      background: flag.enabled ? T.emeraldBg : T.border,
                    }}
                  >
                    {flag.enabled ? 'ON' : 'OFF'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div
          style={{
            background: T.cardBg,
            border: `1.5px solid ${T.cardBorder}`,
            borderRadius: T.cardRadius,
            boxShadow: T.cardShadow,
            padding: '20px',
          }}
        >
          <SectionHeader title="Quick Actions" locale={locale} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { label: 'Review Applications', href: '/dashboard/admin/applications', count: data.pendingVerification, urgent: true },
              { label: 'Verification Queue',  href: '/dashboard/admin/verification', count: data.pendingDocs,         urgent: false },
              { label: 'Risk Assessment',     href: '/dashboard/admin/risk',         count: 0,                        urgent: false },
              { label: 'Analytics',           href: '/dashboard/admin/analytics',    count: 0,                        urgent: false },
              { label: 'GDPR / Requests',     href: '/dashboard/admin/gdpr',         count: 0,                        urgent: false },
              { label: 'System Status',       href: '/dashboard/admin/status',       count: 0,                        urgent: false },
            ].map((a) => (
              <Link
                key={a.href}
                href={`/${locale}${a.href}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: a.urgent && a.count > 0 ? '#fef3c7' : '#f8fafc',
                  border: `1px solid ${a.urgent && a.count > 0 ? '#fde68a' : T.border}`,
                  textDecoration: 'none',
                  transition: 'background 0.12s',
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: a.urgent && a.count > 0 ? T.amber : T.text,
                  }}
                >
                  {a.label}
                </span>
                {a.count > 0 ? (
                  <span
                    style={{
                      background: a.urgent ? T.amber : T.emerald,
                      color: '#fff',
                      borderRadius: '10px',
                      padding: '1px 8px',
                      fontSize: '10px',
                      fontWeight: 700,
                    }}
                  >
                    {a.count}
                  </span>
                ) : (
                  <ArrowRight size={12} style={{ color: T.muted }} />
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 5: Progress Indicators ────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        {/* Platform health progress bars */}
        <div
          style={{
            background: T.cardBg,
            border: `1.5px solid ${T.cardBorder}`,
            borderRadius: T.cardRadius,
            boxShadow: T.cardShadow,
            padding: '20px',
          }}
        >
          <SectionHeader title="Platform Health" locale={locale} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <LinearProgress
              label="Job completion rate"
              value={data.completedJobs}
              max={Math.max(totalJobs, 1)}
              color={T.emerald}
            />
            <LinearProgress
              label="Verified providers"
              value={verifiedTotal}
              max={Math.max(verifiedTotal + pendingTotal, 1)}
              color={T.sky}
            />
            <LinearProgress
              label="Active subscriptions vs pros"
              value={data.activeSubs}
              max={Math.max(data.pros, 1)}
              color={T.violet}
            />
            <LinearProgress
              label="Pending review backlog"
              value={pendingTotal}
              max={Math.max(pendingTotal + verifiedTotal, 1)}
              color={pendingTotal > 10 ? T.amber : T.emerald}
            />
          </div>
        </div>

        {/* Calendar */}
        <AdminCalendar />
      </div>

      {/* ── Row 6: Expanded Charts (Analytics snapshot) ───────────────────── */}
      <AdminAnalyticsCharts
        weeklyRegistrations={data.weeklyRegistrations}
        openJobs={data.openJobs}
        activeJobs={data.activeJobs}
        completedJobs={data.completedJobs}
        totalReviews={data.totalReviews}
        totalQuotes={0}
        customers={data.customers}
        verifiedPros={data.pros}
        highRiskProviders={0}
      />
    </div>
  );
}
