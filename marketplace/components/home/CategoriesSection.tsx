'use client';

import Link from 'next/link';
import {motion} from 'framer-motion';
import {
  Sparkles,
  Wrench,
  Trees,
  Truck,
  GraduationCap,
  Laptop,
  HeartHandshake,
  PartyPopper,
  PawPrint,
  Briefcase,
  LucideIcon,
  ArrowRight
} from 'lucide-react';
import { SERVICE_TAXONOMY } from '@/lib/service-taxonomy';

const categoryIcons: Record<string, LucideIcon> = {
  'home-cleaning': Sparkles,
  'repairs-renovation': Wrench,
  'garden-outdoor': Trees,
  'moving-transport': Truck,
  'tutoring-education': GraduationCap,
  'tech-support': Laptop,
  'beauty-wellness': HeartHandshake,
  'events-media': PartyPopper,
  'pet-care': PawPrint,
  'professional-services': Briefcase
};

const featuredCategories = SERVICE_TAXONOMY.map((group) => ({
  name: group.name,
  slug: group.slug,
  icon: categoryIcons[group.slug] ?? Wrench
}));

export default function CategoriesSection() {
  return (
    <section id="categories" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-[Poppins] text-3xl font-bold text-[#1F2937]">Most Requested Services</h2>
            <p className="mt-2 text-[#4B5563]">Explore popular categories and match with verified professionals.</p>
          </div>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0066CC] transition hover:text-[#0050A4]"
          >
            View all categories
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredCategories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{opacity: 0, y: 24, rotate: -2}}
              whileInView={{opacity: 1, y: 0, rotate: 0}}
              viewport={{once: true, amount: 0.2}}
              transition={{duration: 0.35, delay: index * 0.05}}
              whileHover={{scale: 1.03, rotate: 1}}
              className="group rounded-2xl border border-[#E5E7EB] bg-white p-5 transition hover:border-[#BEE3DB] hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#F3F4F6] text-[#4B5563] transition group-hover:bg-[#ECFDF5] group-hover:text-[#00B894]">
                <category.icon className="h-5 w-5" />
              </div>
              <h3 className="font-[Poppins] text-base font-semibold text-[#1F2937]">{category.name}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
