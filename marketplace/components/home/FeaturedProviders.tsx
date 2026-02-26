'use client';

import Link from 'next/link';
import {motion, AnimatePresence} from 'framer-motion';
import {ChevronLeft, ChevronRight, BadgeCheck, Star} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';

import {useFeaturedProviders} from '@/lib/api/home';

function initialsFromName(name: string) {
  const parts = name.split(' ').filter(Boolean);
  if (!parts.length) return 'WM';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

export default function FeaturedProviders() {
  const {providers, loading, error} = useFeaturedProviders();
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
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-[Poppins] text-3xl font-bold text-[#1F2937]">Trusted Professionals Near You</h2>
            <p className="mt-2 text-[#4B5563]">Verified profiles, high ratings, real reviews.</p>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={prev}
              disabled={!canNavigate}
              className="rounded-xl border border-[#D1D5DB] p-2 text-[#1F2937] transition hover:border-[#00B894] disabled:opacity-40"
              aria-label="Previous provider"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              disabled={!canNavigate}
              className="rounded-xl border border-[#D1D5DB] p-2 text-[#1F2937] transition hover:border-[#00B894] disabled:opacity-40"
              aria-label="Next provider"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-52 animate-pulse rounded-2xl border border-[#E5E7EB] bg-[#F3F4F6]" />
            ))}
          </div>
        ) : null}

        {error ? <p className="rounded-xl bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">{error}</p> : null}

        {!loading && !error && active ? (
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div className="relative overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <AnimatePresence mode="wait">
                <motion.article
                  key={active.id}
                  initial={{opacity: 0, x: 24}}
                  animate={{opacity: 1, x: 0}}
                  exit={{opacity: 0, x: -24}}
                  transition={{duration: 0.35, ease: 'easeOut'}}
                  className="space-y-5"
                >
                  <div className="flex items-center gap-4">
                    {active.avatar_url ? (
                      <img src={active.avatar_url} alt={active.full_name} className="h-16 w-16 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ECFDF5] font-semibold text-[#008B74]">
                        {initialsFromName(active.full_name)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-[Poppins] text-xl font-semibold text-[#1F2937]">{active.full_name}</h3>
                      <p className="text-sm text-[#4B5563]">{active.profession} • {active.county}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF5] px-3 py-1 text-sm font-medium text-[#047857]">
                      <BadgeCheck className="h-4 w-4" /> Verified
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#EEF6FF] px-3 py-1 text-sm font-medium text-[#0050A4]">
                      <Star className="h-4 w-4 fill-current" /> {active.rating.toFixed(1)} ({active.review_count} reviews)
                    </span>
                  </div>

                  <Link href={`/profile/public/${active.id}`} className="inline-flex rounded-xl bg-[#00B894] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#008B74]">
                    View profile
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
                  className={`min-w-[260px] snap-start rounded-2xl border p-4 text-left transition lg:min-w-0 ${
                    provider.id === active.id ? 'border-[#00B894] bg-[#ECFDF5]' : 'border-[#E5E7EB] bg-white'
                  }`}
                >
                  <p className="font-semibold text-[#1F2937]">{provider.full_name}</p>
                  <p className="text-sm text-[#4B5563]">{provider.county}</p>
                  <p className="mt-2 inline-flex items-center gap-1 text-sm text-[#0066CC]">
                    <Star className="h-4 w-4 fill-current" /> {provider.rating.toFixed(1)}
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
