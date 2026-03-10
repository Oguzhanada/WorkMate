'use client';

import Link from 'next/link';
import { Search, MapPin, ArrowRight, Shield, CheckCircle, CreditCard, ShieldCheck, UserCheck } from 'lucide-react';
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
  { icon: MapPin, label: '26 Counties' },
  { icon: CreditCard, label: 'Stripe Secure Payments' },
  { icon: ShieldCheck, label: 'Garda Vetted Pros' },
  { icon: UserCheck, label: 'Admin Verified' },
];

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
    router.push(withLocalePrefix(localeRoot, `/find-services?${params.toString()}`));
  };

  return (
    <section
      className="relative overflow-hidden"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(165deg, var(--wm-navy) 0%, #0c1a2e 45%, #0a2a29 100%)',
      }}
    >
      {/* Grain overlay */}
      <div className="wm-grain pointer-events-none absolute inset-0" style={{ opacity: 0.4 }} />

      {/* Mesh gradient orbs */}
      <div
        className="pointer-events-none absolute"
        style={{
          width: '800px',
          height: '800px',
          top: '-20%',
          right: '-15%',
          background: 'radial-gradient(circle, rgba(var(--wm-primary-rgb), 0.12) 0%, transparent 60%)',
          filter: 'blur(80px)',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute"
        style={{
          width: '600px',
          height: '600px',
          bottom: '-10%',
          left: '-10%',
          background: 'radial-gradient(circle, rgba(var(--wm-primary-rgb), 0.08) 0%, transparent 60%)',
          filter: 'blur(60px)',
        }}
        aria-hidden="true"
      />

      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
        aria-hidden="true"
      />

      {/* Top accent line */}
      <div
        className="absolute left-0 right-0 top-0 h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent 10%, var(--wm-primary) 50%, transparent 90%)',
          opacity: 0.6,
        }}
      />

      {/* Main content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-5 pb-20 pt-28 sm:px-8 lg:px-12">
        {/* Pill badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <span
            className="inline-flex items-center gap-2.5 rounded-full px-4 py-1.5"
            style={{
              background: 'rgba(var(--wm-primary-rgb), 0.12)',
              border: '1px solid rgba(var(--wm-primary-rgb), 0.25)',
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: 'var(--wm-primary)', boxShadow: '0 0 8px var(--wm-primary)' }}
            />
            <span
              className="text-xs font-semibold uppercase tracking-[0.15em]"
              style={{ color: 'var(--wm-primary-dark)' }}
            >
              Ireland&apos;s Home Services Platform
            </span>
          </span>
        </motion.div>

        {/* Headline — editorial scale */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontFamily: 'var(--wm-font-display)',
            fontWeight: 800,
            fontSize: 'clamp(3.2rem, 9vw, 7.5rem)',
            lineHeight: 0.92,
            letterSpacing: '-0.04em',
            marginTop: '2rem',
          }}
        >
          <span style={{ color: 'white' }}>Find your</span>
          <br />
          <span
            style={{
              background: 'linear-gradient(135deg, var(--wm-primary) 0%, #34d399 50%, var(--wm-amber) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            perfect pro.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-6 max-w-xl"
          style={{
            fontSize: 'clamp(1.05rem, 2vw, 1.3rem)',
            color: 'rgba(255,255,255,0.6)',
            lineHeight: 1.65,
            letterSpacing: '-0.01em',
          }}
        >
          Verified tradespeople across all 26 counties. Post a job, get offers within hours,
          pay securely through Stripe — only when you&apos;re satisfied.
        </motion.p>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-10 max-w-2xl"
        >
          <div
            className="flex flex-col gap-2 rounded-2xl p-2 sm:flex-row sm:items-center"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            <label className="flex flex-1 items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <Search className="h-4 w-4 shrink-0" style={{ color: 'var(--wm-primary)' }} />
              <input
                value={serviceQuery}
                onChange={(e) => setServiceQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onSearch(); } }}
                placeholder="What do you need done?"
                className="w-full border-none bg-transparent text-sm font-medium outline-none placeholder:text-white/30"
                style={{ color: 'white', fontFamily: 'var(--wm-font-sans)' }}
              />
            </label>

            <label className="flex items-center gap-3 rounded-xl px-4 py-3 sm:w-48" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <MapPin className="h-4 w-4 shrink-0" style={{ color: 'var(--wm-primary)' }} />
              <select
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                className="w-full border-none bg-transparent text-sm font-medium outline-none"
                style={{ color: 'white', fontFamily: 'var(--wm-font-sans)' }}
                aria-label="Select county"
              >
                {counties.map((c) => (
                  <option key={c} value={c} style={{ color: 'var(--wm-navy)' }}>{c}</option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={onSearch}
              className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-transform active:scale-95"
              style={{
                background: 'var(--wm-grad-primary)',
                boxShadow: '0 8px 30px rgba(var(--wm-primary-rgb), 0.35)',
              }}
            >
              Search
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

        {/* Micro trust line — Eleken-inspired credibility strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.75 }}
          className="mt-6 flex flex-wrap items-center gap-5"
        >
          {[
            { icon: CheckCircle, text: 'Verified Irish Pros' },
            { icon: CreditCard, text: 'Secure Stripe Payments' },
            { icon: Shield, text: 'Free to Post' },
          ].map(({ icon: Icon, text }) => (
            <span
              key={text}
              className="inline-flex items-center gap-1.5 text-xs font-medium"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color: 'var(--wm-primary)', opacity: 0.8 }} />
              {text}
            </span>
          ))}
        </motion.div>

        {/* CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-6 flex flex-wrap items-center gap-4"
        >
          <Link
            href={withLocalePrefix(localeRoot, '/post-job')}
            className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold transition-transform hover:scale-[1.02] active:scale-95"
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
            className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold transition-colors"
            style={{
              color: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(255,255,255,0.15)',
              fontFamily: 'var(--wm-font-display)',
            }}
          >
            Become a Pro
          </Link>
        </motion.div>

        {/* Trust badges — bottom of hero */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="mt-auto flex flex-wrap items-center gap-3 pt-16 sm:gap-4"
        >
          {trustBadges.map(({ icon: Icon, label }, i) => (
            <motion.span
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.2 + i * 0.1 }}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
              style={{
                background: 'rgba(var(--wm-primary-rgb), 0.08)',
                border: '1px solid rgba(var(--wm-primary-rgb), 0.2)',
                color: 'rgba(255,255,255,0.8)',
              }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color: 'var(--wm-primary)' }} />
              {label}
            </motion.span>
          ))}
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-32"
        style={{ background: 'linear-gradient(to top, var(--wm-bg), transparent)' }}
      />
    </section>
  );
}
