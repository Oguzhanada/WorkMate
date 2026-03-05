import { ReactNode } from 'react';

type StatCardProps = {
  label: string;
  value: number;
  icon: ReactNode;
};

export default function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <article className="rounded-2xl border border-zinc-200/70 bg-white/90 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.06)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80 dark:shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
        <span className="text-zinc-500 dark:text-zinc-300">{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{value}</p>
    </article>
  );
}
