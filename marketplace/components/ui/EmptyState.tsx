import { ReactNode } from 'react';

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      {icon ? (
        <span className="text-zinc-400 dark:text-zinc-500">{icon}</span>
      ) : null}
      <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{title}</p>
      {description ? (
        <p className="max-w-xs text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
