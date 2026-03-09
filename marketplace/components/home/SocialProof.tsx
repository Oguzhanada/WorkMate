'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useInView, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';

/* ─── Stats ─── */
interface Stat {
  prefix?: string;
  value: number;
  suffix: string;
  label: string;
}

const stats: Stat[] = [
  { value: 500, suffix: '+', label: 'Verified Providers' },
  { value: 26, suffix: '', label: 'Counties Covered' },
  { value: 4.8, suffix: '★', label: 'Average Rating' },
  { prefix: '< ', value: 4, suffix: 'h', label: 'Avg Response' },
];

function AnimatedNumber({ value, suffix, prefix }: { value: number; suffix: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 60, damping: 18, mass: 0.8 });
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

/* ─── Testimonials ─── */
const testimonials = [
  {
    id: '1',
    text: 'I solved my painting task in one day with WorkMate. The provider was punctual, pricing was clear, and payment felt secure.',
    name: 'Selin A.',
    county: 'Cork',
    role: 'Homeowner',
    rating: 5,
  },
  {
    id: '2',
    text: 'For an urgent plumbing issue, I received 3 offers within 30 minutes. The full process was smoother than expected.',
    name: 'Michael D.',
    county: 'Dublin',
    role: 'Landlord',
    rating: 5,
  },
  {
    id: '3',
    text: 'As a verified pro, WorkMate brought me 4 new clients in my first week. The admin approval gives customers real confidence.',
    name: 'Ciarán O.',
    county: 'Galway',
    role: 'Electrician',
    rating: 5,
  },
];

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

const avatarColors = ['var(--wm-primary)', 'var(--wm-navy-mid)', 'var(--wm-amber-dark)'];

export default function SocialProof() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const goTo = useCallback((newIndex: number) => {
    setDirection(newIndex > index ? 1 : -1);
    setIndex(newIndex);
  }, [index]);

  const next = useCallback(() => {
    setDirection(1);
    setIndex((prev) => (prev + 1) % testimonials.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDirection(1);
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, []);

  const current = testimonials[index];

  return (
    <section
      className="relative overflow-hidden px-5 py-28 sm:px-8 lg:px-12"
      style={{
        background: 'linear-gradient(160deg, var(--wm-navy) 0%, #0c1a2e 50%, #0a2a29 100%)',
      }}
    >
      {/* Subtle dot grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.25) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 0.06,
        }}
      />

      {/* Glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: '70%',
          height: '70%',
          background: 'radial-gradient(ellipse, rgba(var(--wm-primary-rgb), 0.08) 0%, transparent 60%)',
          filter: 'blur(60px)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Two-column: Stats left, Testimonial right */}
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left — Stats */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span
                className="text-xs font-bold uppercase tracking-[0.2em]"
                style={{ color: 'var(--wm-primary)' }}
              >
                Platform metrics
              </span>
              <h2
                className="mt-3"
                style={{
                  fontFamily: 'var(--wm-font-display)',
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  fontWeight: 800,
                  lineHeight: 1.1,
                  letterSpacing: '-0.03em',
                  color: 'white',
                }}
              >
                Numbers that<br />speak for themselves.
              </h2>
            </motion.div>

            {/* Stat grid */}
            <div className="mt-12 grid grid-cols-2 gap-4">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="rounded-2xl p-5"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <span
                    className="block text-3xl font-extrabold leading-none tracking-tight"
                    style={{
                      fontFamily: 'var(--wm-font-display)',
                      color: 'white',
                    }}
                  >
                    <AnimatedNumber value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
                  </span>
                  <span
                    className="mt-2 block text-xs font-semibold uppercase tracking-[0.12em]"
                    style={{ color: 'rgba(255,255,255,0.45)' }}
                  >
                    {stat.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right — Testimonial card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Card */}
            <div
              className="relative overflow-hidden rounded-3xl p-8 sm:p-10"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              {/* Quote icon */}
              <Quote
                className="mb-6 h-8 w-8"
                style={{ color: 'var(--wm-primary)', opacity: 0.4 }}
              />

              {/* Stars */}
              <div className="mb-5 flex items-center gap-1">
                {Array.from({ length: current.rating }).map((_, si) => (
                  <Star
                    key={si}
                    className="h-4 w-4 fill-current"
                    style={{ color: 'var(--wm-amber)' }}
                  />
                ))}
              </div>

              {/* Quote */}
              <div className="relative min-h-[120px]">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={current.id}
                    custom={direction}
                    initial={{ opacity: 0, x: direction > 0 ? 30 : -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: direction > 0 ? -30 : 30 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  >
                    <p
                      className="text-lg font-medium leading-relaxed sm:text-xl"
                      style={{
                        color: 'rgba(255,255,255,0.9)',
                        fontFamily: 'var(--wm-font-display)',
                        fontStyle: 'italic',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      &ldquo;{current.text}&rdquo;
                    </p>

                    {/* Author */}
                    <div className="mt-6 flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: avatarColors[index % avatarColors.length] }}
                      >
                        {initials(current.name)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'white' }}>
                          {current.name}
                        </p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          {current.role} — {current.county}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation */}
              <div className="mt-8 flex items-center gap-3">
                <button
                  type="button"
                  onClick={prev}
                  className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.7)',
                  }}
                  aria-label="Previous testimonial"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.7)',
                  }}
                  aria-label="Next testimonial"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                {/* Dots */}
                <div className="ml-auto flex items-center gap-2">
                  {testimonials.map((t, ti) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => goTo(ti)}
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: ti === index ? '24px' : '8px',
                        background: ti === index ? 'var(--wm-primary)' : 'rgba(255,255,255,0.2)',
                      }}
                      aria-label={`Go to testimonial ${ti + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
