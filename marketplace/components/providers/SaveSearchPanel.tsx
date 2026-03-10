'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

type SaveSearchPanelProps = {
  /** Current URL search-params serialised as a plain object — passed from the server page */
  currentFilters: Record<string, string>;
};

export default function SaveSearchPanel({ currentFilters }: SaveSearchPanelProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [notifyBell, setNotifyBell] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please give this search a name.');
      return;
    }
    setSaving(true);
    setError(null);

    // Build filters object from URL params
    const filters: Record<string, unknown> = {};
    if (currentFilters.category_id) filters.category_id = currentFilters.category_id;
    if (currentFilters.county && currentFilters.county !== 'Any') filters.county = currentFilters.county;
    if (currentFilters.verified_only) filters.verified_only = currentFilters.verified_only === 'true';
    if (currentFilters.garda_vetted) filters.garda_vetted = currentFilters.garda_vetted === 'true';

    try {
      const res = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), filters, notify_email: notifyEmail, notify_bell: notifyBell }),
      });

      if (res.status === 409) {
        setError('You already have a saved search with this name.');
        setSaving(false);
        return;
      }
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setError(json.error ?? 'Failed to save search.');
        setSaving(false);
        return;
      }

      setSaved(true);
      setName('');
      setTimeout(() => {
        setSaved(false);
        setOpen(false);
      }, 1800);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
      >
        Save search
      </Button>
    );
  }

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        border: '1px solid var(--wm-border)',
        background: 'var(--wm-surface)',
        minWidth: '260px',
      }}
    >
      <p
        className="mb-3 text-sm font-semibold"
        style={{ color: 'var(--wm-navy)', fontFamily: 'var(--wm-font-display)' }}
      >
        Save this search
      </p>

      <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--wm-muted)' }}>
        Search name
      </label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Plumber Dublin"
        maxLength={100}
        className="mb-3 w-full rounded-xl px-3 py-2 text-sm outline-none"
        style={{
          border: '1px solid var(--wm-border)',
          background: 'var(--wm-background)',
          color: 'var(--wm-text)',
        }}
      />

      <div className="mb-3 flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--wm-text)', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={notifyBell}
            onChange={(e) => setNotifyBell(e.target.checked)}
            className="h-4 w-4 accent-[var(--wm-primary)]"
          />
          Bell notification when new providers match
        </label>
        <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--wm-text)', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={notifyEmail}
            onChange={(e) => setNotifyEmail(e.target.checked)}
            className="h-4 w-4 accent-[var(--wm-primary)]"
          />
          Email notification
        </label>
      </div>

      {error ? (
        <p className="mb-2 text-xs" style={{ color: 'var(--wm-destructive)' }}>
          {error}
        </p>
      ) : null}

      {saved ? (
        <p className="mb-2 text-xs font-semibold" style={{ color: 'var(--wm-primary-dark)' }}>
          Search saved!
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleSave}
          disabled={saving || saved}
          loading={saving}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setOpen(false);
            setError(null);
            setName('');
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
