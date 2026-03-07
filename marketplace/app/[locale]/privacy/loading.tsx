import Skeleton from '@/components/ui/Skeleton';

export default function PrivacyLoading() {
  return (
    <main className="py-14">
      <div style={{ width: 'min(860px, calc(100% - 32px))', margin: '0 auto' }}>
        <div className="mb-6">
          <Skeleton height="h-16" />
        </div>
        <div className="flex flex-col gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border p-5"
              style={{ borderColor: 'var(--wm-border)', background: 'var(--wm-surface)' }}
            >
              <Skeleton height="h-5" className="mb-3 w-40" />
              <Skeleton lines={3} />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
