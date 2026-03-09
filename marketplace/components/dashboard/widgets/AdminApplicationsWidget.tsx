'use client';

import { useEffect, useState } from 'react';

type Application = { id: string; full_name: string | null; verification_status: string };

export default function AdminApplicationsWidget() {
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const response = await fetch('/api/admin/provider-applications', { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      setLoading(false);
      if (!response.ok) {
        setError(payload.error || 'Applications could not be loaded.');
        return;
      }
      setItems((payload.applications ?? []).slice(0, 5));
    };

    void load();
  }, []);

  return (
    <div>
      <p className="text-sm font-bold" style={{ color: 'var(--wm-navy)' }}>Provider Applications</p>
      <p className="mt-1 text-xs" style={{ color: 'var(--wm-muted)' }}>
        Recent verification applications requiring admin decisions.
      </p>
      {loading ? <p className="mt-2 text-sm" style={{ color: 'var(--wm-muted)' }}>Loading...</p> : null}
      {error ? <p className="mt-2 text-sm" style={{ color: 'var(--wm-destructive)' }}>{error}</p> : null}
      {!loading && !error ? <p className="mt-2 text-lg font-semibold" style={{ color: 'var(--wm-navy)' }}>{items.length}</p> : null}
      <div className="mt-2 space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl px-3 py-2.5 text-sm"
            style={{ border: '1px solid var(--wm-border)', background: 'var(--wm-surface)' }}
          >
            <p className="font-semibold" style={{ color: 'var(--wm-navy)' }}>{item.full_name ?? item.id.slice(0, 8)}</p>
            <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--wm-muted)' }}>{item.verification_status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
