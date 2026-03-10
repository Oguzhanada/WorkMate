import { ReactNode } from 'react';

type Tone = 'open' | 'pending' | 'completed' | 'assigned' | 'neutral' | 'primary' | 'amber' | 'navy';

type BadgeProps = {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  dot?: boolean;
  title?: string;
};

const toneClasses: Record<Tone, string> = {
  primary:   'bg-[var(--wm-primary-light)] text-[var(--wm-primary-dark)] ring-[rgba(0,184,148,0.25)]',
  open:      'bg-[var(--wm-primary-light)] text-[var(--wm-primary-dark)] ring-[rgba(0,184,148,0.25)]',
  pending:   'bg-[var(--wm-amber-light)] text-[var(--wm-amber-dark)] ring-[rgba(245,158,11,0.25)]',
  amber:     'bg-[var(--wm-amber-light)] text-[var(--wm-amber-dark)] ring-[rgba(245,158,11,0.25)]',
  completed: 'bg-[var(--wm-blue-soft)] text-[var(--wm-blue-dark)] ring-[rgba(26,86,219,0.20)]',
  assigned:  'bg-[var(--wm-blue-soft)] text-[var(--wm-blue)] ring-[var(--wm-blue-soft)]',
  navy:      'bg-[rgba(12,27,51,0.08)] text-[var(--wm-navy)] ring-[rgba(12,27,51,0.15)]',
  neutral:   'bg-[var(--wm-surface-alt)] text-[var(--wm-muted)] ring-[var(--wm-border)]',
};

const dotColors: Record<Tone, string> = {
  primary:   'bg-[var(--wm-primary)]',
  open:      'bg-[var(--wm-primary)]',
  pending:   'bg-[var(--wm-amber)]',
  amber:     'bg-[var(--wm-amber)]',
  completed: 'bg-[var(--wm-blue)]',
  assigned:  'bg-[var(--wm-blue)]',
  navy:      'bg-[var(--wm-navy)]',
  neutral:   'bg-[var(--wm-subtle)]',
};

export default function Badge({ children, tone = 'neutral', className, dot = false, title }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${toneClasses[tone]}${className ? ` ${className}` : ''}`}
      title={title}
    >
      {dot ? (
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotColors[tone]}`} aria-hidden="true" />
      ) : null}
      {children}
    </span>
  );
}
