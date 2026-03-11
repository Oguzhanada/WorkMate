import Skeleton from '@/components/ui/Skeleton';

export default function CreditsLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <Skeleton className="h-10 w-48 rounded-2xl" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-3xl" />
    </div>
  );
}
