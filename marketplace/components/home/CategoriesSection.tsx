'use client';

import Link from 'next/link';
import { Wrench, Sparkles, Trees, Hammer, Zap, Paintbrush } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { getLocaleRoot, withLocalePrefix } from '@/lib/i18n/locale-path';

const categoryCards = [
  {
    title: 'Plumbing',
    description: 'Leaks, installations, and repairs',
    slug: 'home-cleaning',
    image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1200&q=80',
    icon: Wrench,
  },
  {
    title: 'Cleaning',
    description: 'Professional home cleaning services',
    slug: 'home-cleaning',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    icon: Sparkles,
  },
  {
    title: 'Gardening',
    description: 'Landscaping and garden maintenance',
    slug: 'garden-maintenance',
    image: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&w=1200&q=80',
    icon: Trees,
  },
  {
    title: 'Handyman',
    description: 'General repairs and installations',
    slug: 'painting-decorating',
    image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1200&q=80',
    icon: Hammer,
  },
  {
    title: 'Electrical',
    description: 'Licensed electricians for all jobs',
    slug: 'ac-service',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80',
    icon: Zap,
  },
  {
    title: 'Painting',
    description: 'Interior and exterior painting',
    slug: 'painting-decorating',
    image: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?auto=format&fit=crop&w=1200&q=80',
    icon: Paintbrush,
  },
];

export default function CategoriesSection() {
  const pathname = usePathname() || '/';
  const localeRoot = getLocaleRoot(pathname);

  return (
    <section id="categories" className="px-4 py-16 sm:px-6 lg:px-8" style={{ background: 'var(--wm-bg)' }}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-9 text-center">
          <h2
            className="text-[clamp(2rem,4.3vw,3.4rem)] font-extrabold"
            style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.03em' }}
          >
            Most Requested Services
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-[clamp(1rem,2vw,1.5rem)]" style={{ color: 'var(--color-text-secondary)' }}>
            Browse our most requested categories and find the perfect professional for your needs.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {categoryCards.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={withLocalePrefix(localeRoot, `/service/${item.slug}`)}
                className="group relative block h-[290px] overflow-hidden rounded-[22px] border border-black/5 shadow-[0_10px_24px_rgba(15,23,42,0.12)]"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/28 to-transparent" />

                <div className="absolute bottom-5 left-5 right-5 z-10">
                  <div className="mb-2 flex items-center gap-2.5">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--wm-primary)] text-white shadow-[0_6px_18px_rgba(16,185,129,0.35)]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <h3 className="text-[2rem] font-extrabold text-white">{item.title}</h3>
                  </div>
                  <p className="text-[1.05rem] leading-snug text-white/92">{item.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

