import Shell from '@/components/ui/Shell';
import Skeleton from '@/components/ui/Skeleton';

export default function StatusLoading() {
  return (
    <Shell>
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      </div>
    </Shell>
  );
}
