import Skeleton from '@/components/ui/Skeleton';

export default function FindServicesLoading() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--wm-bg)',
      }}
    >
      {/* Filter bar skeleton */}
      <div
        style={{
          background: 'var(--wm-surface)',
          borderBottom: '1px solid var(--wm-border)',
          padding: '16px 20px',
        }}
      >
        <Skeleton className="w-full" height="h-10" />
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <Skeleton className="w-24" height="h-8" />
          <Skeleton className="w-24" height="h-8" />
          <Skeleton className="w-24" height="h-8" />
          <Skeleton className="w-20" height="h-8" />
        </div>
      </div>

      {/* Split view skeleton */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* List skeleton */}
        <div style={{ width: '55%', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              style={{
                background: 'var(--wm-surface)',
                border: '1px solid var(--wm-border)',
                borderRadius: '16px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', gap: '14px' }}>
                <Skeleton className="h-14 w-14 rounded-[14px]" />
                <div style={{ flex: 1 }}>
                  <Skeleton className="w-32 mb-2" height="h-4" />
                  <Skeleton className="w-48 mb-2" height="h-3" />
                  <Skeleton className="w-24" height="h-3" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Map skeleton */}
        <div
          style={{
            width: '45%',
            background: 'var(--wm-surface-alt)',
            borderLeft: '1px solid var(--wm-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <Skeleton className="w-12 h-12 rounded-full mx-auto mb-3" />
            <Skeleton className="w-24 mx-auto" height="h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
