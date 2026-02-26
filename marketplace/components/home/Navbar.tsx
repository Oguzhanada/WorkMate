'use client';

import Link from 'next/link';
import {AnimatePresence, motion} from 'framer-motion';
import {Menu, X, Hammer, BriefcaseBusiness} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';
import {usePathname, useRouter} from 'next/navigation';

import {getSupabaseBrowserClient} from '@/lib/supabase/client';

type NavItem = {
  label: string;
  href: string;
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

export default function Navbar() {
  const pathname = usePathname() || '/';
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasAdminRole, setHasAdminRole] = useState(false);
  const [hasProviderRole, setHasProviderRole] = useState(false);

  const localeRoot = useMemo(() => getLocaleRoot(pathname), [pathname]);
  const isHome = pathname === localeRoot || pathname === `${localeRoot}/`;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let active = true;

    const loadAuthState = async () => {
      try {
        setLoadingAuth(true);
        const {data: sessionData} = await supabase.auth.getSession();
        const sessionUser = sessionData?.session?.user ?? null;
        if (!active) return;

        if (!sessionUser) {
          setIsAuthenticated(false);
          setHasAdminRole(false);
          setHasProviderRole(false);
          return;
        }

        setIsAuthenticated(true);
        setLoadingAuth(false);

        const {data: roles} = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', sessionUser.id);

        if (!active) return;
        const roleList = (roles ?? []).map((item) => item.role);
        setHasAdminRole(roleList.includes('admin'));
        setHasProviderRole(roleList.includes('verified_pro'));
      } catch {
        setIsAuthenticated(false);
        setHasAdminRole(false);
        setHasProviderRole(false);
      } finally {
        if (active) setLoadingAuth(false);
      }
    };

    loadAuthState();

    const {
      data: {subscription}
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setIsAuthenticated(false);
        setHasAdminRole(false);
        setHasProviderRole(false);
        setLoadingAuth(false);
        return;
      }

      setIsAuthenticated(true);
      setLoadingAuth(false);
      const {data: roles} = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      const roleList = (roles ?? []).map((item) => item.role);
      setHasAdminRole(roleList.includes('admin'));
      setHasProviderRole(roleList.includes('verified_pro'));
      setLoadingAuth(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();
    setMobileOpen(false);
    setIsAuthenticated(false);
    setHasAdminRole(false);
    setHasProviderRole(false);
    setLoadingAuth(false);
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
      await withTimeout(supabase.auth.signOut({scope: 'local'}), 5000);
      await withTimeout(fetch('/api/auth/logout', {method: 'POST', cache: 'no-store'}), 5000);
      await withTimeout(supabase.auth.signOut({scope: 'global'}), 5000);
    } catch {
      // fallback redirect below will force fresh auth state
    }
    clearSupabaseCookies();
    clearSupabaseStorage();
    const target = withLocalePrefix(localeRoot, `/login?logged_out=1&t=${Date.now()}`);
    window.location.replace(target);
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
        <Link href={localeRoot} className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00B894] text-white">
            <Hammer className="h-5 w-5" />
          </span>
          <div>
            <p className="font-[Poppins] text-lg font-bold text-[#1F2937]">WorkMate</p>
            <p className="text-xs text-[#4B5563]">Ireland service marketplace</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-[#1F2937] lg:flex">
          {navItems.map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={() => handleHashLink(item.href)}
              className="transition-colors hover:text-[#00B894]"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {loadingAuth ? (
            <div className="h-10 w-56 animate-pulse rounded-xl bg-[#E5E7EB]" />
          ) : isAuthenticated ? (
            <>
              {!hasProviderRole && !hasAdminRole ? (
                <Link
                  href={withLocalePrefix(localeRoot, '/become-provider')}
                  className="flex items-center gap-2 rounded-xl bg-[#00B894] px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.03] hover:bg-[#008B74]"
                >
                  <BriefcaseBusiness className="h-4 w-4" />
                  Become a Pro
                </Link>
              ) : null}
              <Link
                href={withLocalePrefix(localeRoot, '/profile')}
                className="rounded-xl border border-[#D1D5DB] px-4 py-2 text-sm font-semibold text-[#1F2937] transition hover:border-[#00B894] hover:text-[#00B894]"
              >
                Profile
              </Link>
              <Link
                href={dashboardHref}
                className="rounded-xl border border-[#D1D5DB] px-4 py-2 text-sm font-semibold text-[#1F2937] transition hover:border-[#00B894] hover:text-[#00B894]"
              >
                Dashboard
              </Link>
              {hasAdminRole ? (
                <Link
                  href={withLocalePrefix(localeRoot, '/dashboard/admin')}
                  className="rounded-xl border border-[#D1D5DB] px-4 py-2 text-sm font-semibold text-[#1F2937] transition hover:border-[#00B894] hover:text-[#00B894]"
                >
                  Admin Panel
                </Link>
              ) : null}
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-[#D1D5DB] px-4 py-2 text-sm font-semibold text-[#1F2937] transition hover:border-[#00B894] hover:text-[#00B894]"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href={withLocalePrefix(localeRoot, '/login')}
                className="rounded-xl border border-[#D1D5DB] px-4 py-2 text-sm font-semibold text-[#1F2937] transition hover:border-[#00B894] hover:text-[#00B894]"
              >
                Log in
              </Link>
              <Link
                href={withLocalePrefix(localeRoot, '/sign-up')}
                className="rounded-xl bg-[#00B894] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#008B74]"
              >
                Sign up
              </Link>
              <Link
                href={withLocalePrefix(localeRoot, '/become-provider')}
                className="flex items-center gap-2 rounded-xl bg-[#00B894] px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.03] hover:bg-[#008B74]"
              >
                <BriefcaseBusiness className="h-4 w-4" />
                Become a Pro
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex rounded-xl border border-[#D1D5DB] p-2 text-[#1F2937] lg:hidden"
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
            className="mx-auto mt-2 w-full max-w-7xl rounded-2xl border border-[#E5E7EB] bg-white/95 p-4 shadow-lg backdrop-blur"
          >
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  type="button"
                  className="rounded-lg px-3 py-2 text-left text-sm font-medium text-[#1F2937] transition hover:bg-[#F3F4F6]"
                  onClick={() => handleHashLink(item.href)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {loadingAuth ? (
                <div className="h-10 w-full animate-pulse rounded-xl bg-[#E5E7EB] sm:col-span-2" />
              ) : isAuthenticated ? (
                <>
                  {!hasProviderRole && !hasAdminRole ? (
                    <Link
                      href={withLocalePrefix(localeRoot, '/become-provider')}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg bg-[#00B894] px-3 py-2 text-center text-sm font-semibold text-white sm:col-span-2"
                    >
                      Become a Pro
                    </Link>
                  ) : null}
                  <Link
                    href={withLocalePrefix(localeRoot, '/profile')}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg border border-[#D1D5DB] px-3 py-2 text-center text-sm font-semibold"
                  >
                    Profile
                  </Link>
                  <Link
                    href={dashboardHref}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg border border-[#D1D5DB] px-3 py-2 text-center text-sm font-semibold"
                  >
                    Dashboard
                  </Link>
                  {hasAdminRole ? (
                    <Link
                      href={withLocalePrefix(localeRoot, '/dashboard/admin')}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg border border-[#D1D5DB] px-3 py-2 text-center text-sm font-semibold sm:col-span-2"
                    >
                      Admin Panel
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-lg border border-[#D1D5DB] px-3 py-2 text-center text-sm font-semibold sm:col-span-2"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href={withLocalePrefix(localeRoot, '/login')}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg border border-[#D1D5DB] px-3 py-2 text-center text-sm font-semibold"
                  >
                    Log in
                  </Link>
                  <Link
                    href={withLocalePrefix(localeRoot, '/sign-up')}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg bg-[#00B894] px-3 py-2 text-center text-sm font-semibold text-white hover:bg-[#008B74]"
                  >
                    Sign up
                  </Link>
                  <Link
                    href={withLocalePrefix(localeRoot, '/become-provider')}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg bg-[#00B894] px-3 py-2 text-center text-sm font-semibold text-white sm:col-span-2"
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
