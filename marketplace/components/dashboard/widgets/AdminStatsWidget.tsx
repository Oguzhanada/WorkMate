'use client';

import { useEffect, useState } from 'react';

type Stats = {
  totalUsers: number;
  pendingApps: number;
  approvalRate: number;
  revenue: number;
};

export default function AdminStatsWidget() {
  const [stats, setStats] = useState<Stats | null>(null);
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
      setStats(payload);
    };

    void load();
  }, []);

  return (
    <div>
      <p className="text-sm font-semibold">Admin Stats</p>
      {loading ? <p className="mt-2 text-sm" style={{ color: 'var(--wm-muted)' }}>Loading...</p> : null}
      {error ? <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      {stats ? (
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg px-3 py-2" style={{ border: '1px solid var(--wm-border)' }}>Users: {stats.totalUsers}</div>
          <div className="rounded-lg px-3 py-2" style={{ border: '1px solid var(--wm-border)' }}>Pending: {stats.pendingApps}</div>
          <div className="rounded-lg px-3 py-2" style={{ border: '1px solid var(--wm-border)' }}>Approval: {stats.approvalRate}%</div>
          <div className="rounded-lg px-3 py-2" style={{ border: '1px solid var(--wm-border)' }}>Revenue: EUR {stats.revenue}</div>
        </div>
      ) : null}
    </div>
  );
}
