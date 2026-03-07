import { ReactNode } from 'react';

type Tone = 'open' | 'pending' | 'completed' | 'assigned' | 'neutral' | 'primary' | 'amber' | 'navy';

type BadgeProps = {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  dot?: boolean;
};

const toneClasses: Record<Tone, string> = {
  primary:   'bg-[var(--wm-primary-light)] text-[var(--wm-primary-dark)] ring-[rgba(0,184,148,0.25)]',
  open:      'bg-[var(--wm-primary-light)] text-[var(--wm-primary-dark)] ring-[rgba(0,184,148,0.25)]',
  pending:   'bg-[var(--wm-amber-light)] text-[var(--wm-amber-dark)] ring-[rgba(245,158,11,0.25)]',
  amber:     'bg-[var(--wm-amber-light)] text-[var(--wm-amber-dark)] ring-[rgba(245,158,11,0.25)]',
  completed: 'bg-[var(--wm-blue-soft)] text-[var(--wm-blue-dark)] ring-[rgba(26,86,219,0.20)]',
  assigned:  'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:ring-indigo-800',
  navy:      'bg-[rgba(12,27,51,0.08)] text-[var(--wm-navy)] ring-[rgba(12,27,51,0.15)]',
  neutral:   'bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700',
};

const dotColors: Record<Tone, string> = {
  primary:   'bg-[var(--wm-primary)]',
  open:      'bg-[var(--wm-primary)]',
  pending:   'bg-[var(--wm-amber)]',
  amber:     'bg-[var(--wm-amber)]',
  completed: 'bg-[var(--wm-blue)]',
  assigned:  'bg-indigo-500',
  navy:      'bg-[var(--wm-navy)]',
  neutral:   'bg-zinc-400',
};

export default function Badge({ children, tone = 'neutral', className, dot = false }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${toneClasses[tone]}${className ? ` ${className}` : ''}`}
    >
      {dot ? (
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotColors[tone]}`} aria-hidden="true" />
      ) : null}
      {children}
    </span>
  );
}
