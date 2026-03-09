'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import WorkMateLogo from '@/components/ui/WorkMateLogo';
import NotificationBell from '@/components/notifications/NotificationBell';
import { usePathname, useRouter } from 'next/navigation';

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
  { label: 'Find Services', href: '/search' },
  { label: 'How It Works', href: '/how-it-works' },
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
    <header className="sticky top-0 z-50 border-b border-[var(--wm-border)] bg-white/96 backdrop-blur-md">
      <motion.div
        initial={false}
        animate={{ boxShadow: scrolled ? '0 8px 22px rgba(15,23,42,0.08)' : '0 1px 0 rgba(15,23,42,0.03)' }}
        className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
      >
        <Link href={localeRoot} className="flex items-center gap-2.5">
          <WorkMateLogo size={42} />
          <span className="text-[35px] font-extrabold leading-none tracking-[-0.03em] text-[var(--wm-navy)]" style={{ fontSize: 'clamp(1.65rem,3vw,2rem)' }}>
            WorkMate
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-[15px] font-semibold text-[#334155] lg:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={withLocalePrefix(localeRoot, item.href)} className="transition hover:text-[#0f172a]">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {isAuthenticated ? (
            <>
              <Link href={dashboardHref} className="px-3 py-2 text-sm font-semibold text-[#0f172a] transition hover:text-[var(--wm-primary-dark)]">
                Dashboard
              </Link>
              <Link href={withLocalePrefix(localeRoot, '/saved-searches')} className="px-3 py-2 text-sm font-semibold text-[#0f172a] transition hover:text-[var(--wm-primary-dark)]">
                Saved Searches
              </Link>
              <NotificationBell />
              <Link href={withLocalePrefix(localeRoot, '/profile')} className="px-3 py-2 text-sm font-semibold text-[#0f172a] transition hover:text-[var(--wm-primary-dark)]">
                {displayName}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="rounded-[14px] bg-[var(--wm-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--wm-primary-dark)]"
              >
                {isLoggingOut ? 'Logging out...' : 'Log out'}
              </button>
            </>
          ) : (
            <>
              <Link href={withLocalePrefix(localeRoot, '/login')} className="px-3 py-2 text-sm font-semibold text-[#0f172a] transition hover:text-[var(--wm-primary-dark)]">
                Sign In
              </Link>
              <Link
                href={withLocalePrefix(localeRoot, '/sign-up')}
                className="rounded-[14px] bg-[var(--wm-primary)] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(16,185,129,0.25)] transition hover:bg-[var(--wm-primary-dark)]"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex rounded-xl border border-[var(--wm-border)] p-2 text-[var(--wm-text)] lg:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle mobile navigation"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </motion.div>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="border-t border-[var(--wm-border)] bg-white px-4 py-4 sm:px-6"
          >
            <div className="mx-auto grid w-full max-w-7xl gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={withLocalePrefix(localeRoot, item.href)}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--wm-text)] transition hover:bg-[var(--wm-primary-faint)]"
                >
                  {item.label}
                </Link>
              ))}
              {isAuthenticated ? (
                <>
                  <Link
                    href={dashboardHref}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--wm-text)] transition hover:bg-[var(--wm-primary-faint)]"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href={withLocalePrefix(localeRoot, '/saved-searches')}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--wm-text)] transition hover:bg-[var(--wm-primary-faint)]"
                  >
                    Saved Searches
                  </Link>
                  <div className="px-3 py-1">
                    <NotificationBell />
                  </div>
                  <Link
                    href={withLocalePrefix(localeRoot, '/profile')}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--wm-text)] transition hover:bg-[var(--wm-primary-faint)]"
                  >
                    {displayName}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="mt-1 rounded-[14px] bg-[var(--wm-primary)] px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    {isLoggingOut ? 'Logging out...' : 'Log out'}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href={withLocalePrefix(localeRoot, '/login')}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--wm-text)] transition hover:bg-[var(--wm-primary-faint)]"
                  >
                    Sign In
                  </Link>
                  <Link
                    href={withLocalePrefix(localeRoot, '/sign-up')}
                    onClick={() => setMobileOpen(false)}
                    className="mt-1 rounded-[14px] bg-[var(--wm-primary)] px-4 py-2.5 text-center text-sm font-semibold text-white"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
