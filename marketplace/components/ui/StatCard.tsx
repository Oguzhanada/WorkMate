import { ReactNode } from 'react';
import Card from '@/components/ui/Card';

type StatCardProps = {
  label: string;
  value: number | string;
  icon?: ReactNode;
};

export default function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
        {icon ? <span className="text-zinc-500 dark:text-zinc-300">{icon}</span> : null}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{value}</p>
    </Card>
  );
}
