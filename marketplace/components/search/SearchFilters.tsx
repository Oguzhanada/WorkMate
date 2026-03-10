'use client';

import { useCallback, useState } from 'react';
import { Search, SlidersHorizontal, X, Shield, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { IRISH_COUNTIES } from '@/lib/ireland-locations';
import Button from '@/components/ui/Button';

export type SearchFiltersState = {
  q: string;
  county: string;
  sort: string;
  verified_only: boolean;
  garda_vetted: boolean;
  budget: string;
};

type SearchFiltersProps = {
  filters: SearchFiltersState;
  onChange: (filters: SearchFiltersState) => void;
  totalResults: number;
  loading: boolean;
};

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'rate_asc', label: 'Price: Low to High' },
  { value: 'rate_desc', label: 'Price: High to Low' },
];

const BUDGET_OPTIONS = [
  { value: '', label: 'Any budget' },
  { value: '0-100', label: 'Under \u20AC100' },
  { value: '100-250', label: '\u20AC100 \u2013 \u20AC250' },
  { value: '250-500', label: '\u20AC250 \u2013 \u20AC500' },
  { value: '500-1000', label: '\u20AC500 \u2013 \u20AC1,000' },
  { value: '1000+', label: '\u20AC1,000+' },
];

// 26 ROI counties only for public search
const SEARCH_COUNTIES = IRISH_COUNTIES.filter(
  (c) => !['Antrim', 'Armagh', 'Derry', 'Down', 'Fermanagh', 'Tyrone'].includes(c),
);

const selectStyle: React.CSSProperties = {
  background: 'var(--wm-surface-alt)',
  border: '1px solid var(--wm-border)',
  borderRadius: '8px',
  padding: '6px 10px',
  fontSize: '13px',
  color: 'var(--wm-text)',
  fontFamily: 'var(--wm-font-sans)',
  cursor: 'pointer',
};

export default function SearchFilters({ filters, onChange, totalResults, loading }: SearchFiltersProps) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const update = useCallback(
    (patch: Partial<SearchFiltersState>) => {
      onChange({ ...filters, ...patch });
    },
    [filters, onChange],
  );

  const activeFilterCount = [
    filters.county && filters.county !== 'Any',
    filters.verified_only,
    filters.garda_vetted,
    filters.budget !== '',
  ].filter(Boolean).length;

  const clearAll = useCallback(() => {
    onChange({
      q: '',
      county: 'Any',
      sort: 'relevance',
      verified_only: false,
      garda_vetted: false,
      budget: '',
    });
  }, [onChange]);

  const toggleButtonStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: active ? 'rgba(var(--wm-primary-rgb), 0.12)' : 'var(--wm-surface-alt)',
    border: `1px solid ${active ? 'var(--wm-primary)' : 'var(--wm-border)'}`,
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '13px',
    color: active ? 'var(--wm-primary-dark)' : 'var(--wm-muted)',
    fontFamily: 'var(--wm-font-sans)',
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
  });

  return (
    <div
      style={{
        background: 'var(--wm-surface)',
        borderBottom: '1px solid var(--wm-border)',
      }}
    >
      {/* Search bar row */}
      <div style={{ padding: '12px 20px 8px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--wm-surface-alt)',
            border: '1px solid var(--wm-border)',
            borderRadius: '12px',
            padding: '8px 14px',
          }}
        >
          <Search size={18} style={{ color: 'var(--wm-muted)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search providers by name or service..."
            value={filters.q}
            onChange={(e) => update({ q: e.target.value })}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              color: 'var(--wm-text)',
              fontFamily: 'var(--wm-font-sans)',
            }}
          />
          {filters.q && (
            <button
              onClick={() => update({ q: '' })}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--wm-muted)',
                padding: '2px',
              }}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Mobile filter toggle button */}
      <div className="search-mobile-filter-toggle">
        <button
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            width: '100%',
            padding: '8px 20px 12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--wm-font-sans)',
            fontSize: '13px',
            color: 'var(--wm-muted)',
            fontWeight: 600,
          }}
        >
          <SlidersHorizontal size={15} />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span
              style={{
                background: 'var(--wm-primary)',
                color: 'white',
                borderRadius: '10px',
                minWidth: '20px',
                height: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 700,
                padding: '0 6px',
              }}
            >
              {activeFilterCount}
            </span>
          )}
          <span style={{ marginLeft: 'auto' }}>
            {mobileFiltersOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
          {/* Result count on mobile toggle row */}
          <span
            style={{
              fontSize: '12px',
              fontWeight: 400,
              color: 'var(--wm-muted)',
            }}
          >
            {loading ? '' : `${totalResults} result${totalResults !== 1 ? 's' : ''}`}
          </span>
        </button>
      </div>

      {/* Filters row — visible on desktop always, on mobile only when open */}
      <div
        className={`search-filters-row ${mobileFiltersOpen ? 'search-filters-row--open' : ''}`}
        style={{
          padding: '8px 20px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        <div
          className="search-filters-label"
          style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--wm-muted)' }}
        >
          <SlidersHorizontal size={15} />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Filters</span>
        </div>

        {/* County select */}
        <select
          value={filters.county}
          onChange={(e) => update({ county: e.target.value })}
          style={selectStyle}
        >
          <option value="Any">All Counties</option>
          {SEARCH_COUNTIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Budget select */}
        <select
          value={filters.budget}
          onChange={(e) => update({ budget: e.target.value })}
          style={selectStyle}
        >
          {BUDGET_OPTIONS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={filters.sort}
          onChange={(e) => update({ sort: e.target.value })}
          style={selectStyle}
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Toggle: Verified */}
        <button
          onClick={() => update({ verified_only: !filters.verified_only })}
          style={toggleButtonStyle(filters.verified_only)}
        >
          <Shield size={14} />
          Verified
        </button>

        {/* Toggle: Garda vetted */}
        <button
          onClick={() => update({ garda_vetted: !filters.garda_vetted })}
          style={toggleButtonStyle(filters.garda_vetted)}
        >
          <ShieldCheck size={14} />
          Garda Vetted
        </button>

        {/* Active filter count + clear */}
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Clear all ({activeFilterCount})
          </Button>
        )}

        {/* Result count — desktop */}
        <span
          className="search-result-count-desktop"
          style={{
            marginLeft: 'auto',
            fontSize: '13px',
            color: 'var(--wm-muted)',
            fontFamily: 'var(--wm-font-sans)',
          }}
        >
          {loading ? 'Searching...' : `${totalResults} provider${totalResults !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Responsive styles for filters */}
      <style>{`
        /* Mobile filter toggle hidden on desktop */
        .search-mobile-filter-toggle {
          display: none;
        }

        @media (max-width: 768px) {
          /* Show mobile toggle */
          .search-mobile-filter-toggle {
            display: block;
          }

          /* Hide the "Filters" label on desktop-style row (redundant with toggle) */
          .search-filters-label {
            display: none !important;
          }

          /* Hide desktop result count (shown in toggle row instead) */
          .search-result-count-desktop {
            display: none !important;
          }

          /* Filters row hidden by default on mobile */
          .search-filters-row {
            display: none !important;
            overflow: hidden;
          }

          /* When open, show as a column for better mobile layout */
          .search-filters-row.search-filters-row--open {
            display: flex !important;
            flex-direction: row;
            flex-wrap: wrap;
            gap: 8px;
            padding: 0 20px 14px !important;
            animation: slideDown 0.2s ease;
          }

          /* Make selects full-width-ish on very small screens */
          .search-filters-row select {
            flex: 1 1 calc(50% - 4px);
            min-width: 130px;
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
