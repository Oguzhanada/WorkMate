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
      ? 'border-[rgba(255,255,255,0.50)] bg-[rgba(255,255,255,0.55)] backdrop-blur-[24px] '
      : 'border-[rgba(255,255,255,0.70)] bg-[rgba(255,255,255,0.82)] backdrop-blur-[18px] ') +
    'shadow-[0_4px_24px_rgba(27,42,74,0.07),0_1px_4px_rgba(27,42,74,0.04)] ' +
    (hover
      ? 'transition-all duration-200 cursor-pointer ' +
        'hover:-translate-y-1 ' +
        'hover:shadow-[0_12px_36px_rgba(22,155,98,0.12),0_4px_12px_rgba(27,42,74,0.06)] ' +
        'hover:border-[rgba(22,155,98,0.35)] '
      : '');

  return (
    <article className={`${base}${className ? ` ${className}` : ''}`} style={style}>
      {children}
    </article>
  );
}
