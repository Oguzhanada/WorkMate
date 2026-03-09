import Shell from '@/components/ui/Shell';
import Skeleton from '@/components/ui/Skeleton';

export default function AdminAnalyticsLoading() {
  return (
    <Shell>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        {/* PageHeader skeleton */}
        <Skeleton height="h-20" />

        {/* Stat row skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton height="h-28" />
          <Skeleton height="h-28" />
          <Skeleton height="h-28" />
          <Skeleton height="h-28" />
        </div>

        {/* Date filter skeleton */}
        <Skeleton height="h-10" className="max-w-xs" />

        {/* Funnel panels skeleton */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="space-y-3 rounded-2xl border p-6"
            style={{ borderColor: 'var(--wm-border)', background: 'var(--wm-surface)' }}
          >
            <Skeleton height="h-6" className="max-w-xs" />
            <Skeleton height="h-5" />
            <Skeleton height="h-5" className="max-w-4xl" />
            <Skeleton height="h-5" className="max-w-2xl" />
            <Skeleton height="h-5" className="max-w-xl" />
          </div>
        ))}
      </div>
    </Shell>
  );
}
