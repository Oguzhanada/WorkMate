'use client';

import {motion} from 'framer-motion';
import {MapPin, Search, ShieldCheck, CircleDollarSign, BadgeCheck} from 'lucide-react';
import {useEffect, useState} from 'react';

import {heroItemVariants, heroStaggerContainer} from '@/styles/animations';

const counties = [
  'Antrim',
  'Armagh',
  'Carlow',
  'Cavan',
  'Clare',
  'Cork',
  'Derry',
  'Donegal',
  'Down',
  'Dublin',
  'Fermanagh',
  'Galway',
  'Kerry',
  'Kildare',
  'Kilkenny',
  'Laois',
  'Leitrim',
  'Limerick',
  'Longford',
  'Louth',
  'Mayo',
  'Meath',
  'Monaghan',
  'Offaly',
  'Roscommon',
  'Sligo',
  'Tipperary',
  'Tyrone',
  'Waterford',
  'Westmeath',
  'Wexford',
  'Wicklow'
];

const stats = [
  {value: 1000, suffix: '+', label: 'Trusted Professionals', icon: BadgeCheck},
  {value: 100, suffix: '%', label: 'Insured Services', icon: ShieldCheck},
  {value: 100, suffix: '%', label: 'Secure Payments', icon: CircleDollarSign}
];

function Counter({target, suffix = ''}: {target: number; suffix?: string}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const duration = 1000;
    const interval = 16;
    const steps = duration / interval;
    const increment = target / steps;
    const timer = window.setInterval(() => {
      frame += 1;
      const next = Math.min(target, Math.round(frame * increment));
      setValue(next);
      if (next >= target) {
        window.clearInterval(timer);
      }
    }, interval);

    return () => window.clearInterval(timer);
  }, [target]);

  return (
    <span className="font-[Poppins] text-3xl font-bold text-[#1F2937] sm:text-4xl">
      {value}
      {suffix}
    </span>
  );
}

export default function HeroSection() {
  const [county, setCounty] = useState('Dublin');

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#F9FAFB] via-white to-white px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-10 [background:radial-gradient(circle_at_15%_25%,#00B894,transparent_35%),radial-gradient(circle_at_85%_20%,#0066CC,transparent_30%)]" />
      <div className="mx-auto max-w-7xl">
        <motion.div variants={heroStaggerContainer} initial="hidden" animate="show" className="relative z-10 space-y-8">
          <motion.div variants={heroItemVariants} className="max-w-3xl">
            <p className="mb-3 inline-flex rounded-full border border-[#D1FAE5] bg-[#ECFDF5] px-3 py-1 text-sm font-medium text-[#047857]">
              WorkMate - Trust-first local marketplace
            </p>
            <h1 className="font-[Poppins] text-4xl font-bold leading-tight text-[#1F2937] sm:text-5xl">
              Ireland&apos;s Trusted Marketplace for Home Services
            </h1>
            <p className="mt-4 text-lg text-[#4B5563]">
              Verified, insured professionals across all counties. Post once, receive qualified offers quickly.
            </p>
          </motion.div>

          <motion.div
            variants={heroItemVariants}
            className="grid gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-lg md:grid-cols-[1fr_220px_160px]"
          >
            <label className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] px-3 py-3">
              <Search className="h-4 w-4 text-[#6B7280]" />
              <input
                type="text"
                placeholder="What service do you need?"
                className="w-full border-none bg-transparent text-sm outline-none"
              />
            </label>

            <label className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] px-3 py-3">
              <MapPin className="h-4 w-4 text-[#6B7280]" />
              <select
                aria-label="County"
                value={county}
                onChange={(event) => setCounty(event.target.value)}
                className="w-full border-none bg-transparent text-sm outline-none"
              >
                {counties.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="rounded-xl bg-[#00B894] px-4 py-3 text-sm font-semibold text-white transition hover:scale-[1.02] hover:bg-[#008B74]"
            >
              Find Service
            </button>
          </motion.div>

          <motion.div variants={heroItemVariants} className="grid gap-3 md:grid-cols-3">
            {stats.map((item) => (
              <div key={item.label} className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF6FF] text-[#0066CC]">
                  <item.icon className="h-5 w-5" />
                </div>
                <Counter target={item.value} suffix={item.suffix} />
                <p className="mt-2 text-sm text-[#4B5563]">{item.label}</p>
              </div>
            ))}
          </motion.div>

          <motion.div variants={heroItemVariants} className="flex flex-wrap items-center gap-3">
            <a
              href="#how-it-works"
              className="rounded-xl border border-[#D1D5DB] px-5 py-3 text-sm font-semibold text-[#1F2937] transition hover:border-[#00B894]"
            >
              How it works
            </a>
            <a
              href="/search"
              className="rounded-xl bg-[#00B894] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#008B74]"
            >
              Explore Services
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
