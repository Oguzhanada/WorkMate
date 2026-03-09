import Shell from '@/components/ui/Shell';
import Skeleton from '@/components/ui/Skeleton';

export default function AdminStatsLoading() {
  return (
    <Shell>
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        {/* PageHeader skeleton */}
        <Skeleton height="h-20" />

        {/* Date filter skeleton */}
        <Skeleton height="h-10" className="max-w-sm" />

        {/* Section label skeleton */}
        <Skeleton height="h-5" className="max-w-xs" />

        {/* Users & Providers row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height="h-28" />
          ))}
        </div>

        {/* Jobs & Activity row */}
        <Skeleton height="h-5" className="max-w-xs" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height="h-28" />
          ))}
        </div>

        {/* Quality row */}
        <Skeleton height="h-5" className="max-w-xs" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height="h-28" />
          ))}
        </div>

        {/* Growth chart skeleton */}
        <Skeleton height="h-5" className="max-w-xs" />
        <div
          className="rounded-2xl border p-6"
          style={{ borderColor: 'var(--wm-border)', background: 'var(--wm-surface)' }}
        >
          <div className="flex items-end gap-3" style={{ height: '160px' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="flex-1 rounded-t-lg" height="h-full" />
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}
