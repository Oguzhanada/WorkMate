type TagProps = {
  children: React.ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
};

const toneMap: Record<NonNullable<TagProps['tone']>, string> = {
  default: 'bg-[var(--color-neutral-100)] text-[var(--color-text-secondary)]',
  success: 'bg-[rgba(22,163,74,0.12)] text-[var(--color-success)]',
  warning: 'bg-[rgba(217,119,6,0.12)] text-[var(--color-warning)]',
  error: 'bg-[rgba(220,38,38,0.12)] text-[var(--color-error)]',
  info: 'bg-[rgba(37,99,235,0.12)] text-[var(--color-info)]',
};

export default function Tag({ children, tone = 'default', className = '' }: TagProps) {
  return (
    <span className={'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ' + toneMap[tone] + ' ' + className}>
      {children}
    </span>
  );
}
