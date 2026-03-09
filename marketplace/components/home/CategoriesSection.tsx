'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Wrench, Sparkles, Trees, Hammer, Zap, Paintbrush, ArrowRight } from 'lucide-react';
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
    <section id="categories" className="px-4 py-20 sm:px-6 lg:px-8" style={{ background: 'var(--wm-bg)' }}>
      <div className="mx-auto max-w-7xl">
        {/* Editorial header — left-aligned */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <span
            className="text-xs font-bold tracking-[0.2em] uppercase"
            style={{ color: 'var(--wm-primary)', fontFamily: 'var(--wm-font-display)' }}
          >
            Most Requested
          </span>
          <div className="mt-3 flex items-center gap-4">
            <h2
              className="text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.1]"
              style={{
                color: 'var(--wm-text-strong)',
                fontFamily: 'var(--wm-font-display)',
                letterSpacing: '-0.03em',
              }}
            >
              Services
            </h2>
            <div
              className="hidden h-[2px] flex-1 sm:block"
              style={{
                background: 'linear-gradient(90deg, var(--wm-primary) 0%, transparent 100%)',
                maxWidth: '120px',
              }}
            />
          </div>
          <p
            className="mt-3 max-w-md text-base leading-relaxed"
            style={{ color: 'var(--wm-text-muted)' }}
          >
            Browse our most requested categories and find the perfect professional for your needs.
          </p>
        </motion.div>

        {/* Asymmetric editorial grid */}
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'auto auto',
          }}
        >
          {categoryCards.map((item, index) => {
            const Icon = item.icon;
            const isFeatured = index === 0;

            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.08,
                  ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
                }}
                className={isFeatured ? 'col-span-3 sm:col-span-2 sm:row-span-2' : 'col-span-3 sm:col-span-1'}
              >
                <Link
                  href={withLocalePrefix(localeRoot, `/service/${item.slug}`)}
                  className="group relative block w-full overflow-hidden"
                  style={{
                    height: isFeatured ? '100%' : undefined,
                    minHeight: isFeatured ? '380px' : '220px',
                    borderRadius: 'var(--wm-radius-2xl)',
                    boxShadow: 'var(--wm-shadow-md)',
                  }}
                >
                  {/* Background image */}
                  <img
                    src={item.image}
                    alt={item.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
                  />

                  {/* Sophisticated gradient overlay — navy-to-transparent with teal tint */}
                  <div
                    className="absolute inset-0 transition-opacity duration-500 group-hover:opacity-70"
                    style={{
                      background:
                        'linear-gradient(to top, rgba(var(--wm-navy-rgb), 0.85) 0%, rgba(var(--wm-navy-rgb), 0.45) 40%, rgba(var(--wm-primary-rgb), 0.08) 70%, transparent 100%)',
                    }}
                  />

                  {/* Hover border glow */}
                  <div
                    className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      boxShadow: 'inset 0 0 0 1.5px rgba(var(--wm-primary-rgb), 0.4), 0 0 30px rgba(var(--wm-primary-rgb), 0.12)',
                    }}
                  />

                  {/* Frosted glass icon pill — top-left */}
                  <div
                    className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                    style={{
                      background: 'var(--wm-glass)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid var(--wm-glass-border)',
                    }}
                  >
                    <Icon
                      className="h-3.5 w-3.5"
                      style={{ color: 'var(--wm-primary)' }}
                    />
                    <span
                      className="text-xs font-semibold"
                      style={{ color: 'var(--wm-navy)', fontFamily: 'var(--wm-font-display)' }}
                    >
                      {item.title}
                    </span>
                  </div>

                  {/* Bottom content */}
                  <div className="absolute bottom-0 left-0 right-0 z-10 p-5">
                    <h3
                      className="font-extrabold leading-tight text-white"
                      style={{
                        fontFamily: 'var(--wm-font-display)',
                        fontSize: isFeatured ? 'clamp(1.75rem, 3vw, 2.5rem)' : 'clamp(1.25rem, 2vw, 1.75rem)',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {item.title}
                    </h3>
                    <div className="mt-2 flex items-center justify-between">
                      <p
                        className="text-sm leading-snug"
                        style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                      >
                        {item.description}
                      </p>
                      {/* Arrow indicator */}
                      <span className="ml-3 flex-shrink-0 inline-flex items-center justify-center rounded-full h-8 w-8 transition-all duration-300 group-hover:translate-x-1"
                        style={{
                          background: 'rgba(255, 255, 255, 0.15)',
                          backdropFilter: 'blur(8px)',
                        }}
                      >
                        <ArrowRight className="h-4 w-4 text-white transition-transform duration-300 group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
