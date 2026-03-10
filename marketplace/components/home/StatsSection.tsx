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
  {value: 4.8, suffix: '\u2605', label: 'Average Rating'},
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

/* Floating decorative shape */
function FloatingShape({
  size,
  top,
  left,
  delay,
  ring
}: {
  size: number;
  top: string;
  left: string;
  delay: number;
  ring?: boolean;
}) {
  return (
    <motion.div
      className="pointer-events-none absolute rounded-full"
      style={{
        width: size,
        height: size,
        top,
        left,
        border: ring ? '1.5px solid rgba(var(--wm-primary-rgb), 0.12)' : 'none',
        background: ring ? 'transparent' : 'rgba(var(--wm-primary-rgb), 0.06)'
      }}
      animate={{
        y: [0, -18, 0],
        rotate: [0, ring ? 90 : 20, 0],
        scale: [1, 1.04, 1]
      }}
      transition={{
        duration: ring ? 14 : 10,
        repeat: Infinity,
        ease: 'easeInOut',
        delay
      }}
    />
  );
}

export default function StatsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, {once: true, margin: '-60px'});

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-24 sm:py-32"
      style={{
        background:
          'linear-gradient(160deg, var(--wm-navy) 0%, rgba(15,23,42,0.97) 45%, rgba(17,31,63,0.98) 100%)'
      }}
    >
      {/* Animated dot grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          opacity: 0.07
        }}
      />

      {/* Central radial glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: '80%',
          height: '80%',
          background:
            'radial-gradient(ellipse at center, rgba(var(--wm-primary-rgb), 0.12) 0%, transparent 65%)',
          filter: 'blur(40px)'
        }}
      />

      {/* Top & bottom borders */}
      <div
        className="absolute left-0 right-0 top-0 h-px"
        style={{background: 'linear-gradient(to right, transparent, rgba(var(--wm-primary-rgb), 0.3), transparent)'}}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)'}}
      />

      {/* Floating decorative shapes */}
      <FloatingShape size={120} top="8%" left="5%" delay={0} ring />
      <FloatingShape size={80} top="60%" left="88%" delay={2} />
      <FloatingShape size={60} top="15%" left="78%" delay={4} ring />
      <FloatingShape size={100} top="70%" left="12%" delay={3} />
      <FloatingShape size={40} top="40%" left="92%" delay={1.5} ring />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          className="mb-14"
          initial={{opacity: 0, y: 20}}
          animate={isInView ? {opacity: 1, y: 0} : {opacity: 0, y: 20}}
          transition={{duration: 0.6}}
        >
          {/* Glowing pill label */}
          <div
            className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5"
            style={{
              background: 'rgba(var(--wm-primary-rgb), 0.15)',
              border: '1px solid rgba(var(--wm-primary-rgb), 0.3)',
              boxShadow: '0 0 20px rgba(var(--wm-primary-rgb), 0.15), inset 0 0 12px rgba(var(--wm-primary-rgb), 0.08)'
            }}
          >
            <div
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: 'var(--wm-primary)',
                boxShadow: '0 0 6px var(--wm-primary)'
              }}
            />
            <span
              className="text-xs font-bold uppercase tracking-[0.18em]"
              style={{color: 'var(--wm-primary-dark)'}}
            >
              Platform Health
            </span>
          </div>

          <h2
            className="max-w-2xl text-white"
            style={{
              fontFamily: 'var(--wm-font-display)',
              fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.02em'
            }}
          >
            Transparent outcomes users can evaluate quickly
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed" style={{color: 'rgba(255,255,255,0.7)'}}>
            These indicators reflect real marketplace activity and help users understand response speed,
            coverage, and provider quality before posting.
          </p>
        </motion.div>

        {/* Main grid: Stats left, Evidence right */}
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-start">
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{opacity: 0, y: 30}}
                animate={isInView ? {opacity: 1, y: 0} : {opacity: 0, y: 30}}
                transition={{duration: 0.5, delay: index * 0.1, ease: 'easeOut'}}
                whileHover={{
                  y: -6,
                  transition: {duration: 0.25}
                }}
                className="group relative rounded-2xl px-4 py-6 text-center"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = 'rgba(var(--wm-primary-rgb), 0.4)';
                  el.style.boxShadow = '0 8px 32px rgba(var(--wm-primary-rgb), 0.15), 0 0 0 1px rgba(var(--wm-primary-rgb), 0.2)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = 'rgba(255,255,255,0.12)';
                  el.style.boxShadow = 'none';
                }}
              >
                {/* Subtle top accent line */}
                <div
                  className="absolute left-4 right-4 top-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{background: 'linear-gradient(to right, transparent, var(--wm-primary), transparent)'}}
                />
                <span
                  className="block leading-none tracking-tight"
                  style={{
                    fontFamily: 'var(--wm-font-display)',
                    fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                    fontWeight: 800,
                    color: 'white'
                  }}
                >
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
                </span>
                <p
                  className="mt-3 font-semibold uppercase"
                  style={{
                    fontSize: '0.625rem',
                    letterSpacing: '0.14em',
                    color: 'rgba(255,255,255,0.6)'
                  }}
                >
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Evidence sidebar panel */}
          <motion.div
            initial={{opacity: 0, x: 30}}
            animate={isInView ? {opacity: 1, x: 0} : {opacity: 0, x: 30}}
            transition={{duration: 0.6, delay: 0.3}}
            className="rounded-2xl p-5"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
          >
            <div className="mb-4 flex items-center gap-2.5">
              <Star className="h-4 w-4" style={{color: 'var(--wm-amber)'}} />
              <p
                className="text-sm font-bold"
                style={{color: 'rgba(255,255,255,0.9)'}}
              >
                Why these metrics matter
              </p>
            </div>

            <div className="space-y-0">
              {evidencePoints.map((point, i) => (
                <div key={point.title}>
                  <div className="flex items-start gap-3 py-3.5">
                    {/* Icon in teal pill */}
                    <div
                      className="mt-0.5 flex shrink-0 items-center justify-center rounded-full"
                      style={{
                        width: 32,
                        height: 32,
                        background: 'rgba(var(--wm-primary-rgb), 0.15)',
                        border: '1px solid rgba(var(--wm-primary-rgb), 0.25)'
                      }}
                    >
                      <point.icon
                        className="h-3.5 w-3.5"
                        style={{color: 'var(--wm-primary)'}}
                      />
                    </div>
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{color: 'rgba(255,255,255,0.95)'}}
                      >
                        {point.title}
                      </p>
                      <p
                        className="mt-1 text-xs leading-relaxed"
                        style={{color: 'rgba(255,255,255,0.55)'}}
                      >
                        {point.detail}
                      </p>
                    </div>
                  </div>
                  {/* Divider between items */}
                  {i < evidencePoints.length - 1 && (
                    <div
                      className="h-px"
                      style={{background: 'rgba(255,255,255,0.08)'}}
                    />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
