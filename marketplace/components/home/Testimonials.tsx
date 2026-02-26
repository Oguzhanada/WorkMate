'use client';

import {AnimatePresence, motion} from 'framer-motion';
import {Star} from 'lucide-react';
import {useEffect, useState} from 'react';

const testimonials = [
  {
    id: '1',
    text: 'I solved my painting task in one day with WorkMate. The provider was punctual, pricing was clear, and payment felt secure.',
    name: 'Selin A.',
    county: 'Cork'
  },
  {
    id: '2',
    text: 'For an urgent plumbing issue, I received 3 offers within 30 minutes. The full process was smoother than expected.',
    name: 'Michael D.',
    county: 'Dublin'
  }
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 4800);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="bg-[#F9FAFB] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center font-[Poppins] text-3xl font-bold text-[#1F2937]">What Real Customers Say</h2>

        <div className="mt-8">
          <AnimatePresence mode="wait">
            <motion.article
              key={testimonials[index].id}
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              transition={{duration: 0.3}}
              className="rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-sm"
            >
              <div className="mb-4 flex items-center gap-1 text-[#F59E0B]">
                {Array.from({length: 5}).map((_, itemIndex) => (
                  <Star key={itemIndex} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <p className="text-lg italic text-[#374151]">"{testimonials[index].text}"</p>
              <p className="mt-4 text-sm font-semibold text-[#1F2937]">
                {testimonials[index].name} • {testimonials[index].county}
              </p>
            </motion.article>
          </AnimatePresence>

          <div className="mt-4 flex justify-center gap-2">
            {testimonials.map((item, dotIndex) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIndex(dotIndex)}
                className={`h-2.5 w-2.5 rounded-full transition ${dotIndex === index ? 'bg-[#00B894]' : 'bg-[#D1D5DB]'}`}
                aria-label={`Go to testimonial ${dotIndex + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
