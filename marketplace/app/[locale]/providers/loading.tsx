import Shell from '@/components/ui/Shell';
import Skeleton from '@/components/ui/Skeleton';

export default function ProvidersLoading() {
  return (
    <Shell
      header={
        <div className="rounded-3xl [border:1px_solid_var(--wm-border)] [background:var(--wm-surface)] p-5 dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <Skeleton height="h-6" className="w-48" />
              <div className="mt-2">
                <Skeleton height="h-4" className="w-80" />
              </div>
            </div>
            <Skeleton height="h-10" className="w-40" />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl border border-zinc-200/70 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <Skeleton height="h-3" className="w-1/2" />
                <div className="mt-3">
                  <Skeleton height="h-7" className="w-12" />
                </div>
              </div>
            ))}
          </div>
        </div>
      }
    >
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl [border:1px_solid_var(--wm-border)] [background:var(--wm-surface)] p-5 dark:border-zinc-800 dark:bg-zinc-900/80"
          >
            <div className="flex items-start justify-between gap-3">
              <Skeleton height="h-5" className="w-1/2" />
              <Skeleton height="h-5" className="w-16 rounded-full" />
            </div>
            <div className="mt-3 space-y-2">
              <Skeleton height="h-4" className="w-full" />
              <Skeleton height="h-4" className="w-4/5" />
              <Skeleton height="h-3" className="w-1/3" />
            </div>
            <div className="mt-4 flex gap-2">
              <Skeleton height="h-8" className="w-28 rounded-xl" />
              <Skeleton height="h-8" className="w-24 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}
