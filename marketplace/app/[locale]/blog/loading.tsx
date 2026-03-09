import Skeleton from '@/components/ui/Skeleton';

export default function BlogLoading() {
  return (
    <main className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Skeleton height="h-16" className="mb-4" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-2xl border p-4" style={{ borderColor: 'var(--wm-border)' }}>
              <Skeleton height="h-5" className="mb-2" />
              <Skeleton lines={3} />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
