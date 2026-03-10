'use client';

import {AnimatePresence, motion} from 'framer-motion';
import {Star} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';

/*
 * Representative examples — these illustrate the type of experience
 * WorkMate aims to deliver. They are not sourced from real user reviews.
 * Replace with genuine testimonials once available.
 */
const testimonials = [
  {
    id: '1',
    text: 'Post a job, receive offers from verified pros, and pay securely — all through one platform.',
    name: 'Happy Customer',
    county: 'Cork',
    role: 'Homeowner',
    rating: 5
  },
  {
    id: '2',
    text: 'Get multiple offers quickly so you can compare pricing, reviews, and availability before choosing.',
    name: 'Satisfied Client',
    county: 'Dublin',
    role: 'Landlord',
    rating: 5
  },
  {
    id: '3',
    text: 'As a verified pro, WorkMate connects you with customers across Ireland who are ready to hire.',
    name: 'WorkMate Pro',
    county: 'Galway',
    role: 'Service Provider',
    rating: 5
  }
];

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

const avatarColors = ['var(--wm-primary)', 'var(--wm-navy-mid)', 'var(--wm-amber-dark)'];

const cardVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    rotateY: direction > 0 ? 12 : -12,
    x: direction > 0 ? 80 : -80,
    scale: 0.92,
  }),
  center: {
    opacity: 1,
    rotateY: 0,
    x: 0,
    scale: 1,
  },
  exit: (direction: number) => ({
    opacity: 0,
    rotateY: direction > 0 ? -12 : 12,
    x: direction > 0 ? -80 : 80,
    scale: 0.92,
  }),
};

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const goTo = useCallback((newIndex: number) => {
    setDirection(newIndex > index ? 1 : -1);
    setIndex(newIndex);
  }, [index]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDirection(1);
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, []);

  const current = testimonials[index];
  const prevIndex = (index - 1 + testimonials.length) % testimonials.length;
  const nextIndex = (index + 1) % testimonials.length;

  return (
    <section
      className="px-4 py-24 sm:px-6 lg:px-8"
      style={{
        background: 'linear-gradient(180deg, var(--wm-bg) 0%, rgba(255,251,235,0.3) 50%, var(--wm-bg) 100%)',
      }}
    >
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-16 text-center">
          <span className="wm-section-label mx-auto mb-3">Testimonials</span>
          <h2
            className="mt-4 wm-display"
            style={{
              fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
              color: 'var(--wm-navy)',
              letterSpacing: '-0.02em',
            }}
          >
            What to Expect
          </h2>
        </div>

        {/* Carousel container */}
        <div className="relative" style={{perspective: '1200px'}}>
          {/* Peek cards - desktop only */}
          <div className="pointer-events-none absolute inset-0 hidden items-center justify-between lg:flex" style={{zIndex: 0}}>
            {/* Left peek */}
            <div
              className="w-[220px] shrink-0 -translate-x-4 rounded-2xl border p-6"
              style={{
                borderColor: 'var(--wm-border-soft)',
                background: 'var(--wm-surface)',
                opacity: 0.4,
                filter: 'blur(1px)',
                transform: 'translateX(-16px) scale(0.88) rotateY(6deg)',
              }}
            >
              <p
                className="text-sm leading-relaxed line-clamp-3"
                style={{color: 'var(--wm-muted)', fontFamily: 'var(--wm-font-display)', fontStyle: 'italic'}}
              >
                &ldquo;{testimonials[prevIndex].text}&rdquo;
              </p>
              <p className="mt-3 text-xs font-medium" style={{color: 'var(--wm-subtle)'}}>
                {testimonials[prevIndex].name}
              </p>
            </div>

            {/* Right peek */}
            <div
              className="w-[220px] shrink-0 translate-x-4 rounded-2xl border p-6"
              style={{
                borderColor: 'var(--wm-border-soft)',
                background: 'var(--wm-surface)',
                opacity: 0.4,
                filter: 'blur(1px)',
                transform: 'translateX(16px) scale(0.88) rotateY(-6deg)',
              }}
            >
              <p
                className="text-sm leading-relaxed line-clamp-3"
                style={{color: 'var(--wm-muted)', fontFamily: 'var(--wm-font-display)', fontStyle: 'italic'}}
              >
                &ldquo;{testimonials[nextIndex].text}&rdquo;
              </p>
              <p className="mt-3 text-xs font-medium" style={{color: 'var(--wm-subtle)'}}>
                {testimonials[nextIndex].name}
              </p>
            </div>
          </div>

          {/* Main card */}
          <div className="relative mx-auto max-w-2xl" style={{zIndex: 1}}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.article
                key={current.id}
                custom={direction}
                variants={cardVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{duration: 0.5, ease: [0.34, 1.56, 0.64, 1]}}
                className="relative overflow-hidden rounded-3xl border p-10 md:p-14"
                style={{
                  borderColor: 'var(--wm-glass-border)',
                  background: 'var(--wm-surface)',
                  boxShadow: '0 22px 50px rgba(15,23,42,0.10), 0 0 0 1px rgba(255,255,255,0.6) inset, 0 0 60px rgba(16,185,129,0.04)',
                }}
              >
                {/* Decorative large quote mark */}
                <div
                  className="pointer-events-none absolute -left-2 -top-4 select-none"
                  aria-hidden="true"
                  style={{
                    fontFamily: 'var(--wm-font-display)',
                    fontSize: '8rem',
                    lineHeight: 1,
                    color: 'var(--wm-primary)',
                    opacity: 0.07,
                    fontWeight: 700,
                  }}
                >
                  &ldquo;
                </div>

                {/* Stars with glow */}
                <div className="relative mb-6 flex items-center gap-1.5">
                  {Array.from({length: current.rating}).map((_, starIndex) => (
                    <Star
                      key={starIndex}
                      className="h-5 w-5 fill-current"
                      style={{
                        color: 'var(--wm-amber)',
                        filter: 'drop-shadow(0 0 4px rgba(245,158,11,0.35))',
                      }}
                    />
                  ))}
                </div>

                {/* Quote text */}
                <p
                  className="relative text-xl font-medium leading-[1.7] md:text-2xl"
                  style={{
                    color: 'var(--wm-navy)',
                    fontFamily: 'var(--wm-font-display)',
                    fontStyle: 'italic',
                    letterSpacing: '-0.01em',
                  }}
                >
                  &ldquo;{current.text}&rdquo;
                </p>

                {/* Author */}
                <div className="relative mt-8 flex items-center gap-4">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{
                      backgroundColor: avatarColors[index % avatarColors.length],
                      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                    }}
                  >
                    {initials(current.name)}
                  </div>
                  <div>
                    <p
                      className="font-bold"
                      style={{
                        fontFamily: 'var(--wm-font-display)',
                        color: 'var(--wm-navy)',
                        fontSize: '1.05rem',
                      }}
                    >
                      {current.name}
                    </p>
                    <p className="text-sm" style={{color: 'var(--wm-muted)'}}>
                      {current.role} &mdash; {current.county}
                    </p>
                  </div>
                </div>
              </motion.article>
            </AnimatePresence>
          </div>
        </div>

        {/* Progress bar indicator */}
        <div className="mt-10 flex justify-center">
          <div
            className="relative flex overflow-hidden rounded-full"
            style={{
              width: `${testimonials.length * 48}px`,
              height: '3px',
              background: 'var(--wm-border)',
            }}
          >
            {testimonials.map((item, barIndex) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goTo(barIndex)}
                className="relative block h-full"
                style={{width: '48px'}}
                aria-label={`Go to testimonial ${barIndex + 1}`}
              >
                <motion.span
                  className="absolute inset-0 block rounded-full"
                  initial={false}
                  animate={{
                    backgroundColor: barIndex === index
                      ? 'var(--wm-primary)'
                      : 'transparent',
                    scaleX: barIndex === index ? 1 : 0,
                  }}
                  transition={{duration: 0.4, ease: 'easeOut'}}
                  style={{transformOrigin: 'left center'}}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
