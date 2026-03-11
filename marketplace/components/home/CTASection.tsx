'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ArrowRight, Star, Quote } from 'lucide-react';
import { getLocaleRoot, withLocalePrefix } from '@/lib/i18n/locale-path';

export default function CTASection() {
  const pathname = usePathname() || '/';
  const localeRoot = getLocaleRoot(pathname);

  return (
    <section className="px-5 py-8 pb-20 sm:px-8 lg:px-12" style={{ background: 'var(--wm-bg)' }}>
      <div
        className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] px-8 py-20 sm:px-16 sm:py-28"
        style={{
          background: 'linear-gradient(155deg, var(--wm-navy) 0%, #0c1a2e 50%, #0a2a29 100%)',
        }}
      >
        {/* Grid pattern */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        {/* Glow orb */}
        <div
          className="pointer-events-none absolute -right-20 -top-20"
          style={{
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(var(--wm-primary-rgb), 0.15) 0%, transparent 60%)',
            filter: 'blur(80px)',
          }}
        />

        <div className="relative z-10 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2
              style={{
                fontFamily: 'var(--wm-font-display)',
                fontSize: 'clamp(2.4rem, 6vw, 4rem)',
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: '-0.03em',
              }}
            >
              <span style={{ color: 'white' }}>Ready to get</span>
              <br />
              <span
                style={{
                  background: 'linear-gradient(135deg, var(--wm-primary) 0%, #34d399 50%, var(--wm-amber) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                things done?
              </span>
            </h2>

            <p
              className="mt-5 max-w-md text-base leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              Irish homeowners who stopped searching and started getting results on WorkMate.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Link
              href={withLocalePrefix(localeRoot, '/post-job')}
              className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-bold transition-transform hover:scale-[1.03] active:scale-95"
              style={{
                background: 'white',
                color: 'var(--wm-navy)',
                fontFamily: 'var(--wm-font-display)',
                boxShadow: '0 8px 32px rgba(255,255,255,0.12)',
              }}
            >
              Post a Job — Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={withLocalePrefix(localeRoot, '/become-provider')}
              className="inline-flex items-center gap-2 rounded-full px-7 py-4 text-sm font-semibold"
              style={{
                color: 'white',
                background: 'var(--wm-grad-primary)',
                boxShadow: '0 8px 30px rgba(var(--wm-primary-rgb), 0.3)',
                fontFamily: 'var(--wm-font-display)',
              }}
            >
              Become a Pro
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          {/* Mini testimonial — social proof in CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex items-start gap-3 rounded-xl p-4"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              maxWidth: '420px',
            }}
          >
            <Quote className="h-5 w-5 shrink-0 rotate-180" style={{ color: 'var(--wm-primary)', opacity: 0.6 }} />
            <div>
              <p className="text-sm italic leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Post a job, receive offers from verified pros, and pay securely — all through one platform.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-3 w-3 fill-current" style={{ color: 'var(--wm-amber)' }} />
                  ))}
                </div>
                <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  How WorkMate works
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
