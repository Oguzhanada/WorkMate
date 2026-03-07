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
      <p className="text-sm font-semibold">Provider Applications</p>
      {loading ? <p className="mt-2 text-sm" style={{ color: 'var(--wm-muted)' }}>Loading...</p> : null}
      {error ? <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      {!loading && !error ? <p className="mt-2 text-lg font-semibold">{items.length}</p> : null}
      <div className="mt-2 space-y-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid var(--wm-border)' }}>
            <p className="font-medium">{item.full_name ?? item.id.slice(0, 8)}</p>
            <p className="text-xs" style={{ color: 'var(--wm-muted)' }}>{item.verification_status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
