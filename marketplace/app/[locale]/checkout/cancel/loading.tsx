import Skeleton from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <main className="py-14">
      <div style={{ width: 'min(440px, calc(100% - 32px))', margin: '0 auto' }}>
        <div
          className="rounded-2xl border p-6 text-center"
          style={{ borderColor: 'var(--wm-border)', background: 'var(--wm-surface)' }}
        >
          <Skeleton height="h-12" className="mb-4" />
          <Skeleton lines={2} />
        </div>
      </div>
    </main>
  );
}
