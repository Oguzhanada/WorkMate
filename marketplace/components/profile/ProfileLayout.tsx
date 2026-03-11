'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

import { getLocaleRoot, withLocalePrefix } from '@/lib/i18n/locale-path';

/* ─── Types ──────────────────────────────────────────────────── */

type Tab = {
  id: string;
  label: string;
  icon: string;
};

type SidebarProps = {
  avatarUrl: string;
  fullName: string;
  email: string;
  isVerified: boolean;
  hasProviderRole: boolean;
  joinedDate: string;
  jobsPosted: number;
  userId?: string;
};

type Props = SidebarProps & {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: ReactNode;
};

/* ─── Tabs config ────────────────────────────────────────────── */

const CUSTOMER_TABS: Tab[] = [
  { id: 'profile', label: 'Profile', icon: 'person' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
  { id: 'security', label: 'Security', icon: 'shield' },
];

const PROVIDER_TABS: Tab[] = [
  { id: 'profile', label: 'Profile', icon: 'person' },
  { id: 'business', label: 'Business', icon: 'work' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
  { id: 'security', label: 'Security', icon: 'shield' },
];

/* ─── Tab icon SVGs ──────────────────────────────────────────── */

function TabIcon({ name, active }: { name: string; active: boolean }) {
  const color = active ? 'var(--wm-primary)' : 'var(--wm-muted)';
  const size = 18;

  switch (name) {
    case 'person':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case 'work':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      );
    case 'settings':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    case 'shield':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    default:
      return null;
  }
}

/* ─── Framer motion variants ─────────────────────────────────── */

const tabContentVariants = {
  enter: { opacity: 0, y: 8 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

/* ─── Component ──────────────────────────────────────────────── */

export default function ProfileLayout({
  avatarUrl,
  fullName,
  email,
  isVerified,
  hasProviderRole,
  joinedDate,
  jobsPosted,
  userId = '',
  activeTab,
  onTabChange,
  children,
}: Props) {
  const pathname = usePathname() || '/';
  const localeRoot = getLocaleRoot(pathname);

  const tabs = hasProviderRole ? PROVIDER_TABS : CUSTOMER_TABS;

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'U';

  return (
    <div className="mx-auto grid w-full gap-6" style={{ maxWidth: 1200, padding: '0 16px' }}>
      {/* ── Two-column desktop layout ─────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* ── Left sidebar ────────────────────────────────────────── */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          {/* Avatar card */}
          <div
            className="flex flex-col items-center gap-4 rounded-2xl p-6"
            style={{
              background: 'var(--wm-surface)',
              border: '1px solid var(--wm-border)',
              boxShadow: 'var(--wm-shadow-md)',
            }}
          >
            {/* Avatar circle */}
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${fullName} profile photo`}
                className="h-24 w-24 rounded-full object-cover"
                style={{
                  border: '3px solid rgba(var(--wm-primary-rgb), 0.6)',
                  boxShadow: '0 0 0 5px rgba(var(--wm-primary-rgb), 0.15)',
                }}
              />
            ) : (
              <div
                className="grid h-24 w-24 place-items-center rounded-full text-2xl font-bold"
                style={{
                  border: '3px solid rgba(var(--wm-primary-rgb), 0.6)',
                  boxShadow: '0 0 0 5px rgba(var(--wm-primary-rgb), 0.15)',
                  background: 'var(--wm-primary-light)',
                  color: 'var(--wm-primary-dark)',
                }}
              >
                {initials}
              </div>
            )}

            {/* Name + email */}
            <div className="text-center">
              <p
                className="text-lg font-bold"
                style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
              >
                {fullName || 'User'}
              </p>
              <p className="mt-0.5 text-sm" style={{ color: 'var(--wm-muted)' }}>
                {email}
              </p>
            </div>

            {/* Role + verification badges */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span
                className="rounded-full px-3 py-1 text-xs font-bold"
                style={{
                  background: hasProviderRole
                    ? 'rgba(var(--wm-primary-rgb), 0.12)'
                    : 'var(--wm-primary-light)',
                  color: hasProviderRole ? 'var(--wm-primary-dark)' : 'var(--wm-primary-dark)',
                  border: `1px solid ${hasProviderRole ? 'rgba(var(--wm-primary-rgb), 0.3)' : 'var(--wm-border)'}`,
                }}
              >
                {hasProviderRole ? 'Provider' : 'Customer'}
              </span>
              <span
                className="rounded-full px-3 py-1 text-xs font-bold"
                style={{
                  background: isVerified
                    ? 'rgba(var(--wm-primary-rgb), 0.12)'
                    : 'rgba(var(--wm-destructive-rgb), 0.08)',
                  color: isVerified ? 'var(--wm-primary-dark)' : 'var(--wm-destructive)',
                  border: `1px solid ${isVerified ? 'rgba(var(--wm-primary-rgb), 0.3)' : 'rgba(var(--wm-destructive-rgb), 0.22)'}`,
                }}
              >
                {isVerified ? 'Verified' : 'Not Verified'}
              </span>
            </div>
          </div>

          {/* Quick stats card */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: 'var(--wm-surface)',
              border: '1px solid var(--wm-border)',
              boxShadow: 'var(--wm-shadow-sm)',
            }}
          >
            <p
              className="mb-3 text-xs font-bold uppercase tracking-wider"
              style={{ color: 'var(--wm-muted)', letterSpacing: '0.08em' }}
            >
              Quick Stats
            </p>
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--wm-muted)' }}>Joined</span>
                <span
                  className="text-sm font-semibold"
                  style={{ color: 'var(--wm-navy)', fontFamily: 'var(--wm-font-display)' }}
                >
                  {joinedDate}
                </span>
              </div>
              <div
                className="h-px w-full"
                style={{ background: 'var(--wm-border)' }}
              />
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--wm-muted)' }}>Tasks Posted</span>
                <span
                  className="text-sm font-semibold"
                  style={{ color: 'var(--wm-navy)', fontFamily: 'var(--wm-font-display)' }}
                >
                  {jobsPosted}
                </span>
              </div>
            </div>
          </div>

          {/* Quick nav links */}
          <div
            className="rounded-2xl p-4"
            style={{
              background: 'var(--wm-surface)',
              border: '1px solid var(--wm-border)',
              boxShadow: 'var(--wm-shadow-sm)',
            }}
          >
            <p
              className="mb-3 text-xs font-bold uppercase tracking-wider"
              style={{ color: 'var(--wm-muted)', letterSpacing: '0.08em' }}
            >
              Quick Links
            </p>
            <nav className="grid gap-1">
              <Link
                href={withLocalePrefix(localeRoot, hasProviderRole ? '/dashboard/pro' : '/dashboard/customer')}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium no-underline transition-colors"
                style={{ color: 'var(--wm-text)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--wm-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                </svg>
                Dashboard
              </Link>
              <Link
                href={withLocalePrefix(localeRoot, '/account/settings')}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium no-underline transition-colors"
                style={{ color: 'var(--wm-text)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--wm-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Privacy &amp; GDPR
              </Link>
              {hasProviderRole ? (
                <Link
                  href={withLocalePrefix(localeRoot, `/profile/public/${userId}`)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium no-underline transition-colors"
                  style={{ color: 'var(--wm-text)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--wm-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                  Public Profile
                </Link>
              ) : null}
              {!hasProviderRole ? (
                <Link
                  href={withLocalePrefix(localeRoot, '/become-provider')}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium no-underline transition-colors"
                  style={{ color: 'var(--wm-primary-dark)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--wm-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Become a Provider
                </Link>
              ) : null}
            </nav>
          </div>
        </aside>

        {/* ── Right main content area ─────────────────────────────── */}
        <div className="min-w-0">
          {/* Tab navigation */}
          <div
            className="mb-6 flex gap-1 overflow-x-auto rounded-2xl p-1.5"
            style={{
              background: 'var(--wm-surface)',
              border: '1px solid var(--wm-border)',
              boxShadow: 'var(--wm-shadow-sm)',
            }}
            role="tablist"
            aria-label="Profile sections"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${tab.id}`}
                  onClick={() => onTabChange(tab.id)}
                  className="relative flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all"
                  style={{
                    background: isActive
                      ? 'linear-gradient(135deg, var(--wm-primary) 0%, var(--wm-primary-dark) 100%)'
                      : 'transparent',
                    color: isActive ? '#fff' : 'var(--wm-muted)',
                    boxShadow: isActive ? '0 4px 12px rgba(var(--wm-primary-rgb), 0.3)' : 'none',
                    cursor: 'pointer',
                    border: 'none',
                    fontFamily: 'var(--wm-font-display)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <TabIcon name={tab.icon} active={isActive} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content with animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              id={`tabpanel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={activeTab}
              variants={tabContentVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
