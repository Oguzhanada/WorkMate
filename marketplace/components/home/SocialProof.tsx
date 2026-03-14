'use client';

import { motion } from 'framer-motion';
import { Briefcase, ShieldCheck, CreditCard, MapPin, Clock, CheckCircle } from 'lucide-react';

const highlights = [
  {
    icon: Briefcase,
    title: 'Post a job, get offers fast',
    description:
      'Post a job and get offers from verified pros within hours. Compare pricing, reviews, and availability before choosing.',
    accent: 'var(--wm-primary)',
    lightBg: 'rgba(var(--wm-primary-rgb), 0.1)',
  },
  {
    icon: CreditCard,
    title: 'Payment held until you approve',
    description:
      'Stripe holds your payment until you confirm the work is done. You stay in control from start to finish.',
    accent: 'var(--wm-primary)',
    lightBg: 'rgba(var(--wm-primary-rgb), 0.1)',
  },
  {
    icon: ShieldCheck,
    title: 'Every pro is compliance-checked',
    description:
      'Every provider is admin-reviewed — SafePass, insurance, and tax clearance documents checked before they go live.',
    accent: 'var(--wm-primary)',
    lightBg: 'rgba(var(--wm-primary-rgb), 0.1)',
  },
];

const badges = [
  { icon: MapPin, label: '26 counties covered' },
  { icon: Clock, label: 'Offers within hours' },
  { icon: CheckCircle, label: 'Free to post a job' },
];

export default function SocialProof() {
  return (
    <section
      className="relative overflow-hidden px-5 py-28 sm:px-8 lg:px-12"
      style={{
        background: 'linear-gradient(160deg, var(--wm-navy) 0%, #0c1a2e 50%, #0a2a29 100%)',
      }}
    >
      {/* Subtle dot grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.25) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 0.06,
        }}
      />

      {/* Glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: '70%',
          height: '70%',
          background: 'radial-gradient(ellipse, rgba(var(--wm-primary-rgb), 0.08) 0%, transparent 60%)',
          filter: 'blur(60px)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-14 max-w-2xl"
        >
          <span
            className="text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: 'var(--wm-primary-dark)' }}
          >
            How WorkMate works
          </span>
          <h2
            className="mt-3"
            style={{
              fontFamily: 'var(--wm-font-display)',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: 'white',
            }}
          >
            Built for trust,<br />designed for Ireland.
          </h2>
          <p
            className="mt-4 max-w-lg text-base leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            Every feature exists to protect you and make hiring a pro straightforward.
          </p>
        </motion.div>

        {/* Highlight cards — 3 columns */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="relative overflow-hidden rounded-2xl p-7"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              {/* Top accent */}
              <div
                className="absolute left-0 right-0 top-0 h-[2px]"
                style={{ background: item.accent, opacity: 0.4 }}
              />

              {/* Icon */}
              <div
                className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl"
                style={{
                  background: item.lightBg,
                  border: `1px solid rgba(var(--wm-primary-rgb), 0.2)`,
                }}
              >
                <item.icon className="h-5 w-5" style={{ color: item.accent }} />
              </div>

              <h3
                className="text-base font-bold"
                style={{
                  fontFamily: 'var(--wm-font-display)',
                  color: 'white',
                  letterSpacing: '-0.01em',
                }}
              >
                {item.title}
              </h3>

              <p
                className="mt-3 text-sm leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.55)' }}
              >
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Bottom badge row */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-6"
        >
          {badges.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 text-xs font-semibold"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              <Icon className="h-4 w-4" style={{ color: 'var(--wm-primary)', opacity: 0.7 }} />
              {label}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
