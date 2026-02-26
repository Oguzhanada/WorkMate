'use client';

import {motion} from 'framer-motion';
import {FilePlus2, MessageCircleMore, CheckCheck} from 'lucide-react';

const steps = [
  {
    title: 'Post your job',
    description: 'Share task details, budget range, and location in less than 2 minutes.',
    icon: FilePlus2
  },
  {
    title: 'Receive offers',
    description: 'Verified professionals send offers and timelines you can compare.',
    icon: MessageCircleMore
  },
  {
    title: 'Hire with confidence',
    description: 'Pick the best match and pay securely when the work is complete.',
    icon: CheckCheck
  }
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="font-[Poppins] text-3xl font-bold text-[#1F2937]">How it works</h2>
        <p className="mt-3 text-[#4B5563]">A trust-first flow for customers and providers.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <motion.article
              key={step.title}
              initial={{opacity: 0, y: 20}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true, amount: 0.25}}
              transition={{duration: 0.3, delay: index * 0.08}}
              className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF6FF] text-[#0066CC]">
                <step.icon className="h-5 w-5" />
              </div>
              <h3 className="font-[Poppins] text-lg font-semibold text-[#1F2937]">{step.title}</h3>
              <p className="mt-2 text-sm text-[#4B5563]">{step.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
