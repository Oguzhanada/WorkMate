'use client';

import { motion } from 'framer-motion';
import { FileText, MessageSquare, CreditCard, ShieldCheck, BadgeCheck, Euro } from 'lucide-react';

const steps = [
  {
    num: '01',
    title: 'Post Your Job',
    description: 'Describe what you need, set a budget, pick your county. Takes under 2 minutes.',
    icon: FileText,
    accent: 'var(--wm-primary)',
    lightBg: 'var(--wm-primary-faint)',
  },
  {
    num: '02',
    title: 'Get Verified Offers',
    description: 'Insured pros send competitive quotes. Compare ratings, prices, and reviews side by side.',
    icon: MessageSquare,
    accent: 'var(--wm-blue)',
    lightBg: 'var(--wm-blue-soft)',
  },
  {
    num: '03',
    title: 'Pay When Satisfied',
    description: 'Stripe holds your payment securely. Released only when you confirm the work is done.',
    icon: CreditCard,
    accent: 'var(--wm-amber-dark)',
    lightBg: 'var(--wm-amber-light)',
  },
];

const trustPills = [
  { icon: ShieldCheck, label: 'Garda vetted' },
  { icon: BadgeCheck, label: 'Admin approved' },
  { icon: Euro, label: 'Transparent pricing' },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden px-5 py-28 sm:px-8 lg:px-12"
      style={{
        background: 'linear-gradient(180deg, var(--wm-bg) 0%, rgba(240,253,244,0.4) 50%, var(--wm-bg) 100%)',
      }}
    >
      <div className="mx-auto max-w-7xl">
        {/* Header — centered */}
        <motion.div
          className="mb-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <span
            className="text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: 'var(--wm-primary-dark)', fontFamily: 'var(--wm-font-display)' }}
          >
            How it works
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
            Three steps to done.
          </h2>
          <p
            className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold"
            style={{
              background: 'rgba(var(--wm-primary-rgb), 0.08)',
              color: 'var(--wm-primary-dark)',
              border: '1px solid rgba(var(--wm-primary-rgb), 0.15)',
            }}
          >
            <Euro className="h-4 w-4" />
            Free for customers · Providers pay only when hired
          </p>
        </motion.div>

        {/* Steps — horizontal cards with connecting line */}
        <div className="relative">
          {/* Connector line — desktop */}
          <div
            className="pointer-events-none absolute top-16 hidden h-[2px] md:block"
            style={{
              left: 'calc(16.67% + 24px)',
              right: 'calc(16.67% + 24px)',
              background: 'linear-gradient(90deg, var(--wm-primary), var(--wm-blue), var(--wm-amber))',
              opacity: 0.2,
            }}
          />

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <motion.article
                key={step.num}
                initial={{ opacity: 0, y: 40, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="group relative"
              >
                {/* Step number circle */}
                <div className="relative z-10 mb-6 inline-flex">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-black"
                    style={{
                      fontFamily: 'var(--wm-font-display)',
                      background: 'var(--wm-surface)',
                      border: `2px solid ${step.accent}`,
                      color: step.accent,
                      boxShadow: `0 0 0 6px rgba(255,255,255,1), 0 4px 20px rgba(0,0,0,0.06)`,
                    }}
                  >
                    {step.num}
                  </div>
                </div>

                {/* Card body */}
                <div
                  className="rounded-2xl p-6 transition-all duration-300"
                  style={{
                    background: 'var(--wm-surface)',
                    border: '1px solid var(--wm-border)',
                    boxShadow: 'var(--wm-shadow-sm)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = step.accent;
                    e.currentTarget.style.boxShadow = `0 20px 50px rgba(0,0,0,0.06), 0 0 0 1px ${step.accent}20`;
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--wm-border)';
                    e.currentTarget.style.boxShadow = 'var(--wm-shadow-sm)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Icon */}
                  <div
                    className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: step.lightBg, color: step.accent }}
                  >
                    <step.icon className="h-5 w-5" />
                  </div>

                  <h3
                    className="text-lg font-bold"
                    style={{
                      fontFamily: 'var(--wm-font-display)',
                      color: 'var(--wm-navy)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {step.title}
                  </h3>

                  <p
                    className="mt-2.5 text-sm leading-relaxed"
                    style={{ color: 'var(--wm-muted)' }}
                  >
                    {step.description}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>

        {/* Trust pills — below steps */}
        <motion.div
          className="mt-14 flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {trustPills.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
              style={{
                background: 'var(--wm-primary-faint)',
                color: 'var(--wm-primary-dark)',
                border: '1px solid rgba(var(--wm-primary-rgb), 0.15)',
              }}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
