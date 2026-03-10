export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      <div className="h-8 w-64 animate-pulse rounded-xl" style={{ background: 'var(--wm-subtle)' }} />
      <div className="h-4 w-96 animate-pulse rounded-lg" style={{ background: 'var(--wm-subtle)' }} />
      <div className="grid gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl" style={{ background: 'var(--wm-subtle)' }} />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl" style={{ background: 'var(--wm-subtle)' }} />
        ))}
      </div>
    </div>
  );
}
