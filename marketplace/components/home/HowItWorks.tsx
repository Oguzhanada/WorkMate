'use client';

import {motion} from 'framer-motion';

const steps = [
  {
    num: '01',
    title: 'Describe Your Job',
    description: 'Tell us what you need done, set your budget, and choose your county. Takes less than 2 minutes.',
    highlight: '2 min setup',
    color: 'var(--wm-primary)',
    lightBg: 'var(--wm-primary-light)',
    glow: 'rgba(0,184,148,0.15)'
  },
  {
    num: '02',
    title: 'Receive Verified Offers',
    description: 'Insured, background-checked professionals send you competitive quotes. Compare and choose with confidence.',
    highlight: 'Avg. 3 offers in 2h',
    color: 'var(--wm-blue)',
    lightBg: 'var(--wm-blue-soft)',
    glow: 'rgba(26,86,219,0.12)'
  },
  {
    num: '03',
    title: 'Pay When Done',
    description: "Payment is held securely by Stripe and released only when you're satisfied. Zero risk, full control.",
    highlight: 'Stripe-protected',
    color: 'var(--wm-amber-dark)',
    lightBg: 'var(--wm-amber-light)',
    glow: 'rgba(245,158,11,0.12)'
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="px-4 py-20 sm:px-6 lg:px-8" style={{backgroundColor: 'var(--wm-bg)'}}>
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-14">
          <span className="wm-section-label mb-3">How it works</span>
          <h2
            className="mt-4 wm-display"
            style={{fontSize: 'clamp(1.7rem, 3.2vw, 2.4rem)', color: 'var(--wm-navy)'}}
          >
            Get It Done in 3 Simple Steps
          </h2>
          <p className="mt-3 max-w-lg text-base leading-relaxed" style={{color: 'var(--wm-muted)'}}>
            From posting to payment — we handle the complexity so you can focus on the result.
          </p>
        </div>

        <div className="relative grid gap-6 md:grid-cols-3">
          {/* Connector line */}
          <div
            className="pointer-events-none absolute left-[16.67%] right-[16.67%] top-[2.2rem] hidden border-t-2 border-dashed md:block"
            style={{borderColor: 'var(--wm-border)'}}
          />
          {/* Animated connector dot */}
          <motion.div
            className="absolute top-[30px] hidden h-3.5 w-3.5 rounded-full md:block"
            style={{backgroundColor: 'var(--wm-primary)', boxShadow: '0 0 0 6px rgba(0,184,148,0.15)'}}
            animate={{x: ['0%', '52%', '103%']}}
            transition={{duration: 4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.5}}
          />

          {steps.map((step, index) => (
            <motion.article
              key={step.num}
              initial={{opacity: 0, y: 28}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true, amount: 0.3}}
              transition={{duration: 0.45, delay: index * 0.13, ease: 'easeOut'}}
              whileHover={{y: -6, transition: {duration: 0.2}}}
              className="relative z-10 overflow-hidden rounded-2xl border bg-white p-7"
              style={{
                borderColor: 'var(--wm-border)',
                boxShadow: 'var(--wm-shadow-sm)',
                transition: 'box-shadow 0.25s ease, border-color 0.25s ease'
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.boxShadow = '0 16px 40px ' + step.glow + ', var(--wm-shadow-md)';
                el.style.borderColor = step.color;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.boxShadow = 'var(--wm-shadow-sm)';
                el.style.borderColor = 'var(--wm-border)';
              }}
            >
              {/* Large decorative step number */}
              <div
                className="pointer-events-none absolute -right-2 -top-3 select-none text-[6rem] font-black leading-none opacity-[0.05]"
                style={{fontFamily: 'var(--wm-font-display)', color: step.color}}
              >
                {step.num}
              </div>

              {/* Step indicator */}
              <div
                className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black"
                style={{
                  fontFamily: 'var(--wm-font-display)',
                  backgroundColor: step.lightBg,
                  color: step.color
                }}
              >
                {step.num}
              </div>

              <h3
                className="text-lg font-bold leading-snug"
                style={{fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)'}}
              >
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{color: 'var(--wm-muted)'}}>
                {step.description}
              </p>
              <div
                className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                style={{backgroundColor: step.lightBg, color: step.color}}
              >
                ✓ {step.highlight}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
