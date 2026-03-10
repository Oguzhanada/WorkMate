import Skeleton from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-48 rounded-2xl" />
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}
