import Shell from '@/components/ui/Shell';
import Skeleton from '@/components/ui/Skeleton';

export default function MessagesLoading() {
  return (
    <Shell>
      <div className="rounded-2xl p-5" style={{ border: '1px solid var(--wm-border)', background: 'var(--wm-surface)' }}>
        <Skeleton height="h-6" className="w-44" />
        <div className="mt-2">
          <Skeleton height="h-4" className="w-72" />
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl p-5"
            style={{ border: '1px solid var(--wm-border)', background: 'var(--wm-surface)' }}
          >
            <Skeleton height="h-3" className="w-1/2" />
            <div className="mt-3 space-y-2">
              <Skeleton height="h-4" className="w-full" />
              <Skeleton height="h-4" className="w-4/5" />
            </div>
            <div className="mt-3">
              <Skeleton height="h-3" className="w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}
