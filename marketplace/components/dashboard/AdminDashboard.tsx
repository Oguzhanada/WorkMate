'use client';

import Link from 'next/link';
import type { AdminDashboardData } from './types';

function MetricRow({ label, value, delta, color }: { label: string; value: string | number; delta?: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--wm-border)' }}>
      <span style={{ fontSize: '12px', color: 'var(--wm-muted)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
        <span style={{ fontSize: '14px', fontWeight: 700, color: color ?? 'var(--wm-foreground)', fontFamily: 'var(--wm-font-display)' }}>{value}</span>
        {delta && <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--wm-primary)', background: 'rgba(var(--wm-primary-rgb), 0.1)', borderRadius: '6px', padding: '1px 6px' }}>{delta}</span>}
      </div>
    </div>
  );
}

function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '80px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--wm-foreground)' }}>{d.value}</span>
          <div style={{ width: '100%', background: d.color, borderRadius: '4px 4px 0 0', height: `${(d.value / max) * 60}px`, minHeight: '4px' }} />
          <span style={{ fontSize: '9px', color: 'var(--wm-muted)', textAlign: 'center' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function ActionLabel({ action }: { action: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    approve: { bg: 'rgba(var(--wm-primary-rgb), 0.12)', text: 'var(--wm-primary)' },
    approve_job: { bg: 'rgba(var(--wm-primary-rgb), 0.12)', text: 'var(--wm-primary)' },
    reject: { bg: 'rgba(var(--wm-destructive-rgb), 0.1)', text: 'var(--wm-destructive-dark)' },
    suspend: { bg: 'rgba(var(--wm-gold-rgb), 0.15)', text: 'var(--wm-gold-dark)' },
    flag: { bg: 'rgba(var(--wm-gold-rgb), 0.15)', text: 'var(--wm-gold-dark)' },
  };
  const match = Object.keys(colors).find((k) => action.startsWith(k));
  const style = match ? colors[match] : { bg: 'rgba(var(--wm-navy-mid-rgb), 0.1)', text: 'var(--wm-navy-mid)' };
  return (
    <span style={{ fontSize: '10px', fontWeight: 600, color: style.text, background: style.bg, borderRadius: '6px', padding: '2px 7px', textTransform: 'capitalize' }}>
      {action.replace(/_/g, ' ')}
    </span>
  );
}

export default function AdminDashboard({ data, locale }: { data: AdminDashboardData; locale: string }) {
  const totalJobs = data.openJobs + data.activeJobs + data.completedJobs;
  const enabledFlags = data.featureFlags.filter((f) => f.enabled).length;

  return (
    <div style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--wm-foreground)', fontFamily: 'var(--wm-font-display)', margin: '0 0 2px' }}>Dashboard Overview</h1>
            <p style={{ fontSize: '12px', color: 'var(--wm-muted)', margin: 0 }}>{data.dateLabel}</p>
          </div>
          {data.pendingVerification > 0 && (
            <Link href={`/${locale}/dashboard/admin/applications`} style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
              background: 'var(--wm-gold)', color: 'var(--wm-navy)', borderRadius: '10px', fontSize: '12px', fontWeight: 700, textDecoration: 'none',
            }}>
              ⚠️ {data.pendingVerification} pending
            </Link>
          )}
        </div>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'Providers', value: data.pros, color: 'var(--wm-primary)' },
            { label: 'Customers', value: data.customers, color: 'var(--wm-navy)' },
            { label: 'New (7d)', value: data.newUsers7d, color: 'var(--wm-primary)' },
            { label: 'Total Jobs', value: totalJobs, color: 'var(--wm-navy-mid)' },
            { label: 'Active Subs', value: data.activeSubs, color: 'var(--wm-gold)' },
            { label: 'Reviews', value: data.totalReviews, color: 'var(--wm-text-soft)' },
          ].map((kpi) => (
            <div key={kpi.label} style={{
              background: 'var(--wm-surface)', border: '1.5px solid var(--wm-border)',
              borderRadius: '12px', padding: '12px', textAlign: 'center',
            }}>
              <p style={{ fontSize: '22px', fontWeight: 800, color: kpi.color, fontFamily: 'var(--wm-font-display)', margin: '0 0 3px', lineHeight: 1 }}>{kpi.value}</p>
              <p style={{ fontSize: '10px', color: 'var(--wm-muted)', margin: 0 }}>{kpi.label}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Users card */}
          <div style={{ background: 'var(--wm-surface)', border: '1.5px solid var(--wm-border)', borderRadius: '16px', padding: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--wm-foreground)', margin: '0 0 4px', fontFamily: 'var(--wm-font-display)' }}>Users</p>
            <p style={{ fontSize: '30px', fontWeight: 800, color: 'var(--wm-primary)', margin: '0 0 12px', lineHeight: 1, fontFamily: 'var(--wm-font-display)' }}>{data.pros + data.customers}</p>
            <MetricRow label="Providers" value={data.pros} delta={`${data.activeSubs} subs`} color="var(--wm-primary)" />
            <MetricRow label="Customers" value={data.customers} />
            <MetricRow label="New (7 days)" value={data.newUsers7d} color="var(--wm-primary)" />
            <MetricRow label="Pending Verification" value={data.pendingVerification} color="var(--wm-gold)" />
            <MetricRow label="Rejected Verification" value={data.rejectedVerification} color="var(--wm-destructive-dark)" />
          </div>

          {/* Jobs card */}
          <div style={{ background: 'var(--wm-surface)', border: '1.5px solid var(--wm-border)', borderRadius: '16px', padding: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--wm-foreground)', margin: '0 0 4px', fontFamily: 'var(--wm-font-display)' }}>Jobs</p>
            <p style={{ fontSize: '30px', fontWeight: 800, color: 'var(--wm-navy)', margin: '0 0 12px', lineHeight: 1, fontFamily: 'var(--wm-font-display)' }}>{totalJobs}</p>
            <MetricRow label="Open" value={data.openJobs} color="var(--wm-primary)" />
            <MetricRow label="In Progress" value={data.activeJobs} color="var(--wm-navy-mid)" />
            <MetricRow label="Completed" value={data.completedJobs} delta={`${data.totalReviews} reviews`} />
            <div style={{ marginTop: '16px' }}>
              <BarChart data={[
                { label: 'Open', value: data.openJobs, color: 'var(--wm-primary)' },
                { label: 'Active', value: data.activeJobs, color: 'var(--wm-navy-mid)' },
                { label: 'Done', value: data.completedJobs, color: 'var(--wm-text-soft)' },
                { label: 'Reviews', value: data.totalReviews, color: 'var(--wm-gold)' },
              ]} />
            </div>
          </div>

          {/* Audit log feed */}
          <div style={{ background: 'var(--wm-surface)', border: '1.5px solid var(--wm-border)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--wm-foreground)', margin: 0, fontFamily: 'var(--wm-font-display)' }}>Recent Activity</p>
              <Link href={`/${locale}/dashboard/admin/audit-logs`} style={{ fontSize: '11px', fontWeight: 600, color: 'var(--wm-primary)', textDecoration: 'none' }}>
                All {data.auditTotal} logs →
              </Link>
            </div>
            {data.recentAuditLogs.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--wm-muted)', margin: 0 }}>No activity yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {data.recentAuditLogs.map((log, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', borderBottom: i < data.recentAuditLogs.length - 1 ? '1px solid var(--wm-border)' : 'none' }}>
                    <ActionLabel action={log.action} />
                    <span style={{ fontSize: '11px', color: 'var(--wm-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.target_type.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--wm-muted)', flexShrink: 0 }}>
                      {new Date(log.created_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Feature flags */}
          <div style={{ background: 'var(--wm-surface)', border: '1.5px solid var(--wm-border)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--wm-foreground)', margin: 0, fontFamily: 'var(--wm-font-display)' }}>Feature Flags</p>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--wm-primary)', background: 'rgba(var(--wm-primary-rgb), 0.1)', borderRadius: '6px', padding: '2px 8px' }}>
                {enabledFlags}/{data.featureFlags.length} on
              </span>
            </div>
            {data.featureFlags.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--wm-muted)', margin: 0 }}>No flags configured</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {data.featureFlags.map((flag, i) => (
                  <div key={flag.flag_key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < data.featureFlags.length - 1 ? '1px solid var(--wm-border)' : 'none' }}>
                    <span style={{ fontSize: '12px', color: 'var(--wm-foreground)', fontFamily: 'var(--wm-font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {flag.flag_key}
                    </span>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, borderRadius: '6px', padding: '2px 8px', flexShrink: 0,
                      color: flag.enabled ? 'var(--wm-primary)' : 'var(--wm-muted)',
                      background: flag.enabled ? 'rgba(var(--wm-primary-rgb), 0.1)' : 'var(--wm-border)',
                    }}>
                      {flag.enabled ? 'ON' : 'OFF'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div style={{ background: 'var(--wm-surface)', border: '1.5px solid var(--wm-border)', borderRadius: '16px', padding: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--wm-foreground)', margin: '0 0 14px', fontFamily: 'var(--wm-font-display)' }}>Quick Actions</p>
            {[
              { label: 'Review Applications', href: `/${locale}/dashboard/admin/applications`, count: data.pendingVerification, urgent: true },
              { label: 'Verification Queue', href: `/${locale}/dashboard/admin/verification`, count: data.pendingDocs, urgent: false },
              { label: 'Risk Assessment', href: `/${locale}/dashboard/admin/risk`, count: 0, urgent: false },
              { label: 'Audit Logs', href: `/${locale}/dashboard/admin/audit-logs`, count: 0, urgent: false },
              { label: 'Platform Stats', href: `/${locale}/dashboard/admin/stats`, count: 0, urgent: false },
            ].map((a) => (
              <Link key={a.href} href={a.href} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 0', borderBottom: '1px solid var(--wm-border)', textDecoration: 'none',
              }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: a.urgent && a.count > 0 ? 'var(--wm-gold)' : 'var(--wm-foreground)' }}>{a.label}</span>
                {a.count > 0
                  ? <span style={{ background: a.urgent ? 'var(--wm-gold)' : 'var(--wm-primary)', color: a.urgent ? 'var(--wm-navy)' : '#fff', borderRadius: '10px', padding: '1px 8px', fontSize: '11px', fontWeight: 700 }}>{a.count}</span>
                  : <span style={{ color: 'var(--wm-muted)', fontSize: '12px' }}>→</span>
                }
              </Link>
            ))}
          </div>

          {/* Platform health */}
          <div style={{ background: 'var(--wm-surface)', border: '1.5px solid var(--wm-border)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--wm-foreground)', margin: 0, fontFamily: 'var(--wm-font-display)' }}>Platform Health</p>
              <Link href={`/${locale}/dashboard/admin/status`} style={{ fontSize: '11px', fontWeight: 600, color: 'var(--wm-primary)', textDecoration: 'none' }}>Status →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { label: 'Active Subs', value: data.activeSubs, color: 'var(--wm-primary)' },
                { label: 'Pending Docs', value: data.pendingDocs, color: 'var(--wm-gold)' },
                { label: 'Rejected IDs', value: data.rejectedVerification, color: 'var(--wm-destructive-dark)' },
                { label: 'Total Reviews', value: data.totalReviews, color: 'var(--wm-navy)' },
              ].map((stat) => (
                <div key={stat.label} style={{ textAlign: 'center', padding: '12px 8px', background: 'rgba(var(--wm-primary-rgb), 0.03)', border: '1px solid var(--wm-border)', borderRadius: '10px' }}>
                  <p style={{ fontSize: '22px', fontWeight: 800, color: stat.color, fontFamily: 'var(--wm-font-display)', margin: '0 0 3px', lineHeight: 1 }}>{stat.value}</p>
                  <p style={{ fontSize: '10px', color: 'var(--wm-muted)', margin: 0 }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
    </div>
  );
}
