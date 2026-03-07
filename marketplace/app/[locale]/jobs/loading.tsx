import Shell from '@/components/ui/Shell';
import Skeleton from '@/components/ui/Skeleton';

export default function JobsLoading() {
  return (
    <Shell
      header={
        <div className="rounded-3xl p-5" style={{ border: '1px solid var(--wm-border)', background: 'var(--wm-surface)' }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <Skeleton height="h-6" className="w-32" />
              <div className="mt-2">
                <Skeleton height="h-4" className="w-64" />
              </div>
            </div>
            <Skeleton height="h-10" className="w-32" />
          </div>
        </div>
      }
    >
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl p-5"
            style={{ border: '1px solid var(--wm-border)', background: 'var(--wm-surface)' }}
          >
            <div className="flex items-start justify-between gap-2">
              <Skeleton height="h-4" className="w-2/3" />
              <Skeleton height="h-5" className="w-16 rounded-full" />
            </div>
            <div className="mt-3 space-y-2">
              <Skeleton height="h-3" className="w-3/4" />
              <Skeleton height="h-3" className="w-1/2" />
              <Skeleton height="h-3" className="w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}
