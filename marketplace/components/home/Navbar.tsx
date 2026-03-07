'use client';

import Link from 'next/link';
import {AnimatePresence, motion} from 'framer-motion';
import {Menu, X, BriefcaseBusiness} from 'lucide-react';
import {useEffect, useMemo, useRef, useState} from 'react';
import WorkMateLogo from '@/components/ui/WorkMateLogo';
import {usePathname, useRouter} from 'next/navigation';

import {getSupabaseBrowserClient} from '@/lib/supabase/client';

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
  {label: 'How it works', href: '#how-it-works'},
  {label: 'Trust & Safety', href: '#trust'},
  {label: 'Categories', href: '#categories'}
];

function getLocaleRoot(pathname: string) {
  const match = pathname.match(/^\/([a-z]{2}(?:-[A-Z]{2})?)(?:\/|$)/);
  if (!match?.[1]) return '/';
  return `/${match[1]}`;
}

function withLocalePrefix(localeRoot: string, path: string) {
  if (localeRoot === '/') return path;
  return `${localeRoot}${path}`;
}

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
      profileName: typeof parsed.profileName === 'string' ? parsed.profileName : ''
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
  const isHome = pathname === localeRoot || pathname === `${localeRoot}/`;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
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
          })
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

        const [{data: roles}, {data: profile}] = await withTimeout(
          Promise.all([
            supabase.from('user_roles').select('role').eq('user_id', sessionUser.id),
            supabase.from('profiles').select('full_name').eq('id', sessionUser.id).maybeSingle()
          ])
        );

        if (!active) return;
        const roleList = (roles ?? []).map((item) => item.role);
        const nextProfileName = profile?.full_name?.trim() || quickDisplayName || '';
        setHasAdminRole(roleList.includes('admin'));
        setHasProviderRole(roleList.includes('verified_pro'));
        setProfileName(nextProfileName);
        writeAuthSnapshot({
          isAuthenticated: true,
          hasAdminRole: roleList.includes('admin'),
          hasProviderRole: roleList.includes('verified_pro'),
          profileName: nextProfileName
        });
      } catch {
        // Keep existing UI state after the initial auth bootstrap to avoid refresh flicker.
        if (!hasResolvedInitialAuthRef.current) resetAuthState();
      } finally {
        if (active && !hasResolvedInitialAuthRef.current) hasResolvedInitialAuthRef.current = true;
      }
    };

    loadAuthState();

    const {
      data: {subscription}
    } = supabase.auth.onAuthStateChange(async (_event) => {
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
        })
      ]);
    try {
      await withTimeout(supabase.auth.signOut({scope: 'global'}), 5000);
    } catch {}
    try {
      await withTimeout(fetch('/api/auth/logout', {method: 'POST', cache: 'no-store'}), 5000);
    } catch {}
    try {
      await withTimeout(supabase.auth.signOut({scope: 'local'}), 5000);
    } catch {}
    clearSupabaseCookies();
    clearSupabaseStorage();
    const target = withLocalePrefix(localeRoot, `/login?logged_out=1&t=${Date.now()}`);
    router.replace(target);
    router.refresh();
    setTimeout(() => window.location.assign(target), 120);
    setTimeout(() => setIsLoggingOut(false), 1000);
  };

  const handleHashLink = (hash: string) => {
    const targetId = hash.replace('#', '');
    setMobileOpen(false);

    if (isHome) {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({behavior: 'smooth'});
        window.history.pushState(null, '', `${localeRoot}${hash}`);
      }
      return;
    }

    router.push(`${localeRoot}${hash}`);
  };

  const dashboardHref = hasAdminRole
    ? withLocalePrefix(localeRoot, '/dashboard/admin')
    : hasProviderRole
      ? withLocalePrefix(localeRoot, '/dashboard/pro')
      : withLocalePrefix(localeRoot, '/dashboard/customer');

  return (
    <header className="sticky top-0 z-50 px-4 py-3 sm:px-6 lg:px-8">
      <motion.div
        initial={false}
        animate={scrolled ? 'scrolled' : 'top'}
        variants={{
          top: {backgroundColor: 'rgba(255,255,255,0.84)', boxShadow: '0 0 0 rgba(0,0,0,0)'},
          scrolled: {
            backgroundColor: 'rgba(255,255,255,0.72)',
            boxShadow: '0 8px 24px rgba(15,23,42,0.10)'
          }
        }}
        className="mx-auto flex w-full max-w-7xl items-center justify-between rounded-2xl border border-white/70 px-4 py-3 backdrop-blur-xl"
      >
        <Link href={localeRoot} className="flex items-center gap-2.5">
          <WorkMateLogo size={38} />
          <div>
            <p className="font-[Poppins] text-lg font-bold tracking-tight text-[var(--wm-text)]">WorkMate</p>
            <p className="text-xs text-[var(--wm-muted)]">🇮🇪 Ireland&apos;s service marketplace</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-[var(--wm-text)] lg:flex">
          {navItems.map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={() => handleHashLink(item.href)}
              className="transition-colors hover:text-[var(--wm-primary)]"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {isAuthenticated ? (
            <>
              {!hasProviderRole && !hasAdminRole ? (
                <>
                  <Link
                    href={withLocalePrefix(localeRoot, '/post-job')}
                    className="rounded-xl bg-[var(--wm-blue)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--wm-blue-dark)]"
                  >
                    📋 Post a Job
                  </Link>
                  <Link
                    href={withLocalePrefix(localeRoot, '/become-provider')}
                    className="flex items-center gap-2 rounded-xl bg-[var(--wm-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.03] hover:bg-[var(--wm-primary-dark)]"
                  >
                    <BriefcaseBusiness className="h-4 w-4" />
                    Become a Pro
                  </Link>
                </>
              ) : null}
              <Link
                href={withLocalePrefix(localeRoot, '/profile')}
                className="rounded-xl border border-[var(--wm-border)] px-4 py-2 text-sm font-semibold text-[var(--wm-text)] transition hover:border-[var(--wm-primary)] hover:text-[var(--wm-primary)]"
              >
                {profileName || 'Profile'}
              </Link>
              {!hasProviderRole && !hasAdminRole ? (
                <Link
                  href={withLocalePrefix(localeRoot, '/saved-providers')}
                  className="rounded-xl border border-[var(--wm-border)] px-4 py-2 text-sm font-semibold text-[var(--wm-text)] transition hover:border-[var(--wm-primary)] hover:text-[var(--wm-primary)]"
                >
                  ❤️ Saved
                </Link>
              ) : null}
              <Link
                href={dashboardHref}
                className="rounded-xl border border-[var(--wm-border)] px-4 py-2 text-sm font-semibold text-[var(--wm-text)] transition hover:border-[var(--wm-primary)] hover:text-[var(--wm-primary)]"
              >
                Dashboard
              </Link>
              {hasAdminRole ? (
                <Link
                  href={withLocalePrefix(localeRoot, '/dashboard/admin')}
                  className="rounded-xl border border-[var(--wm-border)] px-4 py-2 text-sm font-semibold text-[var(--wm-text)] transition hover:border-[var(--wm-primary)] hover:text-[var(--wm-primary)]"
                >
                  Admin Panel
                </Link>
              ) : null}
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="rounded-xl border border-[var(--wm-border)] px-4 py-2 text-sm font-semibold text-[var(--wm-text)] transition hover:border-[var(--wm-primary)] hover:text-[var(--wm-primary)]"
              >
                {isLoggingOut ? 'Logging out...' : 'Log out'}
              </button>
            </>
          ) : (
            <>
              <Link
                href={withLocalePrefix(localeRoot, '/login')}
                className="rounded-xl border border-[var(--wm-border)] px-4 py-2 text-sm font-semibold text-[var(--wm-text)] transition hover:border-[var(--wm-primary)] hover:text-[var(--wm-primary)]"
              >
                Log in
              </Link>
              <Link
                href={withLocalePrefix(localeRoot, '/sign-up')}
                className="rounded-xl bg-[var(--wm-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--wm-primary-dark)]"
              >
                Sign up free
              </Link>
              <Link
                href={withLocalePrefix(localeRoot, '/become-provider')}
                className="flex items-center gap-2 rounded-xl bg-[var(--wm-navy)] px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.03] hover:bg-[var(--wm-navy-mid)]"
              >
                <BriefcaseBusiness className="h-4 w-4" />
                Become a Pro
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
            initial={{opacity: 0, y: -8}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -8}}
            transition={{duration: 0.2, ease: 'easeOut'}}
            className="mx-auto mt-2 w-full max-w-7xl rounded-2xl border border-[var(--wm-border)] bg-white/95 p-4 shadow-lg backdrop-blur"
          >
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  type="button"
                  className="rounded-lg px-3 py-2 text-left text-sm font-medium text-[var(--wm-text)] transition hover:bg-[var(--wm-primary-light)]"
                  onClick={() => handleHashLink(item.href)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {isAuthenticated ? (
                <>
                  {!hasProviderRole && !hasAdminRole ? (
                    <>
                      <Link
                        href={withLocalePrefix(localeRoot, '/post-job')}
                        onClick={() => setMobileOpen(false)}
                        className="rounded-lg bg-[var(--wm-blue)] px-3 py-2 text-center text-sm font-semibold text-white sm:col-span-2"
                      >
                        📋 Post a Job
                      </Link>
                      <Link
                        href={withLocalePrefix(localeRoot, '/become-provider')}
                        onClick={() => setMobileOpen(false)}
                        className="rounded-lg bg-[var(--wm-primary)] px-3 py-2 text-center text-sm font-semibold text-white sm:col-span-2"
                      >
                        Become a Pro
                      </Link>
                    </>
                  ) : null}
                  <Link
                    href={withLocalePrefix(localeRoot, '/profile')}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg border border-[var(--wm-border)] px-3 py-2 text-center text-sm font-semibold"
                  >
                    {profileName || 'Profile'}
                  </Link>
                  {!hasProviderRole && !hasAdminRole ? (
                    <Link
                      href={withLocalePrefix(localeRoot, '/saved-providers')}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg border border-[var(--wm-border)] px-3 py-2 text-center text-sm font-semibold"
                    >
                      ❤️ Saved
                    </Link>
                  ) : null}
                  <Link
                    href={dashboardHref}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg border border-[var(--wm-border)] px-3 py-2 text-center text-sm font-semibold"
                  >
                    Dashboard
                  </Link>
                  {hasAdminRole ? (
                    <Link
                      href={withLocalePrefix(localeRoot, '/dashboard/admin')}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg border border-[var(--wm-border)] px-3 py-2 text-center text-sm font-semibold sm:col-span-2"
                    >
                      Admin Panel
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="rounded-lg border border-[var(--wm-border)] px-3 py-2 text-center text-sm font-semibold sm:col-span-2"
                  >
                    {isLoggingOut ? 'Logging out...' : 'Log out'}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href={withLocalePrefix(localeRoot, '/login')}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg border border-[var(--wm-border)] px-3 py-2 text-center text-sm font-semibold"
                  >
                    Log in
                  </Link>
                  <Link
                    href={withLocalePrefix(localeRoot, '/sign-up')}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg bg-[var(--wm-primary)] px-3 py-2 text-center text-sm font-semibold text-white"
                  >
                    Sign up free
                  </Link>
                  <Link
                    href={withLocalePrefix(localeRoot, '/become-provider')}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg bg-[var(--wm-navy)] px-3 py-2 text-center text-sm font-semibold text-white sm:col-span-2"
                  >
                    Become a Pro
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
