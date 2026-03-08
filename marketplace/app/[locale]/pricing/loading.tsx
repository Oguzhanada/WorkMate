import Skeleton from '@/components/ui/Skeleton';

export default function PricingLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      {/* PageHeader skeleton */}
      <div
        className="rounded-2xl border p-5"
        style={{
          borderColor: 'var(--wm-border)',
          background: 'var(--wm-surface)',
          boxShadow: 'var(--wm-shadow-md)',
        }}
      >
        <Skeleton height="h-6" className="w-32" />
        <div className="mt-2">
          <Skeleton height="h-4" className="w-80" />
        </div>
      </div>

      {/* Tier cards skeleton */}
      <div className="grid gap-6 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl border p-5"
            style={{
              borderColor: 'var(--wm-border)',
              background: 'var(--wm-surface)',
              boxShadow: 'var(--wm-shadow-md)',
            }}
          >
            <div className="flex flex-col gap-5">
              {/* Tier label + name */}
              <div className="space-y-2">
                <Skeleton height="h-3" className="w-16" />
                <Skeleton height="h-6" className="w-28" />
              </div>
              {/* Price */}
              <div className="space-y-1.5">
                <Skeleton height="h-10" className="w-20" />
                <Skeleton height="h-3" className="w-36" />
              </div>
              {/* CTA button */}
              <Skeleton height="h-10" className="w-full rounded-xl" />
              {/* Divider */}
              <hr style={{ borderColor: 'var(--wm-border)' }} />
              {/* Feature list */}
              <div className="space-y-2.5">
                {Array.from({ length: i === 2 ? 8 : i === 1 ? 6 : 4 }).map((_, j) => (
                  <Skeleton key={j} height="h-4" className={j % 2 === 0 ? 'w-full' : 'w-4/5'} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer note skeleton */}
      <div className="flex justify-center">
        <Skeleton height="h-4" className="w-72" />
      </div>
    </div>
  );
}
