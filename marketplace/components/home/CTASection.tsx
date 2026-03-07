'use client';

import Link from 'next/link';
import {motion} from 'framer-motion';
import {usePathname} from 'next/navigation';
import {ArrowRight, Briefcase, Search, Hammer} from 'lucide-react';
import WorkMateLogo from '@/components/ui/WorkMateLogo';
import {getLocaleRoot, withLocalePrefix} from '@/lib/i18n/locale-path';

const highlights = [
  {icon: '🛠️', text: '1,000+ active professionals'},
  {icon: '📍', text: '26 counties covered'},
  {icon: '🔒', text: 'Stripe-protected payments'},
  {icon: '⚡', text: 'Avg. first offer in 2 hours'}
];

export default function CTASection() {
  const pathname = usePathname() || '/';
  const localeRoot = getLocaleRoot(pathname);

  return (
    <motion.section
      className="px-4 py-20 sm:px-6 lg:px-8"
      initial={{opacity: 0, y: 24}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true, amount: 0.25}}
      transition={{duration: 0.5, ease: 'easeOut'}}
    >
      <div className="mx-auto max-w-7xl">
        <div
          className="relative overflow-hidden rounded-3xl"
          style={{
            background: 'linear-gradient(145deg, var(--wm-navy) 0%, var(--wm-navy-mid) 50%, #1a3d6e 100%)'
          }}
        >
          {/* Geometric background decorations */}
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full opacity-[0.07]"
            style={{background: 'radial-gradient(circle, var(--wm-primary), transparent 70%)'}}
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-16 h-72 w-72 rounded-full opacity-[0.07]"
            style={{background: 'radial-gradient(circle, var(--wm-amber), transparent 70%)'}}
          />
          {/* Teal top accent */}
          <div
            className="absolute left-0 right-0 top-0 h-0.5"
            style={{background: 'linear-gradient(to right, var(--wm-primary), var(--wm-amber), transparent 70%)'}}
          />
          {/* Subtle grid pattern */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '48px 48px'
            }}
          />

          <div className="relative z-10 p-8 sm:p-12 lg:p-16">
            {/* Logo + brand */}
            <div className="mb-8 flex items-center gap-3">
              <WorkMateLogo size={40} />
              <span
                className="text-xl font-bold text-white/90"
                style={{fontFamily: 'var(--wm-font-display)'}}
              >
                WorkMate
              </span>
            </div>

            <div className="lg:grid lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16">
              <div>
                <h2
                  className="wm-display text-white"
                  style={{fontSize: 'clamp(1.9rem, 4.5vw, 3.2rem)', letterSpacing: '-0.03em'}}
                >
                  Ready to Get Things Done?
                </h2>
                <p className="mt-4 max-w-xl text-lg text-white/70">
                  Join thousands of Irish homeowners who stopped searching and started getting results.
                </p>

                {/* Tags */}
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {['Built for Ireland', 'Transparent pricing', 'Verified pros only'].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full px-3 py-1 text-xs font-semibold text-white/80"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.10)',
                        border: '1px solid rgba(255,255,255,0.12)'
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="mt-8 flex flex-wrap gap-3">
                  <motion.div whileHover={{scale: 1.04, y: -1}} whileTap={{scale: 0.97}}>
                    <Link
                      href={withLocalePrefix(localeRoot, '/post-job')}
                      className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold"
                      style={{
                        backgroundColor: 'white',
                        color: 'var(--wm-navy)',
                        fontFamily: 'var(--wm-font-display)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.20)'
                      }}
                    >
                      <Briefcase className="h-4 w-4" />
                      Post a Job — it&apos;s free
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{scale: 1.04, y: -1}} whileTap={{scale: 0.97}}>
                    <Link
                      href={withLocalePrefix(localeRoot, '/search')}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/10"
                      style={{fontFamily: 'var(--wm-font-display)'}}
                    >
                      <Search className="h-4 w-4" />
                      Browse Services
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{scale: 1.04, y: -1}} whileTap={{scale: 0.97}}>
                    <Link
                      href={withLocalePrefix(localeRoot, '/become-provider')}
                      className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white"
                      style={{
                        backgroundColor: 'var(--wm-primary)',
                        fontFamily: 'var(--wm-font-display)',
                        boxShadow: '0 4px 16px rgba(0,184,148,0.35)'
                      }}
                    >
                      <Hammer className="h-4 w-4" />
                      Become a Pro
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </motion.div>
                </div>
              </div>

              {/* Highlights grid — desktop right col */}
              <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:mt-0 lg:grid-cols-1 lg:min-w-[200px]">
                {highlights.map((item) => (
                  <div
                    key={item.text}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/80"
                    style={{backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)'}}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
