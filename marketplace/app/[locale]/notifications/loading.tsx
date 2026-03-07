import Shell from '@/components/ui/Shell';
import Skeleton from '@/components/ui/Skeleton';

export default function NotificationsLoading() {
  return (
    <Shell>
      <div className="rounded-2xl [border:1px_solid_var(--wm-border)] [background:var(--wm-surface)] p-5 dark:border-zinc-800 dark:bg-zinc-900/80">
        <Skeleton height="h-6" className="w-36" />
        <div className="mt-2">
          <Skeleton height="h-4" className="w-72" />
        </div>
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-zinc-100 p-3 dark:border-zinc-800">
              <Skeleton height="h-8" className="w-8 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton height="h-4" className="w-3/4" />
                <Skeleton height="h-3" className="w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}
