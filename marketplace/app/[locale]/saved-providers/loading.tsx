import Skeleton from '@/components/ui/Skeleton';
import Shell from '@/components/ui/Shell';
import Card from '@/components/ui/Card';

export default function Loading() {
  return (
    <Shell>
      <Card>
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      </Card>
    </Shell>
  );
}
