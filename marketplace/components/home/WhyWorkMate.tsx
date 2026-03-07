'use client';

import {motion} from 'framer-motion';
import {Check, X, ShieldCheck, Lock, RefreshCw, Star, MapPin, UserCheck} from 'lucide-react';
import {sectionRevealVariants} from '@/styles/animations';

const features = [
  {
    icon: Lock,
    label: 'Secure payment hold',
    workmate: 'Stripe secure hold — released only when job is done',
    others: 'Direct transfer, no protection if job is abandoned',
  },
  {
    icon: ShieldCheck,
    label: 'Irish compliance stack',
    workmate: 'SafePass + Public Liability Insurance + Tax Clearance verified',
    others: 'Self-declaration only, no document checks',
  },
  {
    icon: UserCheck,
    label: 'Manual admin approval',
    workmate: 'Every provider reviewed by WorkMate team before going live',
    others: 'Auto-approval, anyone can list immediately',
  },
  {
    icon: RefreshCw,
    label: 'Repeat booking discount',
    workmate: '1.9% service fee when you rebook the same provider',
    others: 'Full platform fee on every booking',
  },
  {
    icon: Star,
    label: 'Smart Match ranking',
    workmate: 'Offers ranked by price, rating, compliance score and response time',
    others: 'Sorted by date posted or paid placement',
  },
  {
    icon: MapPin,
    label: 'Built for Ireland',
    workmate: 'Eircode validation, EUR only, county-first matching',
    others: 'Generic EU/UK tools, no Irish address support',
  },
];

export default function WhyWorkMate() {
  return (
    <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{once: true, amount: 0.2}}
          variants={sectionRevealVariants}
          className="mb-12 text-center"
        >
          <span className="wm-section-label mx-auto mb-3">The WorkMate Difference</span>
          <h2
            className="mt-4 wm-display"
            style={{fontSize: 'clamp(1.7rem, 3.2vw, 2.4rem)', color: 'var(--wm-navy)'}}
          >
            Why professionals and customers<br className="hidden sm:block" /> choose WorkMate
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed" style={{color: 'var(--wm-muted)'}}>
            Other platforms connect people. WorkMate verifies them — with Ireland&#39;s most complete
            compliance stack and the only secure payment hold in the Irish trades market.
          </p>
        </motion.div>

        {/* Column headers */}
        <div
          className="mb-2 grid grid-cols-1 gap-3 px-5 text-xs font-bold uppercase tracking-wider sm:grid-cols-[1fr_220px_130px]"
          style={{color: 'var(--wm-muted)', fontFamily: 'var(--wm-font-display)'}}
        >
          <span>Feature</span>
          <span className="hidden sm:block" style={{color: 'var(--wm-primary-dark)'}}>WorkMate</span>
          <span className="hidden sm:block">Others</span>
        </div>

        <div
          className="overflow-hidden rounded-2xl border"
          style={{borderColor: 'var(--wm-border)', boxShadow: 'var(--wm-shadow-md)'}}
        >
          {features.map((feature, i) => (
            <motion.div
              key={feature.label}
              initial={{opacity: 0, x: -14}}
              whileInView={{opacity: 1, x: 0}}
              viewport={{once: true, amount: 0.3}}
              transition={{duration: 0.35, delay: i * 0.06}}
              className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-[1fr_220px_130px] sm:items-center"
              style={{
                backgroundColor: i % 2 === 0 ? 'white' : 'var(--wm-bg)',
                borderBottom: i !== features.length - 1 ? '1px solid var(--wm-border)' : undefined
              }}
            >
              {/* Feature label */}
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{backgroundColor: 'var(--wm-primary-light)', color: 'var(--wm-primary)'}}
                >
                  <feature.icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold" style={{color: 'var(--wm-navy)'}}>{feature.label}</span>
              </div>

              {/* WorkMate column */}
              <div className="flex items-start gap-2 sm:items-center">
                <div
                  className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full sm:mt-0"
                  style={{backgroundColor: 'var(--wm-primary-light)'}}
                >
                  <Check className="h-2.5 w-2.5" style={{color: 'var(--wm-primary)'}} />
                </div>
                <span className="text-sm" style={{color: 'var(--wm-text)'}}>{feature.workmate}</span>
              </div>

              {/* Others column */}
              <div className="flex items-start gap-2 sm:items-center">
                <div
                  className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full sm:mt-0"
                  style={{backgroundColor: 'var(--wm-destructive-light)'}}
                >
                  <X className="h-2.5 w-2.5" style={{color: 'var(--wm-destructive)'}} />
                </div>
                <span className="text-sm" style={{color: 'var(--wm-muted)'}}>{feature.others}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{opacity: 0}}
          whileInView={{opacity: 1}}
          viewport={{once: true}}
          transition={{delay: 0.5}}
          className="mt-6 text-center text-sm"
          style={{color: 'var(--wm-subtle)'}}
        >
          WorkMate is Ireland&#39;s only platform with admin-approved providers and Stripe secure hold as standard.
        </motion.p>
      </div>
    </section>
  );
}
