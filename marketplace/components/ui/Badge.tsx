import { ReactNode } from 'react';

type Tone = 'open' | 'pending' | 'completed' | 'assigned' | 'neutral';

type BadgeProps = {
  children: ReactNode;
  tone?: Tone;
  className?: string;
};

const toneClasses: Record<Tone, string> = {
  open: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800',
  pending: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-800',
  completed: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:ring-sky-800',
  assigned: 'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:ring-indigo-800',
  neutral: 'bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700',
};

export default function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${toneClasses[tone]}${
        className ? ` ${className}` : ''
      }`}
    >
      {children}
    </span>
  );
}
