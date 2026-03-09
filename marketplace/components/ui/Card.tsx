import { ReactNode, CSSProperties } from 'react';

type CardProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  hover?: boolean;
  glass?: boolean;
};

export default function Card({ children, className, style, hover = false, glass = false }: CardProps) {
  const base =
    'rounded-[22px] border p-5 ' +
    'border-[var(--wm-border)] ' +
    (glass
      ? 'bg-[var(--wm-glass)] backdrop-blur-sm '
      : 'bg-white dark:bg-zinc-900/80 ') +
    'shadow-[var(--wm-shadow-sm)] ' +
    (hover
      ? 'transition-all duration-[var(--wm-transition-slow)] ' +
        'hover:-translate-y-1 hover:shadow-[var(--wm-shadow-lg)] ' +
        'hover:border-[rgba(16,185,129,0.25)] '
      : '');

  return (
    <article className={`${base}${className ? ` ${className}` : ''}`} style={style}>
      {children}
    </article>
  );
}
