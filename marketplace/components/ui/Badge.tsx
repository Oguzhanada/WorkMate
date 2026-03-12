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
  // Emerald — open jobs, active status
  primary:   'bg-[var(--wm-primary-light)] text-[var(--wm-primary-dark)] ring-[rgba(22,155,98,0.22)]',
  open:      'bg-[var(--wm-primary-light)] text-[var(--wm-primary-dark)] ring-[rgba(22,155,98,0.22)]',
  // Gold — pending, awaiting action
  pending:   'bg-[var(--wm-gold-light)] text-[var(--wm-gold-dark)] ring-[rgba(212,168,71,0.25)]',
  amber:     'bg-[var(--wm-gold-light)] text-[var(--wm-gold-dark)] ring-[rgba(212,168,71,0.25)]',
  // Blue — completed, informational
  completed: 'bg-[var(--wm-blue-soft)] text-[var(--wm-blue-dark)] ring-[rgba(26,86,219,0.18)]',
  assigned:  'bg-[var(--wm-blue-soft)] text-[var(--wm-blue)] ring-[rgba(26,86,219,0.18)]',
  // Navy — trust / admin
  navy:      'bg-[rgba(27,42,74,0.08)] text-[var(--wm-navy)] ring-[rgba(27,42,74,0.15)]',
  // Neutral — secondary info
  neutral:   'bg-[var(--color-neutral-100)] text-[var(--wm-text-soft)] ring-[var(--wm-border)]',
};

const dotColors: Record<Tone, string> = {
  primary:   'bg-[var(--wm-primary)]',
  open:      'bg-[var(--wm-primary)]',
  pending:   'bg-[var(--wm-gold)]',
  amber:     'bg-[var(--wm-gold)]',
  completed: 'bg-[var(--wm-blue)]',
  assigned:  'bg-[var(--wm-blue)]',
  navy:      'bg-[var(--wm-navy)]',
  neutral:   'bg-[var(--wm-text-soft)]',
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
