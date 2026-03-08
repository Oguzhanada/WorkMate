'use client';

import {useRef} from 'react';
import {motion, useInView, useMotionValue, useSpring, useTransform} from 'framer-motion';

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

function AnimatedNumber({value, suffix, prefix}: {value: number; suffix: string; prefix?: string}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, {once: true, margin: '-60px'});

  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, {stiffness: 60, damping: 18, mass: 0.8});
  const isDecimal = value % 1 !== 0;
  const display = useTransform(spring, (v) =>
    isDecimal ? v.toFixed(1) : Math.round(v).toString()
  );

  // Trigger spring when in view
  if (isInView) {
    motionVal.set(value);
  }

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
      style={{backgroundColor: 'var(--wm-primary)'}}
    >
      {/* Subtle background texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}
      />
      {/* Top + bottom edge accents */}
      <div
        className="absolute left-0 right-0 top-0 h-px"
        style={{background: 'rgba(255,255,255,0.20)'}}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{background: 'rgba(255,255,255,0.20)'}}
      />

      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{opacity: 0, y: 20}}
              animate={isInView ? {opacity: 1, y: 0} : {opacity: 0, y: 20}}
              transition={{duration: 0.45, delay: index * 0.08, ease: 'easeOut'}}
              className="flex flex-col items-center gap-2 text-center"
            >
              <span
                className="text-4xl font-extrabold leading-none tracking-tight sm:text-5xl"
                style={{
                  fontFamily: 'var(--wm-font-display)',
                  color: 'white'
                }}
              >
                <AnimatedNumber
                  value={stat.value}
                  suffix={stat.suffix}
                  prefix={stat.prefix}
                />
              </span>
              <span
                className="text-sm font-medium uppercase tracking-widest"
                style={{color: 'rgba(255,255,255,0.72)'}}
              >
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
