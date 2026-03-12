'use client';

import Link from 'next/link';
import type { ProDashboardData } from './types';

const NAV = [
  { icon: '🏠', label: 'Overview', path: '/dashboard/pro' },
  { icon: '🔔', label: 'Job Alerts', path: '/jobs' },
  { icon: '💰', label: 'Earnings', path: '/dashboard/pro/earnings' },
  { icon: '🏷️', label: 'Credits', path: '/dashboard/pro/credits' },
  { icon: '⭐', label: 'Reviews', path: '/profile' },
  { icon: '📅', label: 'Appointments', path: '/dashboard/appointments' },
  { icon: '📋', label: 'Profile', path: '/profile' },
  { icon: '🎁', label: 'Referrals', path: '/dashboard/referrals' },
  { icon: '⚖️', label: 'Disputes', path: '/dashboard/disputes' },
];

function MetricRow({ label, value, accent, delta }: { label: string; value: string | number; accent?: string; delta?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--wm-border)' }}>
      <span style={{ fontSize: '12px', color: 'var(--wm-muted)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
        <span style={{ fontSize: '14px', fontWeight: 700, color: accent ?? 'var(--wm-foreground)', fontFamily: 'var(--wm-font-display)' }}>{value}</span>
        {delta && <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--wm-primary)', background: 'rgba(var(--wm-primary-rgb), 0.1)', borderRadius: '6px', padding: '1px 6px' }}>{delta}</span>}
      </div>
    </div>
  );
}

function ProgressRing({ pct, color, size = 72 }: { pct: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--wm-border)" strokeWidth="7" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} strokeLinecap="round" />
    </svg>
  );
}

export default function ProDashboard({ data, locale }: { data: ProDashboardData; locale: string }) {
  const completionRate = data.completedJobs + data.activeJobs > 0
    ? Math.round((data.completedJobs / (data.completedJobs + data.activeJobs)) * 100) : 0;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--wm-bg)' }}>
      {/* Sidebar */}
      <aside style={{ width: '200px', flexShrink: 0, background: 'var(--wm-surface)', borderRight: '1.5px solid var(--wm-border)', padding: '20px 0', height: '100vh', position: 'sticky', top: 0, overflowY: 'auto' }}>
        <div style={{ padding: '0 16px 14px', borderBottom: '1px solid var(--wm-border)', marginBottom: '8px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--wm-muted)', margin: '0 0 2px' }}>Provider</p>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--wm-foreground)', margin: '0 0 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {data.fullName ?? 'My Account'}
          </p>
          {data.isFoundingPro && (
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--wm-gold)', textTransform: 'uppercase' }}>👑 Founding Pro</span>
          )}
        </div>
        {NAV.map((item) => {
          const isActive = item.path === '/dashboard/pro';
          return (
            <Link key={item.path} href={`/${locale}${item.path}`} style={{
              display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 16px',
              fontSize: '13px', fontWeight: 500,
              color: isActive ? 'var(--wm-primary)' : 'var(--wm-muted)',
              background: isActive ? 'rgba(var(--wm-primary-rgb), 0.08)' : 'transparent',
              borderLeft: isActive ? '2px solid var(--wm-primary)' : '2px solid transparent',
              textDecoration: 'none', transition: 'all 0.12s',
            }}>
              <span style={{ fontSize: '14px' }}>{item.icon}</span>
              {item.label}
              {item.label === 'Job Alerts' && data.pendingAlerts > 0 && (
                <span style={{ marginLeft: 'auto', background: 'var(--wm-primary)', color: '#fff', borderRadius: '10px', padding: '1px 7px', fontSize: '10px', fontWeight: 700 }}>
                  {data.pendingAlerts}
                </span>
              )}
            </Link>
          );
        })}
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--wm-foreground)', fontFamily: 'var(--wm-font-display)', margin: '0 0 2px' }}>
              {data.fullName ? `${data.fullName.split(' ')[0]}'s Dashboard` : 'Provider Dashboard'}
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--wm-muted)', margin: 0 }}>Your performance and opportunities</p>
          </div>
          {data.pendingAlerts > 0 && (
            <Link href={`/${locale}/jobs`} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--wm-primary)', color: '#fff', borderRadius: '10px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}>
              🔔 {data.pendingAlerts} new job{data.pendingAlerts > 1 ? 's' : ''}
            </Link>
          )}
        </div>

        {/* Profile completion */}
        {(!data.isIdVerified || !data.hasServices) && (
          <div style={{ background: 'rgba(var(--wm-gold-rgb), 0.08)', border: '1px solid rgba(var(--wm-gold-rgb), 0.3)', borderRadius: '12px', padding: '12px 16px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '16px' }}>⚠️</span>
            <span style={{ fontSize: '12px', color: 'var(--wm-gold)', flex: 1 }}>
              {!data.isIdVerified && 'ID verification pending. '}
              {!data.hasServices && 'No services added yet. '}
              Complete your profile to appear in search results.
            </span>
            <Link href={`/${locale}/profile`} style={{ fontSize: '11px', fontWeight: 700, color: 'var(--wm-navy)', background: 'var(--wm-gold)', borderRadius: '8px', padding: '5px 12px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Complete profile
            </Link>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Earnings */}
          <div style={{ background: 'var(--wm-surface)', border: '1.5px solid var(--wm-border)', borderRadius: '16px', padding: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--wm-foreground)', margin: '0 0 4px', fontFamily: 'var(--wm-font-display)' }}>Earnings</p>
            <p style={{ fontSize: '30px', fontWeight: 800, color: 'var(--wm-primary)', fontFamily: 'var(--wm-font-display)', margin: '0 0 14px', lineHeight: 1 }}>
              €{(data.totalEarnings / 100).toLocaleString('en-IE', { minimumFractionDigits: 2 })}
            </p>
            <MetricRow label="Completed jobs" value={data.completedJobs} accent="var(--wm-primary)" />
            <MetricRow label="Active jobs" value={data.activeJobs} accent="var(--wm-navy-mid)" />
            <MetricRow label="Reviews received" value={data.reviewCount} />
            {data.avgRating && (
              <MetricRow label="Average rating" value={`${data.avgRating.toFixed(1)} ★`} accent="var(--wm-gold)" />
            )}
          </div>

          {/* Completion ring */}
          <div style={{ background: 'var(--wm-surface)', border: '1.5px solid var(--wm-border)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--wm-foreground)', margin: 0, fontFamily: 'var(--wm-font-display)' }}>Performance</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ position: 'relative', width: '72px', height: '72px', flexShrink: 0 }}>
                <ProgressRing pct={completionRate} color="var(--wm-primary)" />
                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: 'var(--wm-primary)', fontFamily: 'var(--wm-font-display)' }}>
                  {completionRate}%
                </span>
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--wm-foreground)', margin: '0 0 2px' }}>Completion rate</p>
                <p style={{ fontSize: '11px', color: 'var(--wm-muted)', margin: 0 }}>{data.completedJobs} of {data.completedJobs + data.activeJobs} jobs completed</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { label: 'Job Alerts', href: `/${locale}/jobs`, badge: data.pendingAlerts, icon: '🔔' },
                { label: 'Earnings', href: `/${locale}/dashboard/pro/earnings`, icon: '💰' },
                { label: 'Credits', href: `/${locale}/dashboard/pro/credits`, icon: '🏷️' },
                { label: 'Referrals', href: `/${locale}/dashboard/referrals`, icon: '🎁' },
              ].map((a) => (
                <Link key={a.href} href={a.href} style={{
                  display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 10px',
                  background: 'rgba(var(--wm-primary-rgb), 0.04)', border: '1px solid var(--wm-border)', borderRadius: '10px',
                  textDecoration: 'none', position: 'relative',
                }}>
                  <span style={{ fontSize: '14px' }}>{a.icon}</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--wm-foreground)' }}>{a.label}</span>
                  {'badge' in a && (a.badge ?? 0) > 0 && (
                    <span style={{ position: 'absolute', top: '4px', right: '6px', background: 'var(--wm-primary)', color: '#fff', borderRadius: '8px', padding: '1px 5px', fontSize: '9px', fontWeight: 700 }}>
                      {a.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
