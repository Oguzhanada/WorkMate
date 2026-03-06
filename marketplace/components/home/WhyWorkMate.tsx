'use client';

import { motion } from 'framer-motion';
import { Check, X, ShieldCheck, Lock, RefreshCw, Star, MapPin, UserCheck } from 'lucide-react';
import { sectionRevealVariants } from '@/styles/animations';

const features = [
  {
    icon: Lock,
    label: 'Secure payment hold',
    workmate: 'Stripe secure hold — released only when job is done',
    others: 'Direct transfer, no protection if job is abandoned',
  },
  {
    icon: ShieldCheck,
    label: 'Irish compliance stack',
    workmate: 'SafePass + Public Liability Insurance + Tax Clearance verified',
    others: 'Self-declaration only, no document checks',
  },
  {
    icon: UserCheck,
    label: 'Manual admin approval',
    workmate: 'Every provider reviewed by WorkMate team before going live',
    others: 'Auto-approval, anyone can list immediately',
  },
  {
    icon: RefreshCw,
    label: 'Repeat booking discount',
    workmate: '1.9% service fee when you rebook the same provider',
    others: 'Full platform fee on every booking',
  },
  {
    icon: Star,
    label: 'Smart Match ranking',
    workmate: 'Offers ranked by price, rating, compliance score and response time',
    others: 'Sorted by date posted or paid placement',
  },
  {
    icon: MapPin,
    label: 'Built for Ireland',
    workmate: 'Eircode validation, EUR only, county-first matching',
    others: 'Generic EU/UK tools, no Irish address support',
  },
];

export default function WhyWorkMate() {
  return (
    <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={sectionRevealVariants}
          className="mb-12 text-center"
        >
          <span className="inline-block rounded-full bg-[#ECFDF5] px-4 py-1 text-sm font-semibold text-[#00B894]">
            The WorkMate difference
          </span>
          <h2 className="mt-3 font-[Poppins] text-3xl font-bold text-[#1F2937] sm:text-4xl">
            Why professionals and customers<br className="hidden sm:block" /> choose WorkMate
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[#4B5563]">
            Other platforms connect people. WorkMate verifies them — with Ireland&#39;s most complete
            compliance stack and the only secure payment hold in the Irish trades market.
          </p>
        </motion.div>

        {/* Comparison header */}
        <div className="mb-2 grid grid-cols-[1fr_auto_auto] items-center gap-3 px-4 text-sm font-semibold text-[#6B7280] sm:grid-cols-[1fr_220px_140px]">
          <span>Feature</span>
          <span className="hidden sm:block text-[#1F2937]">WorkMate</span>
          <span className="hidden sm:block">Others</span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#E5E7EB]">
          {features.map((feature, i) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.3, delay: i * 0.07 }}
              className={`grid grid-cols-1 gap-3 p-4 sm:grid-cols-[1fr_220px_140px] sm:items-center ${
                i % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'
              } ${i !== features.length - 1 ? 'border-b border-[#E5E7EB]' : ''}`}
            >
              {/* Feature label */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#ECFDF5] text-[#00B894]">
                  <feature.icon className="h-4 w-4" />
                </div>
                <span className="font-semibold text-[#1F2937]">{feature.label}</span>
              </div>

              {/* WorkMate column */}
              <div className="flex items-start gap-2 sm:items-center">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#00B894] sm:mt-0" />
                <span className="text-sm text-[#374151]">{feature.workmate}</span>
              </div>

              {/* Others column */}
              <div className="flex items-start gap-2 sm:items-center">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-[#EF4444] sm:mt-0" />
                <span className="text-sm text-[#6B7280]">{feature.others}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom trust note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center text-sm text-[#9CA3AF]"
        >
          WorkMate is Ireland&#39;s only platform with admin-approved providers and Stripe secure hold as standard.
        </motion.p>
      </div>
    </section>
  );
}
