'use client';

import { motion } from 'framer-motion';
import { BadgeCheck, Euro, FileCheck2, Headphones, MapPin, ShieldCheck } from 'lucide-react';
import { sectionRevealVariants } from '@/styles/animations';

const trustItems = [
  {
    icon: BadgeCheck,
    title: 'Verified professionals',
    description: 'Document review before activation with status tracking for each provider.',
    accent: 'var(--wm-primary)',
    bg: 'var(--wm-primary-faint)',
  },
  {
    icon: ShieldCheck,
    title: 'Safer transactions',
    description: 'Platform-based flows reduce off-platform risk and improve dispute evidence quality.',
    accent: 'var(--wm-blue)',
    bg: 'var(--wm-blue-soft)',
  },
  {
    icon: Euro,
    title: 'Clear pricing',
    description: 'Compare offers with explicit details so cost and scope are visible before acceptance.',
    accent: 'var(--wm-amber-dark)',
    bg: 'var(--wm-amber-light)',
  },
  {
    icon: MapPin,
    title: 'Ireland focused',
    description: 'County-first matching and local compliance assumptions built into workflows.',
    accent: 'var(--wm-primary)',
    bg: 'var(--wm-primary-faint)',
  },
  {
    icon: FileCheck2,
    title: 'Reliable records',
    description: 'Quote, message, and review history stay linked to real job flows in one timeline.',
    accent: 'var(--wm-blue)',
    bg: 'var(--wm-blue-soft)',
  },
  {
    icon: Headphones,
    title: 'Support visibility',
    description: 'Structured support and status updates for verification, payments, and account issues.',
    accent: 'var(--wm-amber-dark)',
    bg: 'var(--wm-amber-light)',
  },
];

export default function TrustSection() {
  return (
    <section id="trust" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={sectionRevealVariants}
          className="mb-10"
        >
          <span className="wm-section-label">Trust and quality</span>
          <h2 className="mt-3 wm-display text-[clamp(1.7rem,3vw,2.4rem)]" style={{ color: 'var(--wm-navy)' }}>
            Built for confident hiring decisions
          </h2>
          <p className="mt-3 max-w-2xl text-base" style={{ color: 'var(--wm-muted)' }}>
            The platform is designed to make quality signals obvious before you commit to a provider.
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {trustItems.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.36, delay: index * 0.05, ease: 'easeOut' }}
              className="group rounded-2xl border bg-white p-5"
              style={{ borderColor: 'var(--wm-border)', boxShadow: 'var(--wm-shadow-sm)' }}
            >
              <div
                className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: item.bg }}
              >
                <item.icon className="h-5 w-5" style={{ color: item.accent }} />
              </div>
              <h3 className="text-base font-bold" style={{ color: 'var(--wm-navy)' }}>
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--wm-muted)' }}>
                {item.description}
              </p>
            </motion.article>
          ))}
        </div>

        <div
          className="mt-6 rounded-2xl border p-4"
          style={{
            borderColor: 'rgba(16,185,129,0.24)',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.10) 0%, rgba(255,255,255,0.96) 100%)',
            boxShadow: 'var(--wm-shadow-xs)',
          }}
        >
          <p className="text-sm font-bold" style={{ color: 'var(--wm-primary-dark)' }}>
            Happiness Pledge
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--wm-text-soft)' }}>
            If you are not satisfied, request a resolution review within 7 days and our team will assess refund options based on evidence.
          </p>
        </div>
      </div>
    </section>
  );
}
