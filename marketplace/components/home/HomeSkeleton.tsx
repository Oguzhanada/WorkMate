export default function HomeSkeleton() {
  return (
    <div className="space-y-4 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto h-24 max-w-7xl animate-pulse rounded-2xl" style={{ background: 'var(--wm-surface)' }} />
      <div className="mx-auto h-52 max-w-7xl animate-pulse rounded-2xl" style={{ background: 'var(--wm-surface)' }} />
      <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1,2,3].map((item) => (
          <div key={item} className="h-44 animate-pulse rounded-2xl" style={{ background: 'var(--wm-surface)' }} />
        ))}
      </div>
    </div>
  );
}
