'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { IRISH_COUNTIES } from '@/lib/validation/api';

type Category = { id: string; name: string };

type FilterState = {
  q: string;
  county: string;
  category_id: string;
  verified_only: string;
  garda_vetted: string;
  sort: string;
};

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Best match' },
  { value: 'rating',    label: 'Highest rated' },
  { value: 'newest',    label: 'Newest first' },
] as const;

const EMPTY: FilterState = {
  q:            '',
  county:       'Any',
  category_id:  '',
  verified_only:'true',
  garda_vetted: 'false',
  sort:         'relevance',
};

function countActiveFilters(f: FilterState): number {
  let n = 0;
  if (f.q.trim())                n++;
  if (f.county !== 'Any')        n++;
  if (f.category_id)             n++;
  if (f.verified_only !== 'true') n++;
  if (f.garda_vetted === 'true') n++;
  if (f.sort !== 'relevance')    n++;
  return n;
}

export default function SearchFilters() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen]           = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Read current URL state into local form state.
  const [form, setForm] = useState<FilterState>({
    q:             searchParams.get('q')             ?? EMPTY.q,
    county:        searchParams.get('county')        ?? EMPTY.county,
    category_id:   searchParams.get('category_id')  ?? EMPTY.category_id,
    verified_only: searchParams.get('verified_only') ?? EMPTY.verified_only,
    garda_vetted:  searchParams.get('garda_vetted')  ?? EMPTY.garda_vetted,
    sort:          searchParams.get('sort')          ?? EMPTY.sort,
  });

  // Fetch categories from the public API.
  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d: { categories?: Category[] }) => {
        if (Array.isArray(d.categories)) setCategories(d.categories);
      })
      .catch(() => {/* non-critical */});
  }, []);

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    // Reset to page 1 on any filter change.
    params.delete('page');

    if (form.q.trim()) {
      params.set('q', form.q.trim());
    } else {
      params.delete('q');
    }

    if (form.county && form.county !== 'Any') {
      params.set('county', form.county);
    } else {
      params.delete('county');
    }

    if (form.category_id) {
      params.set('category_id', form.category_id);
    } else {
      params.delete('category_id');
    }

    if (form.verified_only === 'false') {
      params.set('verified_only', 'false');
    } else {
      params.delete('verified_only');
    }

    if (form.garda_vetted === 'true') {
      params.set('garda_vetted', 'true');
    } else {
      params.delete('garda_vetted');
    }

    if (form.sort && form.sort !== 'relevance') {
      params.set('sort', form.sort);
    } else {
      params.delete('sort');
    }

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [form, pathname, router, searchParams]);

  const clearFilters = useCallback(() => {
    setForm(EMPTY);
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const set = (key: keyof FilterState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const activeCount = countActiveFilters({
    q:             searchParams.get('q')             ?? EMPTY.q,
    county:        searchParams.get('county')        ?? EMPTY.county,
    category_id:   searchParams.get('category_id')  ?? EMPTY.category_id,
    verified_only: searchParams.get('verified_only') ?? EMPTY.verified_only,
    garda_vetted:  searchParams.get('garda_vetted')  ?? EMPTY.garda_vetted,
    sort:          searchParams.get('sort')          ?? EMPTY.sort,
  });

  const inputStyle: React.CSSProperties = {
    border: '1px solid var(--wm-border)',
    background: 'var(--color-background-secondary)',
    color: 'var(--wm-text)',
    borderRadius: '0.75rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    width: '100%',
    outline: 'none',
  };

  return (
    <div className="mb-6">
      {/* Toggle bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setOpen((o) => !o)}
          leftIcon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          }
        >
          {open ? 'Hide filters' : 'Filters'}
          {activeCount > 0 && (
            <Badge tone="primary" className="ml-1">
              {activeCount}
            </Badge>
          )}
        </Button>

        {/* Sort — always visible */}
        <select
          value={form.sort}
          onChange={(e) => {
            set('sort', e.target.value);
            // Apply sort immediately without needing Apply button.
            const params = new URLSearchParams(searchParams.toString());
            params.delete('page');
            if (e.target.value && e.target.value !== 'relevance') {
              params.set('sort', e.target.value);
            } else {
              params.delete('sort');
            }
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
          }}
          style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }}
          aria-label="Sort providers"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {activeCount > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        )}
      </div>

      {/* Expandable filter panel */}
      {open && (
        <Card className="mt-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Keyword */}
            <div className="lg:col-span-2">
              <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--wm-muted)' }}>
                Search by name
              </label>
              <input
                type="search"
                placeholder="e.g. John or Plumber"
                value={form.q}
                onChange={(e) => set('q', e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }}
                style={inputStyle}
                maxLength={120}
                aria-label="Search providers by name"
              />
            </div>

            {/* County */}
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--wm-muted)' }}>
                County
              </label>
              <select
                value={form.county}
                onChange={(e) => set('county', e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
                aria-label="Filter by county"
              >
                {IRISH_COUNTIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--wm-muted)' }}>
                Service category
              </label>
              <select
                value={form.category_id}
                onChange={(e) => set('category_id', e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
                aria-label="Filter by service category"
              >
                <option value="">Any category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Toggles */}
            <div className="flex flex-col justify-end gap-3">
              <ToggleRow
                id="verified_only"
                label="ID-verified providers only"
                checked={form.verified_only === 'true'}
                onChange={(v) => set('verified_only', v ? 'true' : 'false')}
              />
              <ToggleRow
                id="garda_vetted"
                label="Garda vetted providers only"
                checked={form.garda_vetted === 'true'}
                onChange={(v) => set('garda_vetted', v ? 'true' : 'false')}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 flex items-center gap-3 border-t pt-4" style={{ borderColor: 'var(--wm-border)' }}>
            <Button type="button" variant="primary" size="sm" onClick={applyFilters}>
              Apply filters
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Small toggle row helper ───────────────────────────────────────────────────
function ToggleRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2"
        style={{
          background: checked ? 'var(--wm-primary)' : 'var(--wm-border)',
        }}
      >
        <span
          className="inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200"
          style={{ transform: checked ? 'translateX(1.375rem)' : 'translateX(0.25rem)' }}
        />
      </button>
      <label htmlFor={id} className="cursor-pointer text-sm" style={{ color: 'var(--wm-text)' }}>
        {label}
      </label>
    </div>
  );
}
