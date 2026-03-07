'use client';

import {motion} from 'framer-motion';

const steps = [
  {
    emoji: '📝',
    title: 'Describe Your Job',
    description: 'Tell us what you need done, set your budget, and choose your county. Takes less than 2 minutes.',
    highlight: '2 min setup'
  },
  {
    emoji: '📬',
    title: 'Receive Verified Offers',
    description: 'Insured, background-checked professionals send you competitive quotes. Compare and choose with confidence.',
    highlight: 'Avg. 3 offers in 2h'
  },
  {
    emoji: '✅',
    title: 'Pay When Done',
    description: "Payment is held securely by Stripe and released only when you're satisfied. Zero risk, full control.",
    highlight: 'Stripe-protected'
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="px-4 py-20 sm:px-6 lg:px-8" style={{backgroundColor: 'var(--wm-bg)'}}>
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div className="mb-12">
          <span
            className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
            style={{backgroundColor: 'var(--wm-amber-light)', color: 'var(--wm-amber-dark)'}}
          >
            ⚡ How it works
          </span>
          <h2
            className="font-[Poppins] font-black leading-tight"
            style={{fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', color: 'var(--wm-navy)'}}
          >
            Get It Done in 3 Simple Steps 👇
          </h2>
          <p className="mt-3 max-w-lg text-base text-[var(--wm-muted)]">
            From posting to payment — we handle the complexity so you can focus on the result.
          </p>
        </div>

        <div className="relative grid gap-6 md:grid-cols-3">
          {/* Connector line */}
          <div
            className="pointer-events-none absolute left-0 right-0 top-12 hidden border-t-2 border-dashed md:block"
            style={{borderColor: 'var(--wm-primary-light)'}}
          />
          {/* Moving dot */}
          <motion.div
            className="absolute top-[42px] hidden h-4 w-4 rounded-full md:block"
            style={{backgroundColor: 'var(--wm-primary)', boxShadow: '0 0 0 8px rgba(0,184,148,0.16)'}}
            animate={{x: ['0%', '48%', '97%']}}
            transition={{duration: 4.2, repeat: Infinity, ease: 'easeInOut'}}
          />

          {steps.map((step, index) => (
            <motion.article
              key={step.title}
              initial={{opacity: 0, y: 24}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true, amount: 0.3}}
              transition={{duration: 0.4, delay: index * 0.12, ease: 'easeOut'}}
              whileHover={{y: -4}}
              className="relative z-10 overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              style={{borderColor: 'var(--wm-border)'}}
            >
              {/* Step number — decorative */}
              <div
                className="absolute right-4 top-4 font-[Poppins] text-5xl font-black leading-none opacity-[0.06]"
                style={{color: 'var(--wm-primary)'}}
              >
                {index + 1}
              </div>

              <div className="mb-4 text-4xl">{step.emoji}</div>
              <h3
                className="font-[Poppins] text-xl font-bold"
                style={{color: 'var(--wm-navy)'}}
              >
                {index + 1}. {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--wm-muted)]">
                {step.description}
              </p>
              <div
                className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                style={{backgroundColor: 'var(--wm-primary-light)', color: 'var(--wm-primary-dark)'}}
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
