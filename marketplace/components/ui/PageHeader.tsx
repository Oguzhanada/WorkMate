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
      className={`flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-l-4 p-6 shadow-[var(--wm-shadow-md)]${className ? ` ${className}` : ''}`}
      style={{
        background: 'var(--wm-surface)',
        borderColor: 'var(--wm-border-soft)',
        borderLeftColor: 'var(--wm-primary)',
      }}
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1
            className="text-xl font-bold leading-tight tracking-tight"
            style={{fontFamily: 'var(--wm-font-display)', color: 'var(--wm-text-strong)'}}
          >
            {title}
          </h1>
          {badge ? <span>{badge}</span> : null}
        </div>
        {description ? (
          <p className="text-sm leading-relaxed" style={{color: 'var(--wm-text-muted)'}}>
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
