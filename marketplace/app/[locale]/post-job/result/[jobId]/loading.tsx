import Skeleton from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
    </div>
  );
}
