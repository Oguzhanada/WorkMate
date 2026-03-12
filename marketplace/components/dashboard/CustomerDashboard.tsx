'use client';

import Link from 'next/link';
import type { CustomerDashboardData } from './types';

const STATUS_ORDER = ['open', 'quoted', 'accepted', 'in_progress', 'completed'];
// Using CSS var() strings — works in inline style={{ color: STATUS_COLORS[i] }}
const STATUS_COLORS = ['var(--wm-primary)', 'var(--wm-navy-mid)', 'var(--wm-gold)', 'var(--wm-navy-soft)', 'var(--wm-text-soft)'];
// Corresponding rgba backgrounds (alpha suffix can't combine with var(), so rgb values are used)
const STATUS_BG_RGB = ['var(--wm-primary-rgb)', 'var(--wm-navy-mid-rgb)', 'var(--wm-gold-rgb)', 'var(--wm-navy-mid-rgb)', null];

const NAV = [
  { icon: '🏠', label: 'Overview', path: '/dashboard/customer' },
  { icon: '📝', label: 'Post a Job', path: '/post-job' },
  { icon: '💼', label: 'My Jobs', path: '/jobs' },
  { icon: '🗺️', label: 'Find Services', path: '/find-services' },
  { icon: '❤️', label: 'Saved Providers', path: '/saved-providers' },
  { icon: '💬', label: 'Appointments', path: '/dashboard/appointments' },
  { icon: '⚖️', label: 'Disputes', path: '/dashboard/disputes' },
  { icon: '🎁', label: 'Referrals', path: '/dashboard/referrals' },
];

function MetricRow({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--wm-border)' }}>
      <span style={{ fontSize: '12px', color: 'var(--wm-muted)' }}>{label}</span>
      <span style={{ fontSize: '14px', fontWeight: 700, color: accent ?? 'var(--wm-foreground)', fontFamily: 'var(--wm-font-display)' }}>{value}</span>
    </div>
  );
}

export default function CustomerDashboard({ data, locale }: { data: CustomerDashboardData; locale: string }) {
  const jobsByStatus = STATUS_ORDER.reduce<Record<string, number>>((acc, s) => {
    acc[s] = data.recentJobs.filter((j) => j.status === s).length;
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--wm-bg)' }}>
      {/* Sidebar */}
      <aside style={{ width: '200px', flexShrink: 0, background: 'var(--wm-surface)', borderRight: '1.5px solid var(--wm-border)', padding: '20px 0', height: '100vh', position: 'sticky', top: 0, overflowY: 'auto' }}>
        <div style={{ padding: '0 16px 14px', borderBottom: '1px solid var(--wm-border)', marginBottom: '8px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--wm-muted)', margin: '0 0 2px' }}>Customer</p>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--wm-foreground)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {data.fullName ?? 'My Account'}
          </p>
        </div>
        {NAV.map((item) => {
          const isActive = item.path === '/dashboard/customer';
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
            </Link>
          );
        })}

        {/* CTA */}
        <div style={{ padding: '16px', marginTop: '8px', borderTop: '1px solid var(--wm-border)' }}>
          <Link href={`/${locale}/post-job`} style={{
            display: 'block', textAlign: 'center', padding: '9px 0',
            background: 'var(--wm-primary)', color: '#fff', borderRadius: '10px',
            fontSize: '12px', fontWeight: 700, textDecoration: 'none',
          }}>
            + Post a Job
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--wm-foreground)', fontFamily: 'var(--wm-font-display)', margin: '0 0 2px' }}>
              Welcome back{data.fullName ? `, ${data.fullName.split(' ')[0]}` : ''}!
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--wm-muted)', margin: 0 }}>Here&apos;s your job activity at a glance</p>
          </div>
          <Link href={`/${locale}/find-services`} style={{ fontSize: '12px', fontWeight: 600, color: 'var(--wm-primary)', textDecoration: 'none', padding: '7px 14px', background: 'rgba(var(--wm-primary-rgb), 0.08)', border: '1px solid rgba(var(--wm-primary-rgb), 0.2)', borderRadius: '10px' }}>
            Find Services →
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Summary card */}
          <div style={{ background: 'var(--wm-surface)', border: '1.5px solid var(--wm-border)', borderRadius: '16px', padding: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--wm-foreground)', margin: '0 0 4px', fontFamily: 'var(--wm-font-display)' }}>My Jobs</p>
            <p style={{ fontSize: '34px', fontWeight: 800, color: 'var(--wm-primary)', fontFamily: 'var(--wm-font-display)', margin: '0 0 14px', lineHeight: 1 }}>
              {data.openJobs + data.completedJobs}
            </p>
            <MetricRow label="Open" value={data.openJobs} accent="var(--wm-primary)" />
            <MetricRow label="Active quotes" value={data.activeQuotes} accent="var(--wm-navy-mid)" />
            <MetricRow label="Completed" value={data.completedJobs} />
            <MetricRow label="Saved providers" value={data.savedProviders} accent="var(--wm-gold)" />
          </div>

          {/* Pipeline */}
          <div style={{ background: 'var(--wm-surface)', border: '1.5px solid var(--wm-border)', borderRadius: '16px', padding: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--wm-foreground)', margin: '0 0 16px', fontFamily: 'var(--wm-font-display)' }}>Job Pipeline</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '8px' }}>
              {STATUS_ORDER.map((s, i) => (
                <div key={s} style={{ textAlign: 'center' }}>
                  <div style={{ background: STATUS_BG_RGB[i] ? `rgba(${STATUS_BG_RGB[i]}, 0.09)` : 'var(--wm-border)', border: `1.5px solid rgba(${STATUS_BG_RGB[i] ?? '100,116,139'}, 0.2)`, borderRadius: '10px', padding: '10px 4px', marginBottom: '5px' }}>
                    <p style={{ fontSize: '20px', fontWeight: 800, color: STATUS_COLORS[i], fontFamily: 'var(--wm-font-display)', margin: 0, lineHeight: 1 }}>{jobsByStatus[s] ?? 0}</p>
                  </div>
                  <p style={{ fontSize: '9px', fontWeight: 600, color: 'var(--wm-muted)', textTransform: 'capitalize', margin: 0 }}>{s.replace('_', ' ')}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent jobs */}
          <div style={{ gridColumn: '1 / -1', background: 'var(--wm-surface)', border: '1.5px solid var(--wm-border)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--wm-foreground)', margin: 0, fontFamily: 'var(--wm-font-display)' }}>Recent Jobs</p>
              <Link href={`/${locale}/jobs`} style={{ fontSize: '11px', fontWeight: 600, color: 'var(--wm-primary)', textDecoration: 'none' }}>All jobs →</Link>
            </div>
            {data.recentJobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px' }}>
                <p style={{ fontSize: '13px', color: 'var(--wm-muted)', margin: '0 0 12px' }}>No jobs yet</p>
                <Link href={`/${locale}/post-job`} style={{ display: 'inline-block', padding: '8px 18px', background: 'var(--wm-primary)', color: '#fff', borderRadius: '10px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>Post your first job</Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {data.recentJobs.map((job) => {
                  const si = STATUS_ORDER.indexOf(job.status);
                  const c = STATUS_COLORS[si >= 0 ? si : 0];
                  return (
                    <Link key={job.id} href={`/${locale}/jobs/${job.id}`} style={{
                      display: 'block', padding: '12px', background: 'rgba(var(--wm-primary-rgb), 0.03)',
                      border: '1px solid var(--wm-border)', borderRadius: '10px', textDecoration: 'none',
                      transition: 'border-color 0.12s',
                    }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--wm-foreground)', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '10px', color: 'var(--wm-muted)' }}>{new Date(job.created_at).toLocaleDateString('en-IE')}</span>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: c, background: `rgba(${STATUS_BG_RGB[si >= 0 ? si : 0] ?? '100,116,139'}, 0.1)`, borderRadius: '6px', padding: '2px 7px', textTransform: 'capitalize' }}>{job.status.replace('_', ' ')}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
