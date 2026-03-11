'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarClock, Layers, Sparkles, TrendingUp } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { getLocaleRoot, withLocalePrefix } from '@/lib/i18n/locale-path';

const popularTasks = [
  'Emergency plumbing',
  'Electrical diagnostics',
  'Deep home cleaning',
  'Furniture assembly',
];

const topServices = [
  { label: 'Popular category', value: 'Home repairs' },
  { label: 'In-demand service', value: 'Cleaning services' },
  { label: 'Common request', value: 'Painting and decorating' },
];

const howToUse = [
  {
    title: 'Post your request',
    detail: 'Define scope, budget, and timing in a guided form.',
    icon: Layers,
  },
  {
    title: 'Compare verified offers',
    detail: 'Review provider profiles, reviews, and proposed pricing.',
    icon: TrendingUp,
  },
  {
    title: 'Track and complete',
    detail: 'Use messages and milestones until the work is done.',
    icon: CalendarClock,
  },
];

export default function QuickStartHighlights() {
  const pathname = usePathname() || '/';
  const localeRoot = getLocaleRoot(pathname);

  return (
    <section className="px-4 py-14 sm:px-6 lg:px-8">
      <div
        className="mx-auto max-w-7xl rounded-3xl border p-6 md:p-8"
        style={{
          borderColor: 'rgba(245,158,11,0.20)',
          background:
            'linear-gradient(145deg, rgba(255,251,235,0.95) 0%, rgba(255,255,255,0.95) 48%, rgba(240,255,249,0.95) 100%)',
          boxShadow: 'var(--wm-shadow-lg)',
        }}
      >
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="wm-section-label">Quick start</span>
            <h2 className="mt-3 wm-display text-[clamp(1.5rem,3vw,2.1rem)]" style={{ color: 'var(--wm-navy)' }}>
              Popular tasks and how to get started
            </h2>
            <p className="mt-2 max-w-2xl text-sm" style={{ color: 'var(--wm-text-muted)' }}>
              Discover what people book most, then launch your first task in minutes with clear steps.
            </p>
          </div>
          <Link
            href={withLocalePrefix(localeRoot, '/post-job')}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
            style={{
              background: 'var(--wm-grad-primary)',
              boxShadow: '0 6px 18px rgba(0,184,148,0.30)',
            }}
          >
            Create task
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border bg-white p-5" style={{ borderColor: 'var(--wm-border)' }}>
            <h3 className="text-base font-bold" style={{ color: 'var(--wm-navy)' }}>
              Popular categories
            </h3>
            <ul className="mt-3 space-y-2 text-sm" style={{ color: 'var(--wm-text-muted)' }}>
              {popularTasks.map((task) => (
                <li key={task} className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" style={{ color: 'var(--wm-amber-dark)' }} />
                  {task}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border bg-white p-5" style={{ borderColor: 'var(--wm-border)' }}>
            <h3 className="text-base font-bold" style={{ color: 'var(--wm-navy)' }}>
              Most preferred services
            </h3>
            <ul className="mt-3 space-y-2 text-sm" style={{ color: 'var(--wm-text-muted)' }}>
              {topServices.map((entry) => (
                <li key={entry.label} className="flex items-center justify-between gap-2 rounded-lg bg-[var(--wm-primary-faint)] px-3 py-2">
                  <span>{entry.label}</span>
                  <strong style={{ color: 'var(--wm-primary-dark)' }}>{entry.value}</strong>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border bg-white p-5" style={{ borderColor: 'var(--wm-border)' }}>
            <h3 className="text-base font-bold" style={{ color: 'var(--wm-navy)' }}>
              How to use WorkMate
            </h3>
            <ol className="mt-3 space-y-3">
              {howToUse.map((step, index) => (
                <motion.li
                  key={step.title}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.28, delay: index * 0.06 }}
                  className="rounded-xl border p-3"
                  style={{ borderColor: 'var(--wm-border)' }}
                >
                  <div className="flex items-start gap-2">
                    <step.icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--wm-primary)' }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--wm-text)' }}>{step.title}</p>
                      <p className="text-xs" style={{ color: 'var(--wm-text-soft)' }}>{step.detail}</p>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ol>
          </article>
        </div>
      </div>
    </section>
  );
}
