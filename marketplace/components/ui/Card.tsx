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
    'rounded-2xl border p-5 ' +
    (glass
      ? 'border-[var(--wm-glass-border)] bg-[var(--wm-glass)] backdrop-blur-[24px] '
      : 'border-[var(--wm-glass-border)] bg-[var(--wm-surface)] backdrop-blur-[18px] ') +
    'shadow-[var(--wm-shadow-sm)] ' +
    (hover
      ? 'transition-all duration-200 cursor-pointer ' +
        'hover:-translate-y-1 ' +
        'hover:shadow-[var(--wm-shadow-lg)] ' +
        'hover:border-[rgba(22,155,98,0.35)] '
      : '');

  return (
    <article className={`${base}${className ? ` ${className}` : ''}`} style={style}>
      {children}
    </article>
  );
}
