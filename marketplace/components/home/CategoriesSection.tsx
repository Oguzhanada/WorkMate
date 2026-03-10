'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Wrench, Sparkles, Trees, Hammer, Zap, Paintbrush, ArrowUpRight } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { getLocaleRoot, withLocalePrefix } from '@/lib/i18n/locale-path';

const categories = [
  {
    title: 'Plumbing',
    tagline: 'Leaks, boilers & installations',
    searchQuery: 'plumbing',
    image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1200&q=80',
    icon: Wrench,
    height: '260px',
  },
  {
    title: 'Cleaning',
    tagline: 'Deep clean & regular visits',
    searchQuery: 'cleaning',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    icon: Sparkles,
    height: '260px',
  },
  {
    title: 'Gardening',
    tagline: 'Landscaping & upkeep',
    searchQuery: 'gardening',
    image: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&w=1200&q=80',
    icon: Trees,
    height: '260px',
  },
  {
    title: 'Handyman',
    tagline: 'Repairs & odd jobs',
    searchQuery: 'handyman',
    image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1200&q=80',
    icon: Hammer,
    height: '260px',
  },
  {
    title: 'Electrical',
    tagline: 'Licensed & insured',
    searchQuery: 'electrical',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80',
    icon: Zap,
    height: '260px',
  },
  {
    title: 'Painting',
    tagline: 'Interior & exterior',
    searchQuery: 'painting',
    image: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?auto=format&fit=crop&w=1200&q=80',
    icon: Paintbrush,
    height: '260px',
  },
];

export default function CategoriesSection() {
  const pathname = usePathname() || '/';
  const localeRoot = getLocaleRoot(pathname);

  return (
    <section className="px-5 py-24 sm:px-8 lg:px-12" style={{ background: 'var(--wm-bg)' }}>
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <motion.div
          className="mb-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <span
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: 'var(--wm-primary-dark)', fontFamily: 'var(--wm-font-display)' }}
            >
              Services
            </span>
            <h2
              className="mt-2"
              style={{
                fontFamily: 'var(--wm-font-display)',
                fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: '-0.03em',
                color: 'var(--wm-navy)',
              }}
            >
              What do you<br />need done?
            </h2>
          </div>
          <Link
            href={withLocalePrefix(localeRoot, '/find-services')}
            className="inline-flex items-center gap-2 self-start rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.03]"
            style={{
              border: '1px solid var(--wm-border)',
              color: 'var(--wm-navy)',
              fontFamily: 'var(--wm-font-display)',
            }}
          >
            View all services
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </motion.div>

        {/* Clean 3×2 grid */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {categories.map((cat, i) => {
            const Icon = cat.icon;

            return (
              <motion.div
                key={cat.title}
                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.12 }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="group"
                style={{ minHeight: cat.height }}
              >
                <Link
                  href={withLocalePrefix(localeRoot, `/find-services?q=${cat.searchQuery}`)}
                  className="relative block h-full w-full overflow-hidden"
                  style={{ borderRadius: 'var(--wm-radius-2xl)' }}
                >
                  {/* Image */}
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />

                  {/* Overlay */}
                  <div
                    className="absolute inset-0 transition-opacity duration-500 group-hover:opacity-80"
                    style={{
                      background: 'linear-gradient(to top, rgba(var(--wm-navy-rgb), 0.85) 0%, rgba(var(--wm-navy-rgb), 0.2) 60%, transparent 100%)',
                    }}
                  />

                  {/* Icon pill */}
                  <div
                    className="absolute left-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.15)',
                    }}
                  >
                    <Icon className="h-4 w-4 text-white" />
                  </div>

                  {/* Arrow — hover reveal */}
                  <div
                    className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-xl opacity-0 transition-all duration-300 group-hover:opacity-100"
                    style={{
                      background: 'var(--wm-primary)',
                      boxShadow: '0 4px 16px rgba(var(--wm-primary-rgb), 0.4)',
                    }}
                  >
                    <ArrowUpRight className="h-4 w-4 text-white" />
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
                    <h3
                      className="font-bold text-white"
                      style={{
                        fontFamily: 'var(--wm-font-display)',
                        fontSize: 'clamp(1.1rem, 2vw, 1.5rem)',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.1,
                      }}
                    >
                      {cat.title}
                    </h3>
                    <p
                      className="mt-1 text-sm"
                      style={{ color: 'rgba(255,255,255,0.7)' }}
                    >
                      {cat.tagline}
                    </p>
                    <span
                      className="mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        background: 'rgba(var(--wm-primary-rgb), 0.2)',
                        color: 'var(--wm-primary-dark)',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      Browse pros
                    </span>
                  </div>

                  {/* Hover border glow */}
                  <div
                    className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      boxShadow: 'inset 0 0 0 1.5px rgba(var(--wm-primary-rgb), 0.5)',
                    }}
                  />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
