'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, usePathname } from 'next/navigation';
import { Map as MapIcon, List, ChevronUp, SearchX, Briefcase, ArrowRight } from 'lucide-react';
import SearchFilters, { type SearchFiltersState } from './SearchFilters';
import ProviderCard, { type ProviderData } from './ProviderCard';
import type { MapBounds } from './MapView';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { COUNTY_COORDS, findNearestCounty } from '@/lib/ireland/coordinates';

// Dynamic import — Leaflet has no SSR support
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--wm-surface-alt)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <MapIcon size={32} style={{ color: 'var(--wm-muted)', marginBottom: '8px' }} />
        <p style={{ color: 'var(--wm-muted)', fontSize: '14px', fontFamily: 'var(--wm-font-sans)' }}>
          Loading map...
        </p>
      </div>
    </div>
  ),
});

type MapSearchViewProps = {
  locale: string;
  initialFilters?: SearchFiltersState;
};

const DEFAULT_FILTERS: SearchFiltersState = {
  q: '',
  county: 'Any',
  sort: 'relevance',
  verified_only: false,
  budget: '',
};

/** Build URLSearchParams from filters, omitting defaults */
function filtersToSearchParams(f: SearchFiltersState): URLSearchParams {
  const params = new URLSearchParams();
  if (f.q) params.set('q', f.q);
  if (f.county && f.county !== 'Any') params.set('county', f.county);
  if (f.sort && f.sort !== 'relevance') params.set('sort', f.sort);
  if (f.verified_only) params.set('verified_only', 'true');
  if (f.budget) params.set('budget', f.budget);
  return params;
}

export default function MapSearchView({ locale, initialFilters }: MapSearchViewProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [filters, setFilters] = useState<SearchFiltersState>(initialFilters ?? DEFAULT_FILTERS);
  const [providers, setProviders] = useState<ProviderData[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [highlightedProviderId, setHighlightedProviderId] = useState<string | null>(null);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [page, setPage] = useState(1);
  const [geoCenter, setGeoCenter] = useState<[number, number] | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // Sync filters to URL (skip first render to avoid replacing the initial URL)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const params = filtersToSearchParams(filters);
    const qs = params.toString();
    const newUrl = qs ? `${pathname}?${qs}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [filters, pathname, router]);

  // Auto-detect browser location and set county filter + map center on first load
  useEffect(() => {
    if (!navigator.geolocation || (initialFilters?.county && initialFilters.county !== 'Any')) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const county = findNearestCounty(latitude, longitude);
        if (county) {
          setFilters((prev) => ({ ...prev, county }));
          setGeoCenter([latitude, longitude]);
        }
      },
      () => { /* permission denied or unavailable — silently ignore */ },
      { timeout: 5000 }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch providers from API
  const fetchProviders = useCallback(async (f: SearchFiltersState, pageNum: number) => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);

    const params = new URLSearchParams();
    if (f.q) params.set('q', f.q);
    if (f.county && f.county !== 'Any') params.set('county', f.county);
    params.set('sort', f.sort);
    params.set('verified_only', f.verified_only ? 'true' : 'false');
    if (f.budget) params.set('budget', f.budget);
    params.set('page', String(pageNum));
    params.set('limit', '24');

    try {
      const res = await fetch(`/api/providers/search?${params.toString()}`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setProviders(data.providers ?? []);
      setTotalResults(data.total ?? 0);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Provider search error:', err);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  // Debounced fetch on filter change
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchProviders(filters, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters, fetchProviders]);

  // Filter providers by map bounds (client-side geo filtering)
  const visibleProviders = useMemo(() => {
    if (!mapBounds) return providers;

    return providers.filter((p) => {
      // Check if any of the provider's counties fall within the visible map bounds
      for (const county of p.counties) {
        const coords = COUNTY_COORDS[county];
        if (coords) {
          const [lat, lng] = coords;
          if (
            lat >= mapBounds.south &&
            lat <= mapBounds.north &&
            lng >= mapBounds.west &&
            lng <= mapBounds.east
          ) {
            return true;
          }
        }
      }
      return false;
    });
  }, [providers, mapBounds]);

  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    setMapBounds(bounds);
  }, []);

  const handleFilterChange = useCallback((newFilters: SearchFiltersState) => {
    setFilters(newFilters);
  }, []);

  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProviders(filters, nextPage);
  }, [page, filters, fetchProviders]);

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const displayProviders = mapBounds ? visibleProviders : providers;
  const displayCount = displayProviders.length;

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
      {/* Filter bar */}
      <SearchFilters
        filters={filters}
        onChange={handleFilterChange}
        totalResults={totalResults}
        loading={loading}
      />

      {/* Split view container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Left panel: Provider list */}
        <div
          ref={listRef}
          className="search-list-panel"
          style={{
            width: '55%',
            overflowY: 'auto',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Results header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '8px',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 700,
                fontFamily: 'var(--wm-font-display)',
                color: 'var(--wm-text)',
              }}
            >
              {loading
                ? 'Searching...'
                : mapBounds
                  ? `${visibleProviders.length} in map area`
                  : `Showing ${displayCount} of ${totalResults} provider${totalResults !== 1 ? 's' : ''}`}
            </h2>
            {mapBounds && visibleProviders.length < providers.length && (
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--wm-muted)',
                  fontFamily: 'var(--wm-font-sans)',
                }}
              >
                Zoom out to see all {providers.length}
              </span>
            )}
          </div>

          {/* Loading skeleton */}
          {loading && providers.length === 0 && (
            <>
              {Array.from({ length: 6 }).map((_, i) => (
                <ProviderCardSkeleton key={i} />
              ))}
            </>
          )}

          {/* Provider cards */}
          {displayProviders.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              locale={locale}
              isHighlighted={highlightedProviderId === provider.id}
              onHover={setHighlightedProviderId}
            />
          ))}

          {/* Empty state */}
          {!loading && providers.length === 0 && (
            <EmptyState
              filters={filters}
              locale={locale}
              onClearFilters={() => handleFilterChange(DEFAULT_FILTERS)}
            />
          )}

          {/* Load more + pagination info */}
          {!loading && providers.length > 0 && providers.length < totalResults && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <p
                style={{
                  margin: '0 0 10px',
                  fontSize: '13px',
                  color: 'var(--wm-muted)',
                  fontFamily: 'var(--wm-font-sans)',
                }}
              >
                Showing {providers.length} of {totalResults} providers
              </p>
              <Button variant="secondary" size="md" onClick={handleLoadMore}>
                Load more providers
              </Button>
            </div>
          )}

          {/* Scroll to top */}
          {providers.length > 6 && (
            <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
              <button
                onClick={scrollToTop}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--wm-muted)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '13px',
                  fontFamily: 'var(--wm-font-sans)',
                }}
              >
                <ChevronUp size={14} /> Back to top
              </button>
            </div>
          )}
        </div>

        {/* Right panel: Map */}
        <div
          className="search-map-panel"
          style={{
            width: '45%',
            position: 'relative',
            borderLeft: '1px solid var(--wm-border)',
          }}
        >
          <MapView
            providers={mapBounds ? visibleProviders : providers}
            highlightedProviderId={highlightedProviderId}
            onProviderHover={setHighlightedProviderId}
            onBoundsChange={handleBoundsChange}
            locale={locale}
            flyToCenter={geoCenter}
          />
        </div>
      </div>

      {/* Mobile toggle FAB */}
      <div className="search-mobile-toggle">
        <Button
          variant="navy"
          size="md"
          onClick={() => setMobileView(mobileView === 'list' ? 'map' : 'list')}
          leftIcon={mobileView === 'list' ? <MapIcon size={16} /> : <List size={16} />}
        >
          {mobileView === 'list' ? 'Show Map' : 'Show List'}
        </Button>
      </div>

      {/* Scoped responsive styles */}
      <style>{`
        /* Default: hide mobile toggle */
        .search-mobile-toggle {
          display: none;
        }

        @media (max-width: 768px) {
          .search-list-panel {
            width: 100% !important;
            display: ${mobileView === 'list' ? 'flex' : 'none'} !important;
          }
          .search-map-panel {
            width: 100% !important;
            display: ${mobileView === 'map' ? 'block' : 'none'} !important;
            border-left: none !important;
          }
          .search-mobile-toggle {
            display: flex;
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.25);
            border-radius: 24px;
          }
        }

        /* Leaflet popup override for WorkMate styling */
        .leaflet-popup-content-wrapper {
          border-radius: 14px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
          padding: 0 !important;
        }
        .leaflet-popup-content {
          margin: 14px !important;
          font-family: var(--wm-font-sans) !important;
        }
        .leaflet-popup-tip {
          box-shadow: none !important;
        }

        /* Custom marker override — remove default Leaflet icon background */
        .wm-map-marker {
          background: none !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}

// ── Empty state component ───────────────────────────────────────────────────

function EmptyState({
  filters,
  locale,
  onClearFilters,
}: {
  filters: SearchFiltersState;
  locale: string;
  onClearFilters: () => void;
}) {
  const hasQuery = filters.q.trim().length > 0;
  const hasCounty = filters.county && filters.county !== 'Any';

  // Build a contextual heading
  let heading = 'No providers found';
  if (hasQuery && hasCounty) {
    heading = `No results for "${filters.q}" in ${filters.county}`;
  } else if (hasQuery) {
    heading = `No results for "${filters.q}"`;
  } else if (hasCounty) {
    heading = `No providers found in ${filters.county}`;
  }

  return (
    <div
      style={{
        textAlign: 'center',
        padding: '60px 20px',
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'var(--wm-surface-alt)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
        }}
      >
        <SearchX size={32} style={{ color: 'var(--wm-muted)' }} />
      </div>

      <h3
        style={{
          fontSize: '18px',
          fontWeight: 700,
          fontFamily: 'var(--wm-font-display)',
          color: 'var(--wm-text)',
          margin: '0 0 8px',
        }}
      >
        {heading}
      </h3>

      <p
        style={{
          fontSize: '14px',
          color: 'var(--wm-muted)',
          fontFamily: 'var(--wm-font-sans)',
          margin: '0 0 20px',
          maxWidth: '360px',
          marginLeft: 'auto',
          marginRight: 'auto',
          lineHeight: 1.5,
        }}
      >
        {hasCounty
          ? `Try searching in a different county, or broaden your filters to see more providers.`
          : `Try a different search term, adjust your filters, or post a job to let providers come to you.`}
      </p>

      {/* Suggestion pills */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '20px',
        }}
      >
        {hasCounty && (
          <SuggestionPill
            label="Try all counties"
            onClick={() => onClearFilters()}
          />
        )}
        {hasQuery && (
          <SuggestionPill
            label="Clear search text"
            onClick={() => onClearFilters()}
          />
        )}
        {(filters.verified_only || filters.budget) && (
          <SuggestionPill
            label="Remove filters"
            onClick={() => onClearFilters()}
          />
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearFilters}
        >
          Clear all filters
        </Button>
        <Button
          href={`/${locale}/jobs`}
          variant="primary"
          size="sm"
          rightIcon={<ArrowRight size={14} />}
        >
          <Briefcase size={14} /> Post a job instead
        </Button>
      </div>
    </div>
  );
}

function SuggestionPill({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'var(--wm-surface-alt)',
        border: '1px solid var(--wm-border)',
        borderRadius: '20px',
        padding: '6px 14px',
        fontSize: '13px',
        color: 'var(--wm-primary-dark)',
        fontFamily: 'var(--wm-font-sans)',
        cursor: 'pointer',
        fontWeight: 500,
      }}
    >
      {label}
    </button>
  );
}

// ── Skeleton for loading state ──────────────────────────────────────────────

function ProviderCardSkeleton() {
  return (
    <div
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
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-3 w-48 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div
        style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid var(--wm-border)',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-24 rounded-2xl" />
      </div>
    </div>
  );
}
