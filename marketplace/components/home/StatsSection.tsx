'use client';

import {useEffect, useRef} from 'react';
import {motion, useInView, useMotionValue, useSpring, useTransform} from 'framer-motion';
import {BadgeCheck, Clock3, ShieldCheck, Star} from 'lucide-react';

interface Stat {
  prefix?: string;
  value: number;
  suffix: string;
  label: string;
}

const stats: Stat[] = [
  {value: 500, suffix: '+', label: 'Verified Providers'},
  {value: 26, suffix: '', label: 'Counties Covered'},
  {value: 4.8, suffix: '★', label: 'Average Rating'},
  {prefix: '< ', value: 4, suffix: 'h', label: 'Average Response'}
];

const evidencePoints = [
  {
    icon: BadgeCheck,
    title: 'Manual profile review',
    detail: 'Provider verification is reviewed before full marketplace visibility.'
  },
  {
    icon: ShieldCheck,
    title: 'Payment flow controls',
    detail: 'Structured platform flow supports transparent work and dispute evidence.'
  },
  {
    icon: Clock3,
    title: 'Faster decision cycle',
    detail: 'Comparable offers and quality signals reduce decision friction.'
  }
];

function AnimatedNumber({value, suffix, prefix}: {value: number; suffix: string; prefix?: string}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, {once: true, margin: '-60px'});

  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, {stiffness: 60, damping: 18, mass: 0.8});
  const isDecimal = value % 1 !== 0;
  const display = useTransform(spring, (v) =>
    isDecimal ? v.toFixed(1) : Math.round(v).toString()
  );

  useEffect(() => {
    if (isInView) motionVal.set(value);
  }, [isInView, motionVal, value]);

  return (
    <span ref={ref} className="inline-flex items-baseline gap-0.5">
      {prefix && <span>{prefix}</span>}
      <motion.span>{display}</motion.span>
      <span>{suffix}</span>
    </span>
  );
}

export default function StatsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, {once: true, margin: '-60px'});

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8"
      style={{
        background:
          'linear-gradient(135deg, rgba(12,27,51,0.96) 0%, rgba(18,42,74,0.96) 42%, rgba(0,184,148,0.9) 100%)'
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.65) 1px, transparent 1px)',
          backgroundSize: '34px 34px'
        }}
      />
      <div
        className="absolute left-0 right-0 top-0 h-px"
        style={{background: 'rgba(255,255,255,0.20)'}}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{background: 'rgba(255,255,255,0.20)'}}
      />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-8 grid gap-5 lg:grid-cols-[1.05fr_1fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">Platform health</p>
            <h2
              className="mt-3 text-[clamp(1.6rem,3vw,2.35rem)] font-bold leading-tight text-white"
              style={{fontFamily: 'var(--wm-font-display)'}}
            >
              Transparent outcomes users can evaluate quickly
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-white/75">
            These indicators reflect real marketplace activity and help users understand response speed,
            coverage, and provider quality before posting.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{opacity: 0, y: 20}}
                animate={isInView ? {opacity: 1, y: 0} : {opacity: 0, y: 20}}
                transition={{duration: 0.45, delay: index * 0.08, ease: 'easeOut'}}
                className="rounded-2xl border px-3 py-4 text-center"
                style={{borderColor: 'rgba(255,255,255,0.17)', background: 'rgba(255,255,255,0.06)'}}
              >
                <span
                  className="text-3xl font-extrabold leading-none tracking-tight sm:text-4xl"
                  style={{fontFamily: 'var(--wm-font-display)', color: 'white'}}
                >
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
                </span>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-white/70">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="rounded-2xl border p-4" style={{borderColor: 'rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.07)'}}>
            <div className="mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-300" />
              <p className="text-sm font-semibold text-white">Why these metrics matter</p>
            </div>
            <div className="space-y-3">
              {evidencePoints.map((point) => (
                <div key={point.title} className="rounded-xl border px-3 py-2.5" style={{borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(12,27,51,0.24)'}}>
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 rounded-lg bg-white/10 p-1.5">
                      <point.icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{point.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-white/70">{point.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
