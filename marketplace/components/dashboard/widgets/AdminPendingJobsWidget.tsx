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
      {loading ? <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Loading...</p> : null}
      {error ? <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      {!loading && !error ? <p className="mt-2 text-lg font-semibold">{items.length}</p> : null}
      <div className="mt-2 space-y-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700">
            <p className="font-medium">{item.title}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{new Date(item.created_at).toLocaleDateString('en-IE')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
