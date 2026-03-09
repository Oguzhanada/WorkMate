'use client';

import Link from 'next/link';
import {motion} from 'framer-motion';
import {usePathname} from 'next/navigation';
import {ArrowRight, Briefcase, Search, Hammer} from 'lucide-react';
import WorkMateLogo from '@/components/ui/WorkMateLogo';
import {getLocaleRoot, withLocalePrefix} from '@/lib/i18n/locale-path';

const trustBadges = ['Built for Ireland', 'Transparent pricing', 'Verified pros only'];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {staggerChildren: 0.12, delayChildren: 0.1}
  }
};

const fadeUp = {
  hidden: {opacity: 0, y: 30},
  visible: {opacity: 1, y: 0, transition: {duration: 0.6, ease: 'easeOut' as const}}
};

const slideRight = {
  hidden: {opacity: 0, x: 40},
  visible: {opacity: 1, x: 0, transition: {duration: 0.5, ease: 'easeOut' as const}}
};

const fadeIn = {
  hidden: {opacity: 0},
  visible: {opacity: 1, transition: {duration: 0.5, ease: 'easeOut' as const}}
};

export default function CTASection() {
  const pathname = usePathname() || '/';
  const localeRoot = getLocaleRoot(pathname);

  return (
    <section
      className="relative overflow-hidden py-24 sm:py-32"
      style={{
        background:
          'linear-gradient(155deg, var(--wm-navy) 0%, rgba(15,23,42,0.98) 40%, rgba(8,47,46,0.95) 100%)'
      }}
    >
      {/* Topographic contour pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            repeating-radial-gradient(circle at 20% 50%, transparent 0, transparent 40px, rgba(255,255,255,0.5) 40px, rgba(255,255,255,0.5) 41px, transparent 41px, transparent 80px),
            repeating-radial-gradient(circle at 80% 30%, transparent 0, transparent 60px, rgba(255,255,255,0.4) 60px, rgba(255,255,255,0.4) 61px, transparent 61px, transparent 120px),
            repeating-radial-gradient(circle at 50% 80%, transparent 0, transparent 50px, rgba(255,255,255,0.3) 50px, rgba(255,255,255,0.3) 51px, transparent 51px, transparent 100px)
          `
        }}
      />

      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '56px 56px'
        }}
      />

      {/* Large decorative circle — top right */}
      <motion.div
        className="pointer-events-none absolute -right-32 -top-32 rounded-full"
        style={{
          width: 500,
          height: 500,
          background: 'radial-gradient(circle, rgba(var(--wm-primary-rgb), 0.1) 0%, transparent 70%)',
          border: '1px solid rgba(var(--wm-primary-rgb), 0.06)'
        }}
        animate={{scale: [1, 1.05, 1], rotate: [0, 5, 0]}}
        transition={{duration: 16, repeat: Infinity, ease: 'easeInOut'}}
      />

      {/* WorkMate logo watermark */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.025]"
        style={{transform: 'translate(-50%, -50%) scale(4)'}}
      >
        <WorkMateLogo size={120} />
      </div>

      {/* Top accent line */}
      <div
        className="absolute left-0 right-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(to right, transparent, rgba(var(--wm-primary-rgb), 0.4), rgba(var(--wm-primary-rgb), 0.1), transparent)'
        }}
      />

      <motion.div
        className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{once: true, amount: 0.2}}
      >
        {/* Asymmetric layout: 70/30 */}
        <div className="lg:grid lg:grid-cols-[1fr_340px] lg:items-center lg:gap-16">
          {/* Left: Heading area */}
          <div>
            <motion.div variants={fadeUp}>
              <h2
                style={{
                  fontFamily: 'var(--wm-font-display)',
                  fontSize: 'clamp(2.4rem, 6vw, 4.2rem)',
                  fontWeight: 800,
                  lineHeight: 1.05,
                  letterSpacing: '-0.03em'
                }}
              >
                <span style={{color: 'white'}}>Ready to Get</span>
                <br />
                <span
                  style={{
                    background: 'linear-gradient(135deg, var(--wm-primary) 0%, var(--wm-amber) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  Things Done?
                </span>
              </h2>
            </motion.div>

            <motion.p
              variants={fadeUp}
              className="mt-5 max-w-lg text-lg leading-relaxed"
              style={{color: 'rgba(255,255,255,0.7)'}}
            >
              Join thousands of Irish homeowners who stopped searching and started getting results.
            </motion.p>

            {/* Trust badges */}
            <motion.div
              variants={fadeIn}
              className="mt-8 flex flex-wrap items-center gap-2.5"
            >
              {trustBadges.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-semibold"
                  style={{
                    color: 'rgba(255,255,255,0.85)',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)'
                  }}
                >
                  {badge}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right: Stacked CTA buttons */}
          <div className="mt-12 flex flex-col gap-3.5 lg:mt-0">
            {/* Primary CTA */}
            <motion.div variants={slideRight}>
              <motion.div whileHover={{scale: 1.03, y: -2}} whileTap={{scale: 0.97}}>
                <Link
                  href={withLocalePrefix(localeRoot, '/post-job')}
                  className="flex w-full items-center justify-center gap-2.5 rounded-2xl px-7 py-4 text-base font-bold"
                  style={{
                    backgroundColor: 'white',
                    color: 'var(--wm-navy)',
                    fontFamily: 'var(--wm-font-display)',
                    boxShadow:
                      '0 8px 32px rgba(255,255,255,0.15), 0 0 60px rgba(255,255,255,0.06)'
                  }}
                >
                  <Briefcase className="h-5 w-5" />
                  Post a Job — it&apos;s free
                </Link>
              </motion.div>
            </motion.div>

            {/* Secondary CTA */}
            <motion.div variants={slideRight}>
              <motion.div whileHover={{scale: 1.03, y: -2}} whileTap={{scale: 0.97}}>
                <Link
                  href={withLocalePrefix(localeRoot, '/search')}
                  className="flex w-full items-center justify-center gap-2.5 rounded-2xl px-7 py-4 text-base font-semibold transition-colors duration-300"
                  style={{
                    color: 'white',
                    fontFamily: 'var(--wm-font-display)',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
                  }}
                >
                  <Search className="h-5 w-5" />
                  Browse Services
                </Link>
              </motion.div>
            </motion.div>

            {/* Tertiary CTA */}
            <motion.div variants={slideRight}>
              <motion.div whileHover={{scale: 1.03, y: -2}} whileTap={{scale: 0.97}}>
                <Link
                  href={withLocalePrefix(localeRoot, '/become-provider')}
                  className="flex w-full items-center justify-center gap-2.5 rounded-2xl px-7 py-4 text-base font-bold text-white"
                  style={{
                    fontFamily: 'var(--wm-font-display)',
                    background:
                      'linear-gradient(135deg, var(--wm-primary) 0%, var(--wm-primary-dark) 100%)',
                    boxShadow: '0 8px 32px rgba(var(--wm-primary-rgb), 0.3)'
                  }}
                >
                  <Hammer className="h-5 w-5" />
                  Become a Pro
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
