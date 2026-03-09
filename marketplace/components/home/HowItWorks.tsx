'use client';

import { motion } from 'framer-motion';

const steps = [
  {
    num: '01',
    title: 'Describe Your Job',
    description: 'Tell us what you need done, set your budget, and choose your county. Takes less than 2 minutes.',
    highlight: '2 min setup',
    color: 'var(--wm-primary)',
    lightBg: 'var(--wm-primary-light)',
    glow: 'rgba(0,184,148,0.15)',
    accentBar: 'var(--wm-grad-primary)',
  },
  {
    num: '02',
    title: 'Receive Verified Offers',
    description: 'Insured, background-checked professionals send you competitive quotes. Compare and choose with confidence.',
    highlight: 'Avg. 3 offers in 2h',
    color: 'var(--wm-blue)',
    lightBg: 'var(--wm-blue-soft)',
    glow: 'rgba(26,86,219,0.12)',
    accentBar: 'linear-gradient(135deg, var(--wm-blue) 0%, var(--wm-blue-dark) 100%)',
  },
  {
    num: '03',
    title: 'Pay When Done',
    description: "Payment is held securely by Stripe and released only when you're satisfied. Zero risk, full control.",
    highlight: 'Stripe-protected',
    color: 'var(--wm-amber-dark)',
    lightBg: 'var(--wm-amber-light)',
    glow: 'rgba(245,158,11,0.12)',
    accentBar: 'var(--wm-grad-warm)',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: i * 0.15,
      ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
    },
  }),
};

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="px-4 py-24 sm:px-6 lg:px-8"
      style={{ background: 'linear-gradient(180deg, var(--wm-bg) 0%, rgba(255, 251, 235, 0.25) 50%, var(--wm-bg) 100%)' }}
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <span className="wm-section-label mb-3">How it works</span>
          <h2
            className="mt-4 wm-display"
            style={{ fontSize: 'clamp(1.7rem, 3.2vw, 2.4rem)', color: 'var(--wm-text-strong)' }}
          >
            Get It Done in 3 Simple Steps
          </h2>
          <p className="mt-3 max-w-lg text-base leading-relaxed" style={{ color: 'var(--wm-text-muted)' }}>
            From posting to payment — we handle the complexity so you can focus on the result.
          </p>
        </motion.div>

        <div className="relative grid gap-8 md:grid-cols-3">
          {/* SVG connector line — desktop only */}
          <svg
            className="pointer-events-none absolute hidden md:block"
            style={{ top: '3.5rem', left: '16.67%', right: '16.67%', width: '66.66%', height: '2px', overflow: 'visible' }}
            preserveAspectRatio="none"
          >
            <line
              x1="0"
              y1="0"
              x2="100%"
              y2="0"
              strokeDasharray="8 6"
              strokeWidth="2"
              style={{ stroke: 'var(--wm-border)' }}
            />
          </svg>

          {/* Animated connector dot */}
          <motion.div
            className="absolute hidden h-3 w-3 rounded-full md:block"
            style={{
              top: 'calc(3.5rem - 5px)',
              left: '16.67%',
              backgroundColor: 'var(--wm-primary)',
              boxShadow: '0 0 0 6px rgba(var(--wm-primary-rgb), 0.15)',
            }}
            animate={{ x: ['0%', '200%', '400%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.5 }}
          />

          {steps.map((step, index) => (
            <motion.article
              key={step.num}
              custom={index}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              whileHover={{ y: -8, transition: { duration: 0.25, ease: [0.34, 1.56, 0.64, 1] } }}
              className="relative z-10 overflow-hidden rounded-2xl"
              style={{
                background: 'var(--wm-surface)',
                borderRadius: 'var(--wm-radius-2xl)',
                border: '1px solid var(--wm-border)',
                boxShadow: 'var(--wm-shadow-sm)',
                transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.boxShadow = `0 20px 50px ${step.glow}, var(--wm-shadow-lg)`;
                el.style.borderColor = step.color;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.boxShadow = 'var(--wm-shadow-sm)';
                el.style.borderColor = 'var(--wm-border)';
              }}
            >
              {/* Colored accent bar at the top */}
              <div
                className="h-1 w-full"
                style={{ background: step.accentBar }}
              />

              <div className="relative p-7 pt-6">
                {/* Large oversized background step number */}
                <div
                  className="pointer-events-none absolute -right-3 -top-4 select-none font-black leading-none"
                  style={{
                    fontFamily: 'var(--wm-font-display)',
                    fontSize: '7rem',
                    color: step.color,
                    opacity: 0.04,
                  }}
                >
                  {step.num}
                </div>

                {/* Step indicator circle with pulse */}
                <div className="relative mb-6 inline-flex">
                  {/* Pulse ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      backgroundColor: step.color,
                      opacity: 0.15,
                    }}
                    animate={{
                      scale: [1, 1.6, 1],
                      opacity: [0.15, 0, 0.15],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: index * 0.4,
                    }}
                  />
                  <div
                    className="relative z-10 inline-flex h-12 w-12 items-center justify-center rounded-full text-sm font-black"
                    style={{
                      fontFamily: 'var(--wm-font-display)',
                      backgroundColor: step.lightBg,
                      color: step.color,
                      boxShadow: `0 0 0 3px ${step.glow}`,
                    }}
                  >
                    {step.num}
                  </div>
                </div>

                {/* Step number label */}
                <div
                  className="mb-1 text-xs font-bold tracking-[0.15em] uppercase"
                  style={{ color: step.color, fontFamily: 'var(--wm-font-display)' }}
                >
                  Step {step.num}
                </div>

                <h3
                  className="text-xl font-bold leading-snug"
                  style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-text-strong)' }}
                >
                  {step.title}
                </h3>

                <p className="mt-2.5 text-sm leading-relaxed" style={{ color: 'var(--wm-text-muted)' }}>
                  {step.description}
                </p>

                {/* Highlight pill with gradient background */}
                <div
                  className="mt-5 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold"
                  style={{
                    background: `linear-gradient(135deg, ${step.lightBg} 0%, rgba(255, 255, 255, 0.6) 100%)`,
                    color: step.color,
                    border: `1px solid ${step.glow}`,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {step.highlight}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
