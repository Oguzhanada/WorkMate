import { ReactNode } from 'react';

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
};

export default function EmptyState({ icon, title, description, action, compact = false }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 text-center ${compact ? 'py-8' : 'py-14'}`}
    >
      {icon ? (
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{backgroundColor: 'var(--wm-primary-light)', color: 'var(--wm-primary)'}}
        >
          {icon}
        </div>
      ) : null}
      <div className="space-y-1.5">
        <p
          className="text-base font-bold"
          style={{fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)'}}
        >
          {title}
        </p>
        {description ? (
          <p className="max-w-xs text-sm leading-relaxed" style={{color: 'var(--wm-muted)'}}>
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
