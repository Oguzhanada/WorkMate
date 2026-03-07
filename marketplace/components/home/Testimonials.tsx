'use client';

import {AnimatePresence, motion} from 'framer-motion';
import {Star, Quote} from 'lucide-react';
import {useEffect, useState} from 'react';

const testimonials = [
  {
    id: '1',
    text: 'I solved my painting task in one day with WorkMate. The provider was punctual, pricing was clear, and payment felt secure.',
    name: 'Selin A.',
    county: 'Cork',
    role: 'Homeowner',
    rating: 5
  },
  {
    id: '2',
    text: 'For an urgent plumbing issue, I received 3 offers within 30 minutes. The full process was smoother than expected.',
    name: 'Michael D.',
    county: 'Dublin',
    role: 'Landlord',
    rating: 5
  },
  {
    id: '3',
    text: 'As a verified pro, WorkMate brought me 4 new clients in my first week. The admin approval gives customers real confidence.',
    name: 'Ciarán O.',
    county: 'Galway',
    role: 'Electrician',
    rating: 5
  }
];

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

const avatarColors = ['var(--wm-primary)', 'var(--wm-navy-mid)', 'var(--wm-amber-dark)'];

export default function Testimonials() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, []);

  const current = testimonials[index];

  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8" style={{backgroundColor: 'var(--wm-bg)'}}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <span className="wm-section-label mx-auto mb-3">Testimonials</span>
          <h2
            className="mt-4 wm-display"
            style={{fontSize: 'clamp(1.7rem, 3.2vw, 2.4rem)', color: 'var(--wm-navy)'}}
          >
            What Real Customers Say
          </h2>
        </div>

        {/* Main card */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.article
              key={current.id}
              initial={{opacity: 0, y: 16}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: -16}}
              transition={{duration: 0.4, ease: 'easeOut'}}
              className="relative overflow-hidden rounded-2xl border bg-white p-8 md:p-10"
              style={{
                borderColor: 'var(--wm-border)',
                boxShadow: 'var(--wm-shadow-xl)'
              }}
            >
              {/* Decorative large quote */}
              <div
                className="pointer-events-none absolute -left-2 -top-2 select-none"
                style={{color: 'var(--wm-primary)', opacity: 0.06}}
              >
                <Quote className="h-32 w-32" />
              </div>

              {/* Stars */}
              <div className="relative mb-5 flex items-center gap-1">
                {Array.from({length: current.rating}).map((_, starIndex) => (
                  <Star
                    key={starIndex}
                    className="h-5 w-5 fill-current"
                    style={{color: 'var(--wm-amber)'}}
                  />
                ))}
              </div>

              {/* Quote text */}
              <p
                className="relative text-xl font-medium leading-relaxed md:text-2xl"
                style={{
                  color: 'var(--wm-navy)',
                  fontFamily: 'var(--wm-font-display)',
                  letterSpacing: '-0.01em'
                }}
              >
                &ldquo;{current.text}&rdquo;
              </p>

              {/* Author */}
              <div className="relative mt-7 flex items-center gap-4">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{backgroundColor: avatarColors[index % avatarColors.length]}}
                >
                  {initials(current.name)}
                </div>
                <div>
                  <p className="font-bold" style={{fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)'}}>
                    {current.name}
                  </p>
                  <p className="text-sm" style={{color: 'var(--wm-muted)'}}>
                    {current.role} &mdash; {current.county}
                  </p>
                </div>
              </div>
            </motion.article>
          </AnimatePresence>

          {/* Dot indicators */}
          <div className="mt-6 flex justify-center gap-2.5">
            {testimonials.map((item, dotIndex) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIndex(dotIndex)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: dotIndex === index ? '24px' : '8px',
                  height: '8px',
                  backgroundColor: dotIndex === index ? 'var(--wm-primary)' : 'var(--wm-border)'
                }}
                aria-label={`Go to testimonial ${dotIndex + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
