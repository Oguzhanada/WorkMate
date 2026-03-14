'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  ShieldAlert,
  BarChart3,
  BadgeCheck,
  Lock,
  ScrollText,
  Activity,
  HeartPulse,
  Bell,
  ChevronRight,
} from 'lucide-react';

// ─── Colours (admin-only dark palette via --wm-admin-* tokens) ──────────────
const C = {
  sidebarBg: 'var(--wm-admin-bg)',
  sidebarBorder: 'var(--wm-admin-surface)',
  sidebarText: 'var(--wm-admin-text)',
  sidebarTextHover: 'var(--wm-admin-text-hover)',
  sidebarActive: 'var(--wm-admin-accent)',
  sidebarActiveBg: 'rgba(52,211,153,0.12)',
  topBarBg: 'var(--wm-white)',
  topBarBorder: 'var(--wm-neutral-200)',
  contentBg: 'var(--wm-neutral-100)',
  badgeBg: 'var(--wm-status-warning)',
  badgeText: 'var(--wm-neutral-800)',
  logoAccent: 'var(--wm-admin-accent)',
  logoText: 'var(--wm-neutral-100)',
  sectionLabel: 'var(--wm-neutral-600)',
} as const;

const NAV_ITEMS = [
  { Icon: LayoutDashboard, label: 'Overview',     path: '/dashboard/admin' },
  { Icon: Briefcase,       label: 'Jobs',         path: '/dashboard/admin/jobs' },
  { Icon: Users,           label: 'Applications', path: '/dashboard/admin/applications', badge: 'verification' },
  { Icon: ShieldAlert,     label: 'Risk',         path: '/dashboard/admin/risk' },
  { Icon: BarChart3,       label: 'Analytics',    path: '/dashboard/admin/analytics' },
  { Icon: BadgeCheck,      label: 'Verification', path: '/dashboard/admin/verification', badge: 'docs' },
  { Icon: Lock,            label: 'GDPR',         path: '/dashboard/admin/gdpr' },
  { Icon: ScrollText,      label: 'Audit Logs',   path: '/dashboard/admin/audit-logs' },
  { Icon: Activity,        label: 'Stats',        path: '/dashboard/admin/stats' },
  { Icon: HeartPulse,      label: 'Status',       path: '/dashboard/admin/status' },
];

const PAGE_TITLES: Record<string, string> = {
  '/dashboard/admin':              'Dashboard Overview',
  '/dashboard/admin/jobs':         'Jobs',
  '/dashboard/admin/applications': 'Provider Applications',
  '/dashboard/admin/risk':         'Risk Assessment',
  '/dashboard/admin/analytics':    'Analytics',
  '/dashboard/admin/verification': 'Verification Queue',
  '/dashboard/admin/gdpr':         'GDPR',
  '/dashboard/admin/audit-logs':   'Audit Logs',
  '/dashboard/admin/stats':        'Platform Stats',
  '/dashboard/admin/status':       'System Status',
};

type Props = {
  children: ReactNode;
  locale: string;
  pendingVerification: number;
  pendingDocs: number;
  adminEmail?: string;
};

export default function AdminSidebarLayout({
  children,
  locale,
  pendingVerification,
  pendingDocs,
  adminEmail,
}: Props) {
  const pathname = usePathname();

  // Derive page title from pathname (strip locale prefix)
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '');
  const pageTitle =
    Object.entries(PAGE_TITLES).find(([key]) => pathWithoutLocale === key)?.[1] ??
    Object.entries(PAGE_TITLES).find(([key]) => pathWithoutLocale.startsWith(key) && key !== '/dashboard/admin')?.[1] ??
    'Admin';

  // Build breadcrumb
  const segments = pathWithoutLocale.split('/').filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
    href: `/${locale}/${segments.slice(0, i + 1).join('/')}`,
    isLast: i === segments.length - 1,
  }));

  const adminInitials = adminEmail
    ? adminEmail.slice(0, 2).toUpperCase()
    : 'AD';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.contentBg }}>

      {/* ── Dark Sidebar ───────────────────────────────────────────────── */}
      <aside style={{
        width: '240px',
        flexShrink: 0,
        background: C.sidebarBg,
        borderRight: `1px solid ${C.sidebarBorder}`,
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{
          padding: '22px 20px 18px',
          borderBottom: `1px solid ${C.sidebarBorder}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: C.logoAccent, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--wm-neutral-900)', letterSpacing: '-0.5px' }}>W</span>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: C.logoText, lineHeight: 1.2 }}>WorkMate</p>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: 600, color: C.sidebarActive, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Admin HQ</p>
            </div>
          </div>
        </div>

        {/* Nav section label */}
        <div style={{ padding: '18px 20px 6px' }}>
          <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.sectionLabel }}>
            Navigation
          </p>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '0 10px' }}>
          {NAV_ITEMS.map(({ Icon, label, path, badge }) => {
            const fullPath = `/${locale}${path}`;
            const isActive =
              path === '/dashboard/admin'
                ? pathname === fullPath
                : pathname.startsWith(fullPath);

            const badgeCount =
              badge === 'verification' ? pendingVerification :
              badge === 'docs' ? pendingDocs : 0;

            return (
              <Link
                key={path}
                href={fullPath}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 10px',
                  marginBottom: '2px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? C.sidebarActive : C.sidebarText,
                  background: isActive ? C.sidebarActiveBg : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.12s',
                  position: 'relative',
                }}
              >
                <Icon size={15} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
                <span style={{ flex: 1 }}>{label}</span>
                {badgeCount > 0 && (
                  <span style={{
                    background: C.badgeBg,
                    color: C.badgeText,
                    borderRadius: '10px',
                    padding: '1px 7px',
                    fontSize: '10px',
                    fontWeight: 700,
                    lineHeight: '18px',
                  }}>
                    {badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Admin user info at bottom */}
        <div style={{
          padding: '14px 20px',
          borderTop: `1px solid ${C.sidebarBorder}`,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'rgba(52,211,153,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.sidebarActive }}>{adminInitials}</span>
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: C.sidebarTextHover, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {adminEmail ?? 'Admin'}
            </p>
            <p style={{ margin: 0, fontSize: '10px', color: C.sectionLabel }}>Super Admin</p>
          </div>
        </div>
      </aside>

      {/* ── Right column: top bar + content ─────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Top bar */}
        <header style={{
          height: '60px',
          background: C.topBarBg,
          borderBottom: `1px solid ${C.topBarBorder}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: '12px',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          flexShrink: 0,
        }}>
          {/* Breadcrumb */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, overflow: 'hidden' }}>
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.href} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {i > 0 && <ChevronRight size={12} style={{ color: 'var(--wm-neutral-400)', flexShrink: 0 }} />}
                {crumb.isLast ? (
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--wm-neutral-900)' }}>{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} style={{ fontSize: '13px', color: 'var(--wm-neutral-500)', textDecoration: 'none' }}>{crumb.label}</Link>
                )}
              </span>
            ))}
          </nav>

          {/* Page title (large) */}
          <h1 style={{
            margin: 0,
            fontSize: '15px',
            fontWeight: 700,
            color: 'var(--wm-neutral-900)',
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
          }}>
            {pageTitle}
          </h1>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
            {(pendingVerification + pendingDocs) > 0 && (
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: 'var(--wm-status-warning)', position: 'relative',
              }} />
            )}
            <Bell size={18} style={{ color: 'var(--wm-neutral-500)', cursor: 'pointer' }} />
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'var(--wm-neutral-200)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--wm-neutral-600)' }}>{adminInitials}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
