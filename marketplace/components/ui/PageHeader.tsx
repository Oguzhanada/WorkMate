import { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  badge?: ReactNode;
};

export default function PageHeader({ title, description, action, className, badge }: PageHeaderProps) {
  return (
    <div
      className={`flex flex-wrap items-start justify-between gap-4 rounded-2xl border bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/80${className ? ` ${className}` : ''}`}
      style={{
        borderColor: 'var(--wm-border)',
        boxShadow: 'var(--wm-shadow-md)'
      }}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1
            className="text-xl font-bold leading-tight tracking-tight"
            style={{fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)'}}
          >
            {title}
          </h1>
          {badge ? <span>{badge}</span> : null}
        </div>
        {description ? (
          <p className="text-sm leading-relaxed" style={{color: 'var(--wm-muted)'}}>
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
