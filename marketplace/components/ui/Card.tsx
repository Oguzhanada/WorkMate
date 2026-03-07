import { ReactNode } from 'react';

type CardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
};

export default function Card({ children, className, hover = false, glass = false }: CardProps) {
  const base =
    'rounded-2xl border p-5 ' +
    'border-[var(--wm-border)] ' +
    (glass
      ? 'bg-[var(--wm-glass)] backdrop-blur-sm '
      : 'bg-white dark:bg-zinc-900/80 ') +
    'shadow-[var(--wm-shadow-md)] ' +
    (hover
      ? 'transition-all duration-[var(--wm-transition-slow)] ' +
        'hover:-translate-y-1 hover:shadow-[var(--wm-shadow-xl)] ' +
        'hover:border-[rgba(0,184,148,0.25)] '
      : '');

  return (
    <article className={`${base}${className ? ` ${className}` : ''}`}>
      {children}
    </article>
  );
}
