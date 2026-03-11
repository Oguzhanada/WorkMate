import Skeleton from '@/components/ui/Skeleton';

export default function ReferralsLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <Skeleton className="h-10 w-48 rounded-2xl" />
      <Skeleton className="h-40 rounded-3xl" />
      <Skeleton className="h-64 rounded-3xl" />
    </div>
  );
}
