'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

type SavedSearchFilters = {
  category_id?:   string;
  county?:        string;
  min_rate?:      number;
  max_rate?:      number;
  verified_only?: boolean;
  garda_vetted?:  boolean;
};

type SavedSearch = {
  id:               string;
  name:             string;
  filters:          SavedSearchFilters;
  notify_email:     boolean;
  notify_bell:      boolean;
  last_notified_at: string | null;
  created_at:       string;
};

type Props = {
  search:           SavedSearch;
  locale:           string;
  categoryNameById: Record<string, string>;
  onDeleted:        (id: string) => void;
};

export default function SavedSearchCard({ search, locale, categoryNameById, onDeleted }: Props) {
  const [notifyEmail, setNotifyEmail] = useState(search.notify_email);
  const [notifyBell, setNotifyBell]   = useState(search.notify_bell);
  const [deleting, setDeleting]       = useState(false);
  const [toggling, setToggling]       = useState(false);

  // Build human-readable filter summary
  const filterChips: string[] = [];
  if (search.filters.category_id) {
    const catName = categoryNameById[search.filters.category_id];
    if (catName) filterChips.push(catName);
  }
  if (search.filters.county && search.filters.county !== 'Any') {
    filterChips.push(search.filters.county);
  }
  if (search.filters.verified_only) filterChips.push('Verified only');
  if (search.filters.garda_vetted)  filterChips.push('Garda vetted');

  // Build the provider search URL from saved filters
  function buildSearchUrl(): string {
    const sp = new URLSearchParams();
    if (search.filters.category_id)  sp.set('category_id',   search.filters.category_id);
    if (search.filters.county && search.filters.county !== 'Any') sp.set('county', search.filters.county);
    if (search.filters.verified_only !== undefined) sp.set('verified_only', String(search.filters.verified_only));
    if (search.filters.garda_vetted  !== undefined) sp.set('garda_vetted',  String(search.filters.garda_vetted));
    const qs = sp.toString();
    return qs ? `/${locale}/providers?${qs}` : `/${locale}/providers`;
  }

  const handleToggle = async (field: 'notify_email' | 'notify_bell', value: boolean) => {
    if (toggling) return;
    setToggling(true);
    // Optimistic update
    if (field === 'notify_email') setNotifyEmail(value);
    else setNotifyBell(value);

    try {
      const res = await fetch(`/api/saved-searches/${search.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) {
        // Revert on failure
        if (field === 'notify_email') setNotifyEmail(!value);
        else setNotifyBell(!value);
      }
    } catch {
      if (field === 'notify_email') setNotifyEmail(!value);
      else setNotifyBell(!value);
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/saved-searches/${search.id}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        onDeleted(search.id);
      }
    } catch {
      // ignore — card stays
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="rounded-2xl p-5 transition-shadow hover:shadow-[var(--wm-shadow-lg)]"
      style={{ border: '1px solid var(--wm-border)', background: 'var(--wm-surface)' }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            className="truncate text-base font-semibold"
            style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
          >
            {search.name}
          </h3>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--wm-muted)' }}>
            Saved {new Date(search.created_at).toLocaleDateString('en-IE')}
            {search.last_notified_at
              ? ` · Last notified ${new Date(search.last_notified_at).toLocaleDateString('en-IE')}`
              : null}
          </p>
        </div>

        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
          loading={deleting}
        >
          {deleting ? 'Removing...' : 'Delete'}
        </Button>
      </div>

      {/* Filter chips */}
      {filterChips.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {filterChips.map((chip) => (
            <Badge key={chip} tone="default">
              {chip}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs" style={{ color: 'var(--wm-subtle)' }}>
          No specific filters — matches all providers.
        </p>
      )}

      {/* Notification toggles */}
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <label
          className="flex cursor-pointer items-center gap-2 text-sm"
          style={{ color: 'var(--wm-text)' }}
        >
          <input
            type="checkbox"
            checked={notifyBell}
            onChange={(e) => handleToggle('notify_bell', e.target.checked)}
            disabled={toggling}
            className="h-4 w-4 accent-[var(--wm-primary)]"
          />
          Bell alerts
        </label>
        <label
          className="flex cursor-pointer items-center gap-2 text-sm"
          style={{ color: 'var(--wm-text)' }}
        >
          <input
            type="checkbox"
            checked={notifyEmail}
            onChange={(e) => handleToggle('notify_email', e.target.checked)}
            disabled={toggling}
            className="h-4 w-4 accent-[var(--wm-primary)]"
          />
          Email alerts
        </label>
      </div>

      {/* Apply search link */}
      <div className="mt-4">
        <Button href={buildSearchUrl()} variant="secondary" size="sm">
          Apply search
        </Button>
      </div>
    </div>
  );
}
