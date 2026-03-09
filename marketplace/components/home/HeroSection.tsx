'use client';

import Link from 'next/link';
import { Search, MapPin, ShieldCheck, Star, Map, CreditCard } from 'lucide-react';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getLocaleRoot, withLocalePrefix } from '@/lib/i18n/locale-path';
import { motion } from 'framer-motion';

const counties = [
  'Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway',
  'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick',
  'Longford', 'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly',
  'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath',
  'Wexford', 'Wicklow',
];

const trustBadges = [
  { icon: ShieldCheck, label: '500+ Verified Pros' },
  { icon: Map, label: '26 Counties' },
  { icon: Star, label: '4.8\u2605 Rating' },
  { icon: CreditCard, label: 'Stripe Protected' },
];

const headlineVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const lineVariants = {
  hidden: { opacity: 0, y: 32, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const slideUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 80, damping: 18, mass: 1 },
  },
};

const badgeContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.9 },
  },
};

const badgeItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function HeroSection() {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const localeRoot = getLocaleRoot(pathname);

  const [serviceQuery, setServiceQuery] = useState('');
  const [county, setCounty] = useState('Dublin');

  const onSearch = () => {
    const params = new URLSearchParams();
    if (serviceQuery.trim()) params.set('q', serviceQuery.trim());
    if (county) params.set('county', county);
    router.push(withLocalePrefix(localeRoot, `/search?${params.toString()}`));
  };

  return (
    <section className="wm-hero-bg wm-grain relative overflow-hidden px-4 pb-24 pt-20 sm:px-6 sm:pb-32 sm:pt-28 lg:px-8 lg:pb-36 lg:pt-32">
      {/* Celtic knot decorative background */}
      <div className="wm-celtic-deco wm-float" aria-hidden="true" />

      {/* Subtle radial glow */}
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2 pointer-events-none"
        style={{
          width: '900px',
          height: '500px',
          background: 'radial-gradient(ellipse at center, rgba(var(--wm-primary-rgb), 0.06) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-5xl text-center">
        {/* Section pill */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <span className="wm-section-label mb-8 inline-block">
            Ireland&apos;s Home Services Platform
          </span>
        </motion.div>

        {/* Headline — massive staggered reveal */}
        <motion.h1
          className="wm-display mx-auto max-w-5xl"
          style={{
            fontSize: 'clamp(3rem, 8vw, 6.5rem)',
            lineHeight: 1,
            letterSpacing: '-0.04em',
            color: 'var(--wm-navy)',
          }}
          variants={headlineVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.span className="block" variants={lineVariants}>
            Ireland&apos;s Most Trusted
          </motion.span>
          <motion.span className="wm-text-gradient block" variants={lineVariants}>
            Home Services
          </motion.span>
          <motion.span className="block" variants={lineVariants}>
            Marketplace
          </motion.span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="mx-auto mt-8 max-w-2xl leading-relaxed"
          style={{
            fontSize: 'clamp(1.05rem, 2.2vw, 1.4rem)',
            color: 'var(--wm-muted)',
            letterSpacing: '-0.01em',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
        >
          Connect with verified professionals across all 26 counties.
          <br className="hidden sm:block" />
          Quality work, fair prices, complete peace of mind.
        </motion.p>

        {/* Search bar — floating glass pill */}
        <motion.div
          className="wm-search-glass mx-auto mt-12 max-w-3xl p-2 sm:p-2.5"
          variants={slideUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.65 }}
        >
          <div className="grid gap-2 sm:grid-cols-[1fr_200px_auto] md:grid-cols-[1fr_240px_auto]">
            <label
              className="flex items-center gap-3 rounded-full px-5 py-3.5 text-left transition"
              style={{
                background: 'rgba(255,255,255,0.7)',
                border: '1px solid var(--wm-border-soft)',
              }}
            >
              <Search className="h-4 w-4 shrink-0" style={{ color: 'var(--wm-primary)' }} />
              <input
                value={serviceQuery}
                onChange={(event) => setServiceQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    onSearch();
                  }
                }}
                placeholder="What service do you need?"
                className="w-full border-none bg-transparent text-sm outline-none placeholder:opacity-50"
                style={{ color: 'var(--wm-text-default)', fontFamily: 'var(--wm-font-sans)' }}
              />
            </label>

            <label
              className="flex items-center gap-3 rounded-full px-5 py-3.5 text-left transition"
              style={{
                background: 'rgba(255,255,255,0.7)',
                border: '1px solid var(--wm-border-soft)',
              }}
            >
              <MapPin className="h-4 w-4 shrink-0" style={{ color: 'var(--wm-primary)' }} />
              <select
                value={county}
                onChange={(event) => setCounty(event.target.value)}
                className="w-full border-none bg-transparent text-sm outline-none"
                style={{ color: 'var(--wm-text-default)', fontFamily: 'var(--wm-font-sans)' }}
                aria-label="Select county"
              >
                {counties.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={onSearch}
              className="wm-btn-glow rounded-full px-8 py-3.5 text-sm font-bold text-white"
            >
              Search
            </button>
          </div>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-8"
          variants={badgeContainer}
          initial="hidden"
          animate="visible"
        >
          {trustBadges.map(({ icon: Icon, label }) => (
            <motion.div
              key={label}
              className="flex items-center gap-2"
              variants={badgeItem}
            >
              <Icon
                className="h-4 w-4"
                style={{ color: 'var(--wm-primary)' }}
                aria-hidden="true"
              />
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--wm-muted)', letterSpacing: '-0.01em' }}
              >
                {label}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA buttons — asymmetric sizing */}
        <motion.div
          className="mt-12 flex flex-wrap items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
        >
          <Link
            href={withLocalePrefix(localeRoot, '/post-job')}
            className="wm-btn-glow inline-flex items-center justify-center rounded-full px-10 py-4 text-base font-bold text-white"
            style={{ fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)' }}
          >
            Post a Job
          </Link>
          <Link
            href={withLocalePrefix(localeRoot, '/become-provider')}
            className="inline-flex items-center justify-center rounded-full px-8 py-3.5 text-sm font-semibold transition"
            style={{
              border: '1.5px solid var(--wm-border)',
              background: 'var(--wm-surface)',
              color: 'var(--wm-text-default)',
              fontFamily: 'var(--wm-font-display)',
              letterSpacing: '-0.01em',
              boxShadow: 'var(--wm-shadow-sm)',
            }}
            onMouseEnter={(e) => {
              const t = e.currentTarget;
              t.style.borderColor = 'var(--wm-primary)';
              t.style.color = 'var(--wm-primary-dark)';
              t.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              const t = e.currentTarget;
              t.style.borderColor = 'var(--wm-border)';
              t.style.color = 'var(--wm-text-default)';
              t.style.transform = 'translateY(0)';
            }}
          >
            Become a Pro
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
