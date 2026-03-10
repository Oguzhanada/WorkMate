'use client';

import { Star } from 'lucide-react';

type Props = {
  size?: 'sm' | 'md';
  className?: string;
};

const sizeStyles = {
  sm: { fontSize: '0.6875rem', padding: '0.125rem 0.5rem', iconSize: 'h-3 w-3', gap: 'gap-1' },
  md: { fontSize: '0.75rem', padding: '0.25rem 0.625rem', iconSize: 'h-3.5 w-3.5', gap: 'gap-1.5' },
};

export default function FoundingProBadge({ size = 'sm', className = '' }: Props) {
  const s = sizeStyles[size];

  return (
    <span
      className={`inline-flex items-center ${s.gap} rounded-full font-semibold ${className}`}
      style={{
        fontSize: s.fontSize,
        padding: s.padding,
        background: 'var(--wm-grad-warm, linear-gradient(135deg, var(--wm-amber-light), var(--wm-primary-faint)))',
        color: 'var(--wm-amber-dark)',
        border: '1px solid var(--wm-amber)',
        boxShadow: 'var(--wm-shadow-xs)',
      }}
    >
      <Star className={s.iconSize} style={{ color: 'var(--wm-amber)' }} />
      Founding Pro
    </span>
  );
}
