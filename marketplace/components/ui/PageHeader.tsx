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
      className={`flex flex-wrap items-start justify-between gap-4 rounded-2xl border p-6${className ? ` ${className}` : ''}`}
      style={{
        background: 'var(--wm-surface)',
        borderColor: 'rgba(27,42,74,0.12)',
        borderLeftWidth: '4px',
        borderLeftColor: 'var(--wm-primary)',
        boxShadow: 'var(--wm-shadow-md)'
      }}
    >
      <div className="flex min-w-0 flex-col gap-1.5">
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
