'use client';

import {motion} from 'framer-motion';
import {
  ShieldCheck,
  FileCheck,
  Wallet,
  MapPinned,
  Star,
  Zap
} from 'lucide-react';

import {sectionRevealVariants} from '@/styles/animations';

const trustItems = [
  {
    title: 'Verified Professionals',
    description: 'Every provider goes through ID and document review before activation.',
    icon: ShieldCheck
  },
  {
    title: 'Insured Service',
    description: 'Public liability coverage baseline for provider onboarding.',
    icon: FileCheck
  },
  {
    title: 'Secure Payments',
    description: 'Funds stay protected and are released under platform rules.',
    icon: Wallet
  },
  {
    title: 'All Ireland Coverage',
    description: 'County-level matching with Eircode-ready flow.',
    icon: MapPinned
  },
  {
    title: 'Real Reviews',
    description: 'Verified jobs and transparent performance history.',
    icon: Star
  },
  {
    title: 'Fast Matching',
    description: 'Qualified offers begin arriving quickly after posting.',
    icon: Zap
  }
];

export default function TrustSection() {
  return (
    <section id="trust" className="bg-[#F9FAFB] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{once: true, amount: 0.2}}
          variants={sectionRevealVariants}
          className="mb-10 max-w-2xl"
        >
          <h2 className="font-[Poppins] text-3xl font-bold text-[#1F2937]">Why WorkMate? Safe and Simple</h2>
          <p className="mt-3 text-[#4B5563]">
            Designed for trust-first service delivery in Ireland for both customers and providers.
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {trustItems.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{opacity: 0, scale: 0.96, y: 20}}
              whileInView={{opacity: 1, scale: 1, y: 0}}
              viewport={{once: true, amount: 0.2}}
              transition={{duration: 0.35, delay: index * 0.06}}
              whileHover={{y: -4, boxShadow: '0 18px 24px rgba(15,23,42,0.12)'}}
              className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#ECFDF5] text-[#00B894]">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="font-[Poppins] text-lg font-semibold text-[#1F2937]">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#4B5563]">{item.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
