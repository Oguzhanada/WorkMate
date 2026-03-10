'use client';

import dynamic from 'next/dynamic';
import type { SearchFiltersState } from '@/components/search/SearchFilters';

/**
 * Thin client wrapper that dynamically imports MapSearchView with SSR disabled.
 * This prevents Leaflet (and its transitive dependencies) from being evaluated
 * on the server, which would cause SSR timeouts since Leaflet requires `window`.
 */
const MapSearchView = dynamic(() => import('@/components/search/MapSearchView'), {
  ssr: false,
  loading: () => <FindServicesPlaceholder />,
});

type FindServicesClientProps = {
  locale: string;
  initialFilters: SearchFiltersState;
};

export default function FindServicesClient({ locale, initialFilters }: FindServicesClientProps) {
  return <MapSearchView locale={locale} initialFilters={initialFilters} />;
}

/** Full-page placeholder shown while the client bundle loads */
function FindServicesPlaceholder() {
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
      {/* Filter bar placeholder */}
      <div
        style={{
          background: 'var(--wm-surface)',
          borderBottom: '1px solid var(--wm-border)',
          padding: '16px 20px',
        }}
      >
        <div
          style={{
            height: '40px',
            borderRadius: '12px',
            background: 'var(--wm-surface-alt)',
            border: '1px solid var(--wm-border)',
          }}
        />
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          {[96, 96, 96, 80].map((w, i) => (
            <div
              key={i}
              style={{
                width: `${w}px`,
                height: '32px',
                borderRadius: '8px',
                background: 'var(--wm-surface-alt)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Split view placeholder */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: '55%', padding: '16px 20px' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                background: 'var(--wm-surface)',
                border: '1px solid var(--wm-border)',
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '12px',
                height: '100px',
              }}
            />
          ))}
        </div>
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
          <p
            style={{
              color: 'var(--wm-muted)',
              fontSize: '14px',
              fontFamily: 'var(--wm-font-sans)',
            }}
          >
            Loading map...
          </p>
        </div>
      </div>
    </div>
  );
}
