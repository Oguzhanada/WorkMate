import { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export default function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div
      className={`flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-zinc-200/70 bg-white/90 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.06)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80${
        className ? ` ${className}` : ''
      }`}
    >
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
