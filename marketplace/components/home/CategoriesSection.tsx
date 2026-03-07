'use client';

import Link from 'next/link';
import {motion} from 'framer-motion';
import {
  Sparkles, Wrench, Trees, Truck, GraduationCap,
  Laptop, HeartHandshake, PartyPopper, PawPrint, Briefcase,
  LucideIcon, ArrowRight
} from 'lucide-react';
import {SERVICE_TAXONOMY} from '@/lib/service-taxonomy';

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

const categoryColors: Record<string, {bg: string; text: string; border: string}> = {
  'home-cleaning':       {bg: 'var(--wm-primary-light)',   text: 'var(--wm-primary-dark)',  border: 'rgba(0,184,148,0.20)'},
  'repairs-renovation':  {bg: 'var(--wm-blue-soft)',       text: 'var(--wm-blue-dark)',     border: 'rgba(26,86,219,0.20)'},
  'garden-outdoor':      {bg: '#F0FDF4',                   text: '#15803d',                 border: 'rgba(21,128,61,0.20)'},
  'moving-transport':    {bg: 'var(--wm-amber-light)',     text: 'var(--wm-amber-dark)',    border: 'rgba(245,158,11,0.20)'},
  'tutoring-education':  {bg: '#FDF4FF',                   text: '#7e22ce',                 border: 'rgba(126,34,206,0.20)'},
  'tech-support':        {bg: 'var(--wm-blue-soft)',       text: 'var(--wm-blue)',          border: 'rgba(26,86,219,0.20)'},
  'beauty-wellness':     {bg: '#FFF1F2',                   text: '#be123c',                 border: 'rgba(190,18,60,0.20)'},
  'events-media':        {bg: 'var(--wm-amber-faint)',     text: 'var(--wm-amber-dark)',    border: 'rgba(245,158,11,0.20)'},
  'pet-care':            {bg: '#FFF7ED',                   text: '#c2410c',                 border: 'rgba(194,65,12,0.20)'},
  'professional-services':{bg: 'rgba(12,27,51,0.06)',      text: 'var(--wm-navy)',          border: 'rgba(12,27,51,0.15)'}
};

const fallbackColor = {bg: 'var(--wm-primary-light)', text: 'var(--wm-primary-dark)', border: 'rgba(0,184,148,0.20)'};

const featuredCategories = SERVICE_TAXONOMY.map((group) => ({
  name: group.name,
  slug: group.slug,
  icon: categoryIcons[group.slug] ?? Wrench,
  color: categoryColors[group.slug] ?? fallbackColor
}));

export default function CategoriesSection() {
  return (
    <section id="categories" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between gap-3">
          <div>
            <span className="wm-section-label mb-3">Services</span>
            <h2
              className="mt-3 wm-display"
              style={{color: 'var(--wm-navy)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)'}}
            >
              Most Requested Services
            </h2>
            <p className="mt-2 text-sm" style={{color: 'var(--wm-muted)'}}>
              Explore popular categories and match with verified professionals.
            </p>
          </div>
          <Link
            href="/search"
            className="hidden items-center gap-1.5 text-sm font-semibold sm:inline-flex"
            style={{color: 'var(--wm-primary-dark)', transition: 'color var(--wm-transition)'}}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = 'var(--wm-primary)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = 'var(--wm-primary-dark)')}
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {featuredCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <motion.div
                key={category.name}
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true, amount: 0.2}}
                transition={{duration: 0.35, delay: index * 0.045}}
                whileHover={{y: -4, transition: {duration: 0.2}}}
                className="group cursor-pointer rounded-2xl border bg-white p-5"
                style={{
                  borderColor: 'var(--wm-border)',
                  boxShadow: 'var(--wm-shadow-sm)',
                  transition: 'box-shadow 0.25s ease, border-color 0.25s ease'
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.boxShadow = 'var(--wm-shadow-lg)';
                  el.style.borderColor = category.color.border;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.boxShadow = 'var(--wm-shadow-sm)';
                  el.style.borderColor = 'var(--wm-border)';
                }}
              >
                <div
                  className="mb-3.5 inline-flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
                  style={{backgroundColor: category.color.bg}}
                >
                  <Icon className="h-5 w-5" style={{color: category.color.text}} />
                </div>
                <h3
                  className="text-sm font-bold leading-snug"
                  style={{fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)'}}
                >
                  {category.name}
                </h3>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 text-sm font-semibold"
            style={{color: 'var(--wm-primary-dark)'}}
          >
            View all categories <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
