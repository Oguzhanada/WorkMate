'use client';

import Link from 'next/link';
import { BadgeCheck, MapPin, Star } from 'lucide-react';
import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { getLocaleRoot, withLocalePrefix } from '@/lib/i18n/locale-path';
import { useFeaturedProviders } from '@/lib/api/home';

const fallbackImages = [
  'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&w=1200&q=80',
];

const fallbackItems = [
  { id: 'fallback-1', full_name: 'Sean Murphy', profession: 'Master Plumber', county: 'Dublin', rating: 4.9, review_count: 127 },
  { id: 'fallback-2', full_name: "Aoife O'Brien", profession: 'Professional Cleaner', county: 'Cork', rating: 5.0, review_count: 94 },
  { id: 'fallback-3', full_name: 'Liam Walsh', profession: 'Landscape Designer', county: 'Galway', rating: 4.8, review_count: 86 },
];

export default function FeaturedProviders() {
  const { providers, loading } = useFeaturedProviders();
  const pathname = usePathname() || '/';
  const localeRoot = getLocaleRoot(pathname);

  const items = useMemo(() => {
    if (providers.length >= 3) return providers.slice(0, 3);
    return fallbackItems;
  }, [providers]);

  return (
    <section className="bg-[#f3f5f6] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-9 text-center">
          <h2 className="text-[clamp(2rem,4.3vw,3.4rem)] font-extrabold" style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.03em' }}>
            Top-Rated Professionals
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-[clamp(1rem,2vw,1.35rem)]" style={{ color: 'var(--color-text-secondary)' }}>
            Meet some of our most trusted and highly-rated service providers.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {items.map((provider, index) => {
            const image =
              ('avatar_url' in provider && typeof provider.avatar_url === 'string' && provider.avatar_url)
                ? provider.avatar_url
                : fallbackImages[index % fallbackImages.length];
            return (
              <article key={provider.id} className="overflow-hidden rounded-[22px] border border-black/5 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.1)]">
                <img src={image} alt={provider.full_name} className="h-[300px] w-full object-cover" />
                <div className="space-y-3 p-6">
                  <div>
                    <h3 className="flex items-center gap-2 text-3xl font-extrabold text-[var(--wm-navy)]">
                      {provider.full_name}
                      <BadgeCheck className="h-6 w-6 text-[var(--wm-primary)]" />
                    </h3>
                    <p className="mt-1 text-[1.05rem]" style={{ color: 'var(--color-text-secondary)' }}>{provider.profession || 'Verified service professional'}</p>
                  </div>

                  <p className="flex items-center gap-2 text-[1.05rem]" style={{ color: 'var(--color-text-secondary)' }}>
                    <MapPin className="h-4 w-4" />
                    {provider.county}
                  </p>

                  <p className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--wm-primary)] px-3 py-1.5 text-base font-bold text-white">
                    <Star className="h-4 w-4 fill-current" />
                    {Number(provider.rating || 0).toFixed(1)}
                  </p>
                  <p className="text-[1rem]" style={{ color: 'var(--color-text-secondary)' }}>({provider.review_count || 0} reviews)</p>

                  <Link
                    href={withLocalePrefix(localeRoot, `/profile/public/${provider.id}`)}
                    className="mt-2 inline-flex w-full items-center justify-center rounded-2xl bg-[var(--wm-navy)] px-6 py-3.5 text-lg font-semibold text-white transition hover:bg-[#0b1630]"
                  >
                    View Profile
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        {loading ? <p className="mt-6 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading providers...</p> : null}
      </div>
    </section>
  );
}

