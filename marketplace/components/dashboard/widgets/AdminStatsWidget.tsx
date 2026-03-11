'use client';

import { useEffect, useState } from 'react';
import type { PlatformStats } from '@/app/api/admin/stats/route';

export default function AdminStatsWidget() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const response = await fetch('/api/admin/stats', { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      setLoading(false);
      if (!response.ok) {
        setError(payload.error || 'Stats could not be loaded.');
        return;
      }
      setStats(payload as PlatformStats);
    };

    void load();
  }, []);

  return (
    <div>
      <p className="text-sm font-bold" style={{ color: 'var(--wm-navy)' }}>Admin Stats</p>
      {loading ? <p className="mt-2 text-sm" style={{ color: 'var(--wm-muted)' }}>Loading...</p> : null}
      {error ? <p className="mt-2 text-sm" style={{ color: 'var(--wm-destructive)' }}>{error}</p> : null}
      {stats ? (
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl px-3 py-2.5" style={{ border: '1px solid var(--wm-border)', background: 'var(--wm-surface)', color: 'var(--wm-navy)' }}>Users: {stats.users.total}</div>
          <div className="rounded-xl px-3 py-2.5" style={{ border: '1px solid var(--wm-border)', background: 'var(--wm-surface)', color: 'var(--wm-navy)' }}>Pending: {stats.providers.pending}</div>
          <div className="rounded-xl px-3 py-2.5" style={{ border: '1px solid var(--wm-border)', background: 'var(--wm-surface)', color: 'var(--wm-navy)' }}>Open jobs: {stats.jobs.open}</div>
          <div className="rounded-xl px-3 py-2.5" style={{ border: '1px solid var(--wm-border)', background: 'var(--wm-surface)', color: 'var(--wm-navy)' }}>Reviews: {stats.reviews.total}</div>
        </div>
      ) : null}
    </div>
  );
}
