'use client';

import Link from 'next/link';
import {motion} from 'framer-motion';

const highlights = ['1000+ active professionals', 'Coverage across 26 counties', 'Stripe-protected payments'];

export default function CTASection() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-3xl bg-gradient-to-r from-[#00B894] to-[#008B74] p-8 text-white shadow-xl sm:p-10">
        <h2 className="font-[Poppins] text-3xl font-bold">Start with WorkMate today</h2>
        <p className="mt-3 text-white/90">A trust-first marketplace for customers and service providers.</p>

        <div className="mt-7 flex flex-wrap gap-3">
          <motion.div whileHover={{scale: 1.03}} whileTap={{scale: 0.98}} animate={{scale: [1, 1.02, 1]}} transition={{duration: 1.8, repeat: Infinity}}>
            <Link
              href="/post-job"
              className="inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#1F2937]"
              style={{color: '#1F2937'}}
            >
              Post a Job
            </Link>
          </motion.div>

          <motion.div whileHover={{scale: 1.03}} whileTap={{scale: 0.98}} animate={{scale: [1, 1.02, 1]}} transition={{duration: 1.8, repeat: Infinity, delay: 0.2}}>
            <Link href="/search" className="inline-flex rounded-xl border border-white px-5 py-3 text-sm font-semibold text-white">
              Find Services
            </Link>
          </motion.div>
        </div>

        <div className="mt-8 grid gap-2 text-sm text-white/90 sm:grid-cols-3">
          {highlights.map((item) => (
            <p key={item}>• {item}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
