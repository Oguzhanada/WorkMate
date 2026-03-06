import Skeleton from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}
