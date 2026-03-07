'use client';

import {motion} from 'framer-motion';
import {sectionRevealVariants} from '@/styles/animations';

const trustItems = [
  {
    icon: '✅',
    title: 'Verified Professionals',
    description: 'Document-level verification before activation — ID, insurance, and business checks every time.',
    bg: 'var(--wm-primary-light)',
    glow: 'rgba(0,184,148,0.12)',
    accent: 'var(--wm-primary)'
  },
  {
    icon: '📋',
    title: 'Insured Service',
    description: 'Public liability insurance baseline required for every provider before they can quote on jobs.',
    bg: 'var(--wm-blue-soft)',
    glow: 'rgba(26,86,219,0.10)',
    accent: 'var(--wm-blue)'
  },
  {
    icon: '💰',
    title: 'Transparent Fees',
    description: 'Clear fee structure with no hidden charges. You see exactly what you pay and when.',
    bg: 'var(--wm-amber-light)',
    glow: 'rgba(245,158,11,0.10)',
    accent: 'var(--wm-amber-dark)'
  },
  {
    icon: '🇮🇪',
    title: 'Ireland-only Focus',
    description: 'Built specifically for Ireland with county-first matching, Eircode-ready flows, and local compliance.',
    bg: 'var(--wm-primary-light)',
    glow: 'rgba(0,184,148,0.12)',
    accent: 'var(--wm-primary)'
  },
  {
    icon: '⭐',
    title: 'Real Reviews',
    description: 'Every review is tied to a verified completed job. No fake ratings — just honest customer feedback.',
    bg: 'var(--wm-amber-light)',
    glow: 'rgba(245,158,11,0.10)',
    accent: 'var(--wm-amber-dark)'
  },
  {
    icon: '⚡',
    title: 'Fast Support',
    description: 'Clear status updates on active disputes and support cases. We respond, not ghost.',
    bg: 'var(--wm-blue-soft)',
    glow: 'rgba(26,86,219,0.10)',
    accent: 'var(--wm-blue)'
  }
];

const trustBar = [
  {icon: '🔒', text: 'Stripe-secured payments'},
  {icon: '🛡️', text: 'GDPR compliant'},
  {icon: '📍', text: 'Eircode validated'},
  {icon: '🏆', text: '4.9/5 rating'}
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
          <span className="wm-section-label mb-4">Why WorkMate</span>
          <h2
            className="mt-4 wm-display"
            style={{fontSize: 'clamp(1.7rem, 3.2vw, 2.4rem)', color: 'var(--wm-navy)'}}
          >
            Because You Deserve Better
          </h2>
          <p className="mt-3 max-w-lg text-base leading-relaxed" style={{color: 'var(--wm-muted)'}}>
            We built WorkMate because finding reliable tradespeople in Ireland was broken. Here&apos;s how we fixed it.
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {trustItems.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{opacity: 0, y: 24}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true, amount: 0.2}}
              transition={{duration: 0.4, delay: index * 0.07, ease: 'easeOut'}}
              whileHover={{y: -5, transition: {duration: 0.2}}}
              className="group relative overflow-hidden rounded-2xl border bg-white p-6"
              style={{borderColor: 'var(--wm-border)', boxShadow: 'var(--wm-shadow-sm)', transition: 'box-shadow 0.25s ease, border-color 0.25s ease'}}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.boxShadow = '0 16px 36px ' + item.glow + ', var(--wm-shadow-md)';
                el.style.borderColor = item.accent;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.boxShadow = 'var(--wm-shadow-sm)';
                el.style.borderColor = 'var(--wm-border)';
              }}
            >
              {/* Hover glow */}
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{background: 'radial-gradient(circle at 15% 15%, ' + item.glow + ', transparent 65%)'}}
              />
              <div
                className="relative mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                style={{backgroundColor: item.bg}}
              >
                {item.icon}
              </div>
              <h3 className="relative text-base font-bold" style={{fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)'}}>
                {item.title}
              </h3>
              <p className="relative mt-2 text-sm leading-relaxed" style={{color: 'var(--wm-muted)'}}>
                {item.description}
              </p>
            </motion.article>
          ))}
        </div>

        {/* Trust bar */}
        <motion.div
          initial={{opacity: 0, y: 16}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true}}
          transition={{delay: 0.4}}
          className="mt-8 flex flex-wrap items-center justify-center gap-6 rounded-2xl border bg-white p-5"
          style={{borderColor: 'var(--wm-border)', boxShadow: 'var(--wm-shadow-sm)'}}
        >
          {trustBar.map((item, i) => (
            <span key={item.text} className="flex items-center gap-2 text-sm font-medium" style={{color: 'var(--wm-muted)'}}>
              <span>{item.icon}</span>
              {item.text}
              {i < trustBar.length - 1 ? (
                <span className="ml-4 hidden h-3.5 w-px sm:block" style={{backgroundColor: 'var(--wm-border)'}} />
              ) : null}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
