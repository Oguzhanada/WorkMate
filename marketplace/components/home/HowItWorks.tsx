'use client';

import {motion} from 'framer-motion';
import {FilePlus2, MessagesSquare, ShieldCheck} from 'lucide-react';

const steps = [
  {
    title: 'Create Job',
    description: 'Describe the work and set your budget',
    icon: FilePlus2
  },
  {
    title: 'Receive Offers',
    description: 'Get offers from verified professionals',
    icon: MessagesSquare
  },
  {
    title: 'Pay Securely',
    description: 'Release payment safely when work is done',
    icon: ShieldCheck
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[#F9FAFB] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="font-[Poppins] text-3xl font-bold text-[#1F2937]">Trusted Professionals in 3 Steps</h2>
        <div className="relative mt-10 grid gap-6 md:grid-cols-3">
          <div className="pointer-events-none absolute left-0 right-0 top-12 hidden border-t-2 border-dotted border-[#C7D2FE] md:block" />
          <motion.div
            className="absolute top-[42px] hidden h-4 w-4 rounded-full bg-[#00B894] shadow-[0_0_0_8px_rgba(0,184,148,0.16)] md:block"
            animate={{x: ['0%', '48%', '97%']}}
            transition={{duration: 4.2, repeat: Infinity, ease: 'easeInOut'}}
          />

          {steps.map((step, index) => (
            <motion.article
              key={step.title}
              initial={{opacity: 0, x: index % 2 === 0 ? -28 : 28}}
              whileInView={{opacity: 1, x: 0}}
              viewport={{once: true, amount: 0.3}}
              transition={{duration: 0.45, delay: index * 0.12, ease: 'easeOut'}}
              className="relative z-10 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#ECFDF5] text-[#00B894]">
                <step.icon className="h-5 w-5" />
              </div>
              <h3 className="font-[Poppins] text-xl font-semibold text-[#1F2937]">{`${index + 1}. ${step.title}`}</h3>
              <p className="mt-2 text-sm text-[#4B5563]">{step.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
