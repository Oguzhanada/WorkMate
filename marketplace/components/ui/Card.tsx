import { ReactNode } from 'react';

type CardProps = {
  children: ReactNode;
  className?: string;
};

export default function Card({ children, className }: CardProps) {
  return (
    <article
      className={`rounded-2xl border border-zinc-200/70 bg-white/90 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.06)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80 dark:shadow-[0_10px_24px_rgba(0,0,0,0.35)]${
        className ? ` ${className}` : ''
      }`}
    >
      {children}
    </article>
  );
}
