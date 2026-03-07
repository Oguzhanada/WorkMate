'use client';

import Link from 'next/link';
import {motion, AnimatePresence} from 'framer-motion';
import {ChevronLeft, ChevronRight, BadgeCheck, Star, MapPin} from 'lucide-react';
import {usePathname} from 'next/navigation';
import {useEffect, useMemo, useState} from 'react';

import {getLocaleRoot, withLocalePrefix} from '@/lib/i18n/locale-path';
import {useFeaturedProviders} from '@/lib/api/home';

function initialsFromName(name: string) {
  const parts = name.split(' ').filter(Boolean);
  if (!parts.length) return 'WM';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

const avatarBg = ['var(--wm-primary)', 'var(--wm-navy-mid)', 'var(--wm-amber-dark)', 'var(--wm-blue)'];

export default function FeaturedProviders() {
  const {providers, loading, error} = useFeaturedProviders();
  const pathname = usePathname() || '/';
  const localeRoot = useMemo(() => getLocaleRoot(pathname), [pathname]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (providers.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % providers.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [providers.length]);

  const active = providers[index] ?? null;
  const canNavigate = providers.length > 1;
  const next = () => setIndex((prev) => (prev + 1) % providers.length);
  const prev = () => setIndex((prev) => (prev - 1 + providers.length) % providers.length);
  const railItems = useMemo(() => providers.slice(0, 3), [providers]);

  return (
    <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <span className="wm-section-label mb-3">Featured</span>
            <h2 className="mt-3 wm-display" style={{color: 'var(--wm-navy)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)'}}>
              Trusted Professionals Near You
            </h2>
            <p className="mt-2 text-sm" style={{color: 'var(--wm-muted)'}}>
              Verified profiles, high ratings, real reviews.
            </p>
          </div>
          {canNavigate ? (
            <div className="hidden items-center gap-2 md:flex">
              <button
                type="button" onClick={prev}
                className="rounded-xl border p-2 transition"
                style={{borderColor: 'var(--wm-border)'}}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--wm-primary)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--wm-border)'; }}
                aria-label="Previous provider"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button" onClick={next}
                className="rounded-xl border p-2 transition"
                style={{borderColor: 'var(--wm-border)'}}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--wm-primary)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--wm-border)'; }}
                aria-label="Next provider"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-52 animate-pulse rounded-2xl" style={{backgroundColor: 'var(--wm-bg)'}} />
            ))}
          </div>
        ) : null}

        {error ? (
          <p className="rounded-xl px-4 py-3 text-sm" style={{backgroundColor: 'var(--wm-destructive-light)', color: 'var(--wm-destructive)'}}>
            {error}
          </p>
        ) : null}

        {!loading && !error && active ? (
          <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <div
              className="relative overflow-hidden rounded-2xl border bg-white p-7"
              style={{borderColor: 'var(--wm-border)', boxShadow: 'var(--wm-shadow-lg)'}}
            >
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-[0.08]"
                style={{background: 'radial-gradient(circle, var(--wm-primary), transparent)'}}
              />
              <AnimatePresence mode="wait">
                <motion.article
                  key={active.id}
                  initial={{opacity: 0, x: 20}}
                  animate={{opacity: 1, x: 0}}
                  exit={{opacity: 0, x: -20}}
                  transition={{duration: 0.35, ease: 'easeOut'}}
                  className="relative space-y-5"
                >
                  <div className="flex items-center gap-4">
                    {active.avatar_url ? (
                      <img
                        src={active.avatar_url}
                        alt={active.full_name}
                        className="h-16 w-16 rounded-full object-cover"
                        style={{outline: '3px solid var(--wm-primary-light)', outlineOffset: '2px'}}
                      />
                    ) : (
                      <div
                        className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold text-white"
                        style={{backgroundColor: avatarBg[index % avatarBg.length], outline: '3px solid var(--wm-primary-light)', outlineOffset: '2px'}}
                      >
                        {initialsFromName(active.full_name)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-bold" style={{fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)'}}>
                        {active.full_name}
                      </h3>
                      <p className="mt-0.5 flex items-center gap-1 text-sm" style={{color: 'var(--wm-muted)'}}>
                        <MapPin className="h-3.5 w-3.5" />
                        {active.profession} &bull; {active.county}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{backgroundColor: 'var(--wm-primary-light)', color: 'var(--wm-primary-dark)'}}>
                      <BadgeCheck className="h-3.5 w-3.5" /> Verified Pro
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{backgroundColor: 'var(--wm-amber-light)', color: 'var(--wm-amber-dark)'}}>
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {active.rating.toFixed(1)} ({active.review_count} reviews)
                    </span>
                  </div>
                  <Link
                    href={withLocalePrefix(localeRoot, `/profile/public/${active.id}`)}
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
                    style={{background: 'var(--wm-grad-primary)', fontFamily: 'var(--wm-font-display)', boxShadow: '0 4px 14px rgba(0,184,148,0.30)'}}
                  >
                    View Profile
                  </Link>
                </motion.article>
              </AnimatePresence>
            </div>

            <div className="-mx-2 flex snap-x gap-3 overflow-x-auto px-2 pb-1 lg:mx-0 lg:grid lg:grid-cols-1 lg:overflow-visible lg:px-0">
              {railItems.map((provider, itemIndex) => (
                <button
                  type="button"
                  key={provider.id}
                  onClick={() => setIndex(itemIndex)}
                  className="min-w-[240px] snap-start rounded-2xl border p-4 text-left transition-all lg:min-w-0"
                  style={{
                    borderColor: provider.id === active.id ? 'var(--wm-primary)' : 'var(--wm-border)',
                    backgroundColor: provider.id === active.id ? 'var(--wm-primary-light)' : 'white',
                    boxShadow: provider.id === active.id ? '0 4px 16px rgba(0,184,148,0.14)' : 'var(--wm-shadow-sm)'
                  }}
                >
                  <p className="font-bold" style={{fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)'}}>{provider.full_name}</p>
                  <p className="mt-0.5 text-sm" style={{color: 'var(--wm-muted)'}}>{provider.county}</p>
                  <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold" style={{color: 'var(--wm-amber-dark)'}}>
                    <Star className="h-3 w-3 fill-current" /> {provider.rating.toFixed(1)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
