'use client';

import { motion } from 'framer-motion';

export type JobStatus =
  | 'draft'
  | 'open'
  | 'quoted'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'disputed'
  | 'cancelled'
  | 'expired';

const STATUS_CONFIG: Record<
  JobStatus,
  { label: string; color: string; bg: string; pulse: boolean }
> = {
  draft:       { label: 'Draft',       color: 'var(--wm-muted)',        bg: 'var(--wm-surface)',       pulse: false },
  open:        { label: 'Open',        color: 'var(--wm-primary)',      bg: 'var(--wm-primary-light)', pulse: true  },
  quoted:      { label: 'Quoted',      color: 'var(--wm-amber-dark)',   bg: 'var(--wm-amber-light)',   pulse: true  },
  accepted:    { label: 'Accepted',    color: 'var(--wm-success)',      bg: 'var(--wm-primary-light)', pulse: false },
  in_progress: { label: 'In Progress', color: 'var(--wm-blue-dark)',    bg: 'var(--wm-blue-soft)',     pulse: false },
  completed:   { label: 'Completed',   color: 'var(--wm-success)',      bg: 'var(--wm-primary-light)', pulse: false },
  disputed:    { label: 'Disputed',    color: 'var(--wm-destructive)',  bg: '#fef2f2',                 pulse: true  },
  cancelled:   { label: 'Cancelled',   color: 'var(--wm-muted)',        bg: 'var(--wm-surface)',       pulse: false },
  expired:     { label: 'Expired',     color: 'var(--wm-muted)',        bg: 'var(--wm-surface)',       pulse: false },
};

type Props = {
  status: JobStatus;
  size?: 'sm' | 'md';
  className?: string;
};

export default function JobStatusBadge({ status, size = 'md', className = '' }: Props) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  const isDisputed = status === 'disputed';

  const padding = size === 'sm' ? '2px 8px' : '3px 10px';
  const fontSize = size === 'sm' ? '0.7rem' : '0.75rem';

  // Use simpler inline animation props to avoid Variants type conflicts
  const initialScale = isDisputed ? { x: 0, opacity: 0 } : { scale: 0.85, opacity: 0 };
  const animateProps = isDisputed
    ? { x: [0, -5, 5, -4, 4, 0], opacity: 1 }
    : { scale: 1, opacity: 1 };
  const transitionProps = isDisputed
    ? { duration: 0.45 }
    : { type: 'spring' as const, stiffness: 400, damping: 25 };

  return (
    <motion.span
      initial={initialScale}
      animate={animateProps}
      transition={transitionProps}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding,
        borderRadius: 999,
        fontSize,
        fontWeight: 600,
        letterSpacing: '0.02em',
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.color}22`,
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.pulse && (
        <motion.span
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' as const }}
          style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: cfg.color,
            flexShrink: 0,
          }}
        />
      )}
      {cfg.label}
    </motion.span>
  );
}
