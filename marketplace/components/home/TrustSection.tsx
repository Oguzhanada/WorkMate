'use client';

import {motion} from 'framer-motion';
import {sectionRevealVariants} from '@/styles/animations';

const trustItems = [
  {
    emoji: '✅',
    title: 'Verified Professionals',
    description: 'Document-level verification before activation — ID, insurance, and business checks every time.',
    color: 'var(--wm-primary-light)',
    accent: 'var(--wm-primary)'
  },
  {
    emoji: '📋',
    title: 'Insured Service',
    description: 'Public liability insurance baseline required for every provider before they can quote on jobs.',
    color: '#EFF6FF',
    accent: 'var(--wm-blue)'
  },
  {
    emoji: '💰',
    title: 'Transparent Fees',
    description: 'Clear fee structure with no hidden charges. You see exactly what you pay and when.',
    color: 'var(--wm-amber-light)',
    accent: 'var(--wm-amber-dark)'
  },
  {
    emoji: '🇮🇪',
    title: 'Ireland-only Focus',
    description: 'Built specifically for Ireland with county-first matching, Eircode-ready flows, and local compliance.',
    color: 'var(--wm-primary-light)',
    accent: 'var(--wm-primary)'
  },
  {
    emoji: '⭐',
    title: 'Real Reviews',
    description: 'Every review is tied to a verified completed job. No fake ratings — just honest customer feedback.',
    color: 'var(--wm-amber-light)',
    accent: 'var(--wm-amber-dark)'
  },
  {
    emoji: '⚡',
    title: 'Fast Support',
    description: 'Clear status updates on active disputes and support cases. We respond, not ghost.',
    color: '#EFF6FF',
    accent: 'var(--wm-blue)'
  }
];

export default function TrustSection() {
  return (
    <section id="trust" className="px-4 py-20 sm:px-6 lg:px-8" style={{backgroundColor: 'var(--wm-bg)'}}>
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{once: true, amount: 0.2}}
          variants={sectionRevealVariants}
          className="mb-12"
        >
          <span
            className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
            style={{backgroundColor: 'var(--wm-primary-light)', color: 'var(--wm-primary-dark)'}}
          >
            💚 Why WorkMate
          </span>
          <h2
            className="font-[Poppins] font-black leading-tight"
            style={{fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', color: 'var(--wm-navy)'}}
          >
            Because You Deserve Better
          </h2>
          <p className="mt-3 max-w-lg text-base text-[var(--wm-muted)]">
            We built WorkMate because finding reliable tradespeople in Ireland was broken. Here&apos;s how we fixed it.
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {trustItems.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{opacity: 0, scale: 0.96, y: 20}}
              whileInView={{opacity: 1, scale: 1, y: 0}}
              viewport={{once: true, amount: 0.2}}
              transition={{duration: 0.35, delay: index * 0.06}}
              whileHover={{y: -4, boxShadow: '0 18px 32px rgba(15,23,42,0.10)'}}
              className="rounded-2xl border bg-white p-6 shadow-sm transition-all"
              style={{borderColor: 'var(--wm-border)'}}
            >
              {/* Emoji in a tinted circle */}
              <div
                className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                style={{backgroundColor: item.color}}
              >
                {item.emoji}
              </div>
              <h3
                className="font-[Poppins] text-lg font-bold"
                style={{color: 'var(--wm-navy)'}}
              >
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--wm-muted)]">
                {item.description}
              </p>
            </motion.article>
          ))}
        </div>

        {/* Bottom trust bar */}
        <div
          className="mt-10 flex flex-wrap items-center justify-center gap-6 rounded-2xl border p-5 text-sm font-medium text-[var(--wm-muted)]"
          style={{borderColor: 'var(--wm-border)', backgroundColor: 'white'}}
        >
          <span className="flex items-center gap-2">🔒 Stripe-secured payments</span>
          <span className="hidden h-4 w-px bg-[var(--wm-border)] sm:block" />
          <span className="flex items-center gap-2">🛡️ GDPR compliant</span>
          <span className="hidden h-4 w-px bg-[var(--wm-border)] sm:block" />
          <span className="flex items-center gap-2">📍 Eircode validated locations</span>
          <span className="hidden h-4 w-px bg-[var(--wm-border)] sm:block" />
          <span className="flex items-center gap-2">🏆 4.9/5 customer rating</span>
        </div>
      </div>
    </section>
  );
}
