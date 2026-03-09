'use client';

import { useEffect, useState } from 'react';

type PendingJob = { id: string; title: string; created_at: string };

export default function AdminPendingJobsWidget() {
  const [items, setItems] = useState<PendingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const response = await fetch('/api/admin/pending-jobs', { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      setLoading(false);
      if (!response.ok) {
        setError(payload.error || 'Pending jobs could not be loaded.');
        return;
      }
      setItems((payload.jobs ?? []).slice(0, 5));
    };

    void load();
  }, []);

  return (
    <div>
      <p className="text-sm font-semibold">Pending Job Reviews</p>
      {loading ? <p className="mt-2 text-sm" style={{ color: 'var(--wm-muted)' }}>Loading...</p> : null}
      {error ? <p className="mt-2 text-sm text-[var(--wm-destructive)]">{error}</p> : null}
      {!loading && !error ? <p className="mt-2 text-lg font-semibold">{items.length}</p> : null}
      <div className="mt-2 space-y-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg px-3 py-2 text-sm" style={{ border: '1px solid var(--wm-border)' }}>
            <p className="font-medium">{item.title}</p>
            <p className="text-xs" style={{ color: 'var(--wm-muted)' }}>{new Date(item.created_at).toLocaleDateString('en-IE')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
