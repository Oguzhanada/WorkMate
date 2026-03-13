'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const NAV_ITEMS = [
  { icon: '⬛', label: 'Overview', path: '/dashboard/admin' },
  { icon: '📋', label: 'Jobs', path: '/dashboard/admin/jobs' },
  { icon: '🪪', label: 'Applications', path: '/dashboard/admin/applications' },
  { icon: '🛡️', label: 'Risk', path: '/dashboard/admin/risk' },
  { icon: '📈', label: 'Analytics', path: '/dashboard/admin/analytics' },
  { icon: '✅', label: 'Verification', path: '/dashboard/admin/verification' },
  { icon: '🔒', label: 'GDPR', path: '/dashboard/admin/gdpr' },
  { icon: '📜', label: 'Audit', path: '/dashboard/admin/audit-logs' },
  { icon: '📊', label: 'Stats', path: '/dashboard/admin/stats' },
  { icon: '💚', label: 'Status', path: '/dashboard/admin/status' },
];

type Props = {
  children: ReactNode;
  locale: string;
  pendingVerification: number;
  pendingDocs: number;
};

export default function AdminSidebarLayout({
  children,
  locale,
  pendingVerification,
  pendingDocs,
}: Props) {
  const pathname = usePathname();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--wm-bg)' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '200px',
          flexShrink: 0,
          background: 'var(--wm-surface)',
          borderRight: '1.5px solid var(--wm-border)',
          padding: '20px 0',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            padding: '0 16px 14px',
            borderBottom: '1px solid var(--wm-border)',
            marginBottom: '8px',
          }}
        >
          <p
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--wm-muted)',
              margin: '0 0 2px',
            }}
          >
            Admin Panel
          </p>
          <p
            style={{
              fontSize: '12px',
              color: 'var(--wm-foreground)',
              margin: 0,
              fontWeight: 600,
            }}
          >
            WorkMate HQ
          </p>
        </div>

        {NAV_ITEMS.map((item) => {
          const fullPath = `/${locale}${item.path}`;
          const isActive =
            item.path === '/dashboard/admin'
              ? pathname === fullPath
              : pathname.startsWith(fullPath);

          const badge =
            item.path === '/dashboard/admin/applications'
              ? pendingVerification
              : item.path === '/dashboard/admin/verification'
              ? pendingDocs
              : 0;

          return (
            <Link
              key={item.path}
              href={fullPath}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--wm-primary)' : 'var(--wm-muted)',
                background: isActive ? 'rgba(22,155,98,0.08)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--wm-primary)' : '2px solid transparent',
                textDecoration: 'none',
                transition: 'all 0.12s',
              }}
            >
              <span style={{ fontSize: '14px' }}>{item.icon}</span>
              {item.label}
              {badge > 0 && (
                <span
                  style={{
                    marginLeft: 'auto',
                    background: 'var(--wm-gold)',
                    color: 'var(--wm-navy)',
                    borderRadius: '10px',
                    padding: '1px 7px',
                    fontSize: '10px',
                    fontWeight: 700,
                  }}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </aside>

      {/* Main content area */}
      <div style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        {children}
      </div>
    </div>
  );
}
