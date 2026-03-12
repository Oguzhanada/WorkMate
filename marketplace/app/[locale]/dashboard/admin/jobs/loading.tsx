import Shell from '@/components/ui/Shell';
import Skeleton from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <Shell>
      <Skeleton className="h-96 w-full rounded-2xl" />
    </Shell>
  );
}
