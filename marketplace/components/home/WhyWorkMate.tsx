'use client';

import { motion } from 'framer-motion';
import { Lock, ShieldCheck, UserCheck, RefreshCw, Star, MapPin } from 'lucide-react';

const features = [
  {
    icon: Lock,
    problem: 'Worried about paying upfront?',
    title: 'Secure Payment Hold',
    description: 'Stripe holds funds until you confirm work is complete. Payment protection built in.',
    accent: 'var(--wm-primary)',
    lightBg: 'var(--wm-primary-faint)',
  },
  {
    icon: ShieldCheck,
    problem: 'How do you know they\'re legit?',
    title: 'Irish Compliance Stack',
    description: 'SafePass, Public Liability Insurance, Tax Clearance — all verified.',
    accent: 'var(--wm-blue)',
    lightBg: 'var(--wm-blue-soft)',
  },
  {
    icon: UserCheck,
    problem: 'Tired of unreliable tradespeople?',
    title: 'Admin-Approved Pros',
    description: 'Every provider manually reviewed before going live. No auto-approvals.',
    accent: 'var(--wm-primary)',
    lightBg: 'var(--wm-primary-faint)',
  },
  {
    icon: RefreshCw,
    problem: 'Fees eating into every booking?',
    title: 'Repeat Booking Discount',
    description: '3% fee when you rebook the same provider (1.5% for Pro). Loyalty rewarded.',
    accent: 'var(--wm-amber-dark)',
    lightBg: 'var(--wm-amber-light)',
  },
  {
    icon: Star,
    problem: 'Overwhelmed choosing the right pro?',
    title: 'Smart Match Ranking',
    description: 'Offers ranked by price, rating, compliance score and response time.',
    accent: 'var(--wm-blue)',
    lightBg: 'var(--wm-blue-soft)',
  },
  {
    icon: MapPin,
    problem: 'Platforms that don\'t understand Ireland?',
    title: 'Built for Ireland',
    description: 'Eircode validation, EUR only, county-first matching across all 26 counties.',
    accent: 'var(--wm-amber-dark)',
    lightBg: 'var(--wm-amber-light)',
  },
];

export default function WhyWorkMate() {
  return (
    <section className="px-5 py-28 sm:px-8 lg:px-12" style={{ background: 'var(--wm-bg)' }}>
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          className="mb-16 max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <span
            className="text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: 'var(--wm-primary-dark)', fontFamily: 'var(--wm-font-display)' }}
          >
            The WorkMate difference
          </span>
          <h2
            className="mt-3"
            style={{
              fontFamily: 'var(--wm-font-display)',
              fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: 'var(--wm-navy)',
            }}
          >
            Frustrated finding<br />reliable tradespeople?
          </h2>
          <p
            className="mt-4 text-base leading-relaxed"
            style={{ color: 'var(--wm-muted)' }}
          >
            WorkMate solves every pain point. Admin-approved providers and Stripe secure hold as standard.
          </p>
        </motion.div>

        {/* Feature grid — 3x2 cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300"
              style={{
                background: 'var(--wm-surface)',
                border: '1px solid var(--wm-border)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = feature.accent;
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 20px 40px rgba(0,0,0,0.06)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--wm-border)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Top accent line */}
              <div
                className="absolute left-0 right-0 top-0 h-[2px]"
                style={{ background: feature.accent, opacity: 0.4 }}
              />

              {/* Icon */}
              <div
                className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl"
                style={{
                  background: feature.lightBg,
                  color: feature.accent,
                }}
              >
                <feature.icon className="h-5 w-5" />
              </div>

              {/* Problem line */}
              <p
                className="mb-2 text-xs font-semibold italic"
                style={{ color: 'var(--wm-muted)', opacity: 0.7 }}
              >
                {feature.problem}
              </p>

              <h3
                className="text-base font-bold"
                style={{
                  fontFamily: 'var(--wm-font-display)',
                  color: 'var(--wm-navy)',
                  letterSpacing: '-0.01em',
                }}
              >
                {feature.title}
              </h3>

              <p
                className="mt-2 text-sm leading-relaxed"
                style={{ color: 'var(--wm-muted)' }}
              >
                {feature.description}
              </p>
            </motion.article>
          ))}
        </div>

        {/* Happiness Pledge */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-8 rounded-2xl p-5"
          style={{
            background: 'linear-gradient(135deg, rgba(var(--wm-primary-rgb), 0.06) 0%, rgba(255,255,255,0.8) 100%)',
            border: '1px solid rgba(var(--wm-primary-rgb), 0.15)',
          }}
        >
          <p className="text-sm font-bold" style={{ color: 'var(--wm-primary-dark)' }}>
            Happiness Pledge
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--wm-muted)' }}>
            Not satisfied? Request a resolution review within 7 days and our team will assess refund options based on evidence.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
