'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, ArrowRight, MessageSquare, Bookmark } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import WorkMateLogo from '@/components/ui/WorkMateLogo';
import NotificationBell from '@/components/notifications/NotificationBell';
import { usePathname, useRouter } from 'next/navigation';

import ThemeToggle from '@/components/ui/ThemeToggle';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getLocaleRoot, withLocalePrefix } from '@/lib/i18n/locale-path';

type NavItem = {
  label: string;
  href: string;
};

const NAV_AUTH_CACHE_KEY = 'workmate.nav.auth.snapshot';

type NavAuthSnapshot = {
  isAuthenticated: boolean;
  hasAdminRole: boolean;
  hasProviderRole: boolean;
  profileName: string;
};

const navItems: NavItem[] = [
  { label: 'Find Services', href: '/find-services' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Post a Job', href: '/post-job' },
];

function readAuthSnapshot(): NavAuthSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(NAV_AUTH_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<NavAuthSnapshot>;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      isAuthenticated: Boolean(parsed.isAuthenticated),
      hasAdminRole: Boolean(parsed.hasAdminRole),
      hasProviderRole: Boolean(parsed.hasProviderRole),
      profileName: typeof parsed.profileName === 'string' ? parsed.profileName : '',
    };
  } catch {
    return null;
  }
}

function writeAuthSnapshot(snapshot: NavAuthSnapshot) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(NAV_AUTH_CACHE_KEY, JSON.stringify(snapshot));
  } catch {}
}

function clearAuthSnapshot() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(NAV_AUTH_CACHE_KEY);
  } catch {}
}

/** Check if a nav href matches the current pathname */
function isActiveLink(pathname: string, href: string, localeRoot: string): boolean {
  const full = withLocalePrefix(localeRoot, href);
  return pathname === full || pathname.startsWith(full + '/');
}

export default function Navbar() {
  const pathname = usePathname() || '/';
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasAdminRole, setHasAdminRole] = useState(false);
  const [hasProviderRole, setHasProviderRole] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const hasResolvedInitialAuthRef = useRef(false);

  const localeRoot = useMemo(() => getLocaleRoot(pathname), [pathname]);
  const displayName = profileName.trim() || 'Profile';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const cached = readAuthSnapshot();
    if (cached?.isAuthenticated) {
      setIsAuthenticated(true);
      setHasAdminRole(cached.hasAdminRole);
      setHasProviderRole(cached.hasProviderRole);
      setProfileName(cached.profileName);
    }

    const supabase = getSupabaseBrowserClient();
    let active = true;
    const AUTH_TIMEOUT_MS = 4500;

    const withTimeout = async <T,>(promise: Promise<T>, timeoutMs = AUTH_TIMEOUT_MS) => {
      let timer: ReturnType<typeof setTimeout> | null = null;
      try {
        return await Promise.race([
          promise,
          new Promise<T>((_, reject) => {
            timer = setTimeout(() => reject(new Error('auth_timeout')), timeoutMs);
          }),
        ]);
      } finally {
        if (timer) clearTimeout(timer);
      }
    };

    const resetAuthState = () => {
      if (!active) return;
      setIsAuthenticated(false);
      setHasAdminRole(false);
      setHasProviderRole(false);
      setProfileName('');
      clearAuthSnapshot();
    };

    const loadAuthState = async () => {
      try {
        let sessionUser: { id: string } | null = null;
        let quickDisplayName = '';
        const sessionResult = await withTimeout<Awaited<ReturnType<typeof supabase.auth.getSession>>>(
          supabase.auth.getSession()
        );
        const sessionData = sessionResult.data;
        quickDisplayName = sessionData.session?.user?.user_metadata?.full_name?.trim() || '';
        sessionUser = (sessionData.session?.user as { id: string } | null) ?? null;

        if (!sessionUser) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const userResult = await withTimeout<any>(supabase.auth.getUser());
          sessionUser = (userResult?.data?.user as { id: string } | null) ?? null;
          quickDisplayName = userResult?.data?.user?.user_metadata?.full_name?.trim() || quickDisplayName;
        }

        if (!active) return;
        if (!sessionUser) {
          resetAuthState();
          return;
        }

        setIsAuthenticated(true);
        if (quickDisplayName) setProfileName(quickDisplayName);

        const [{ data: roles }, { data: profile }] = await withTimeout(
          Promise.all([
            supabase.from('user_roles').select('role').eq('user_id', sessionUser.id),
            supabase.from('profiles').select('full_name').eq('id', sessionUser.id).maybeSingle(),
          ])
        );

        if (!active) return;
        const roleList = (roles ?? []).map((item) => item.role);
        const nextProfileName = profile?.full_name?.trim() || quickDisplayName || '';
        const nextState: NavAuthSnapshot = {
          isAuthenticated: true,
          hasAdminRole: roleList.includes('admin'),
          hasProviderRole: roleList.includes('verified_pro'),
          profileName: nextProfileName,
        };
        setHasAdminRole(nextState.hasAdminRole);
        setHasProviderRole(nextState.hasProviderRole);
        setProfileName(nextState.profileName);
        writeAuthSnapshot(nextState);
      } catch {
        if (!hasResolvedInitialAuthRef.current) resetAuthState();
      } finally {
        if (active && !hasResolvedInitialAuthRef.current) hasResolvedInitialAuthRef.current = true;
      }
    };

    loadAuthState();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async () => {
      await loadAuthState();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    const supabase = getSupabaseBrowserClient();
    setMobileOpen(false);
    setIsAuthenticated(false);
    setHasAdminRole(false);
    setHasProviderRole(false);
    setProfileName('');
    clearAuthSnapshot();
    const clearSupabaseCookies = () => {
      if (typeof document === 'undefined') return;
      const cookies = document.cookie.split(';');
      for (const rawCookie of cookies) {
        const cookieName = rawCookie.split('=')[0]?.trim();
        if (!cookieName || !cookieName.startsWith('sb-')) continue;
        document.cookie = `${cookieName}=; Max-Age=0; path=/;`;
      }
    };
    const clearSupabaseStorage = () => {
      if (typeof window === 'undefined') return;
      const targets: Storage[] = [window.localStorage, window.sessionStorage];
      for (const storage of targets) {
        const keys = Object.keys(storage).filter((key) => key.startsWith('sb-'));
        for (const key of keys) storage.removeItem(key);
      }
    };
    const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number) =>
      Promise.race([
        promise,
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('timeout')), timeoutMs);
        }),
      ]);
    try {
      await withTimeout(supabase.auth.signOut({ scope: 'global' }), 5000);
    } catch {}
    try {
      await withTimeout(fetch('/api/auth/logout', { method: 'POST', cache: 'no-store' }), 5000);
    } catch {}
    try {
      await withTimeout(supabase.auth.signOut({ scope: 'local' }), 5000);
    } catch {}
    clearSupabaseCookies();
    clearSupabaseStorage();
    const target = withLocalePrefix(localeRoot, `/login?logged_out=1&t=${Date.now()}`);
    router.replace(target);
    router.refresh();
    setTimeout(() => window.location.assign(target), 120);
    setTimeout(() => setIsLoggingOut(false), 1000);
  };

  const dashboardHref = hasAdminRole
    ? withLocalePrefix(localeRoot, '/dashboard/admin')
    : hasProviderRole
      ? withLocalePrefix(localeRoot, '/dashboard/pro')
      : withLocalePrefix(localeRoot, '/dashboard/customer');

  return (
    <motion.header
      className="sticky top-0 z-50"
      initial={false}
      animate={{
        backgroundColor: scrolled ? 'var(--wm-glass)' : 'rgba(255,255,255,0)',
        backdropFilter: scrolled ? 'blur(20px) saturate(1.2)' : 'blur(0px)',
        borderBottomColor: scrolled ? 'var(--wm-border-soft)' : 'transparent',
      }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        borderBottom: '1px solid transparent',
      }}
    >
      {/* Scroll glow line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[1px]"
        initial={false}
        animate={{
          opacity: scrolled ? 1 : 0,
          background: scrolled
            ? 'linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.2) 30%, rgba(16,185,129,0.35) 50%, rgba(16,185,129,0.2) 70%, transparent 100%)'
            : 'transparent',
        }}
        transition={{ duration: 0.4 }}
      />

      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href={localeRoot} className="flex items-center gap-2.5">
          <WorkMateLogo size={38} />
          <span
            className="font-extrabold leading-none"
            style={{
              fontSize: 'clamp(1.4rem, 2.6vw, 1.7rem)',
              letterSpacing: '0.04em',
              color: 'var(--wm-navy)',
              fontFamily: 'var(--wm-font-display)',
            }}
          >
            WorkMate
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden items-center gap-5 lg:flex">
          {navItems.map((item) => {
            const active = isActiveLink(pathname, item.href, localeRoot);
            return (
              <Link
                key={item.href}
                href={withLocalePrefix(localeRoot, item.href)}
                className="group relative whitespace-nowrap py-1 text-[14px] font-medium transition-colors"
                style={{ color: active ? 'var(--wm-navy)' : 'var(--wm-text-muted)' }}
              >
                {item.label}
                {/* Animated underline */}
                <span
                  className="absolute -bottom-0.5 left-0 h-[2px] rounded-full transition-all duration-300 ease-out group-hover:w-full"
                  style={{
                    width: active ? '100%' : '0%',
                    background: 'var(--wm-primary)',
                  }}
                />
              </Link>
            );
          })}
        </nav>

        {/* Desktop right-side actions */}
        <div className="hidden items-center gap-2 lg:flex">
          {isAuthenticated ? (
            <>
              <Link
                href={dashboardHref}
                className="group relative whitespace-nowrap px-3 py-2 text-[14px] font-medium transition-colors"
                style={{ color: 'var(--wm-navy)' }}
              >
                Dashboard
                <span
                  className="absolute bottom-0.5 left-3 right-3 h-[2px] rounded-full transition-all duration-300 ease-out group-hover:w-full"
                  style={{ width: '0%', background: 'var(--wm-primary)' }}
                />
              </Link>
              {/* Saved Searches — icon only with tooltip to save space */}
              <Link
                href={withLocalePrefix(localeRoot, '/saved-searches')}
                title="Saved Searches"
                aria-label="Saved Searches"
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-[var(--wm-primary-light)]"
                style={{ color: 'var(--wm-navy)' }}
              >
                <Bookmark className="h-4 w-4" />
              </Link>
              {/* Messages — icon only with tooltip */}
              <Link
                href={withLocalePrefix(localeRoot, '/messages')}
                title="Messages"
                aria-label="Messages"
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-[var(--wm-primary-light)]"
                style={{ color: 'var(--wm-navy)' }}
              >
                <MessageSquare className="h-4 w-4" />
              </Link>
              <ThemeToggle />
              <NotificationBell />
              <Link
                href={withLocalePrefix(localeRoot, '/profile')}
                className="group relative max-w-[120px] truncate whitespace-nowrap px-3 py-2 text-[14px] font-medium transition-colors"
                style={{ color: 'var(--wm-navy)' }}
                title={displayName}
              >
                {displayName}
                <span
                  className="absolute bottom-0.5 left-3 right-3 h-[2px] rounded-full transition-all duration-300 ease-out group-hover:w-full"
                  style={{ width: '0%', background: 'var(--wm-primary)' }}
                />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-sm font-medium text-white transition-all"
                style={{
                  background: 'var(--wm-grad-primary)',
                  padding: '0.55rem 1.25rem',
                  borderRadius: '999px',
                  boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                }}
              >
                {isLoggingOut ? 'Logging out...' : 'Log out'}
              </button>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Link
                href={withLocalePrefix(localeRoot, '/login')}
                className="group relative px-3 py-2 text-sm font-medium transition-colors"
                style={{ color: 'var(--wm-navy)' }}
              >
                Sign In
                <span
                  className="absolute bottom-0.5 left-3 right-3 h-[2px] rounded-full transition-all duration-300 ease-out group-hover:w-full"
                  style={{
                    width: '0%',
                    background: 'var(--wm-primary)',
                  }}
                />
              </Link>
              <Link
                href={withLocalePrefix(localeRoot, '/post-job')}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-white transition-all hover:brightness-110"
                style={{
                  background: 'var(--wm-grad-primary)',
                  padding: '0.55rem 1.5rem',
                  borderRadius: '999px',
                  boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                  fontFamily: 'var(--wm-font-display)',
                }}
              >
                Post a Job
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile: theme toggle + hamburger */}
        <div className="flex items-center gap-1 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex rounded-xl p-2"
            style={{ border: '1px solid var(--wm-border)', color: 'var(--wm-text)' }}
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle mobile navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-y-auto lg:hidden"
            style={{
              maxHeight: 'calc(100vh - 60px)',
              background: 'var(--wm-glass)',
              backdropFilter: 'blur(20px) saturate(1.2)',
              borderTop: '1px solid var(--wm-border-soft)',
            }}
          >
            <div className="mx-auto grid w-full max-w-7xl gap-1 px-4 py-4 sm:px-6">
              {navItems.map((item) => {
                const active = isActiveLink(pathname, item.href, localeRoot);
                return (
                  <Link
                    key={item.href}
                    href={withLocalePrefix(localeRoot, item.href)}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium transition"
                    style={{
                      color: active ? 'var(--wm-navy)' : 'var(--wm-text-muted)',
                      background: active ? 'var(--wm-primary-faint)' : 'transparent',
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
              {isAuthenticated ? (
                <>
                  <Link
                    href={dashboardHref}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium transition"
                    style={{ color: 'var(--wm-text-muted)' }}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href={withLocalePrefix(localeRoot, '/saved-searches')}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium transition"
                    style={{ color: 'var(--wm-text-muted)' }}
                  >
                    Saved Searches
                  </Link>
                  <Link
                    href={withLocalePrefix(localeRoot, '/messages')}
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition"
                    style={{ color: 'var(--wm-text-muted)' }}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Messages
                  </Link>
                  <div className="px-3 py-1">
                    <NotificationBell />
                  </div>
                  <Link
                    href={withLocalePrefix(localeRoot, '/profile')}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium transition"
                    style={{ color: 'var(--wm-text-muted)' }}
                  >
                    {displayName}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="mt-2 text-sm font-medium text-white"
                    style={{
                      background: 'var(--wm-grad-primary)',
                      padding: '0.6rem 1rem',
                      borderRadius: '999px',
                      boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                    }}
                  >
                    {isLoggingOut ? 'Logging out...' : 'Log out'}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href={withLocalePrefix(localeRoot, '/login')}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium transition"
                    style={{ color: 'var(--wm-text-muted)' }}
                  >
                    Sign In
                  </Link>
                  <Link
                    href={withLocalePrefix(localeRoot, '/post-job')}
                    onClick={() => setMobileOpen(false)}
                    className="mt-2 text-center text-sm font-bold text-white"
                    style={{
                      background: 'var(--wm-grad-primary)',
                      padding: '0.6rem 1rem',
                      borderRadius: '999px',
                      boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                      fontFamily: 'var(--wm-font-display)',
                    }}
                  >
                    Post a Job
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}
