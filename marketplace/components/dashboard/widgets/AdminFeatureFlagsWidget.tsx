'use client';

import { useEffect, useState } from 'react';

type FlagRow = {
  id: string;
  flag_key: string;
  description: string;
  enabled: boolean;
  updated_at: string;
};

export default function AdminFeatureFlagsWidget() {
  const [flags, setFlags] = useState<FlagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/feature-flags', { cache: 'no-store' })
      .then((res) => res.json())
      .then((payload: { flags?: FlagRow[]; error?: string }) => {
        if (payload.error) { setError(payload.error); return; }
        setFlags(payload.flags ?? []);
      })
      .catch(() => setError('Could not load flags.'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (flagKey: string, enabled: boolean) => {
    setToggling(flagKey);
    try {
      const res = await fetch('/api/admin/feature-flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flag_key: flagKey, enabled }),
      });
      const payload = await res.json() as { flag?: FlagRow; error?: string };
      if (!res.ok) { setError(payload.error || 'Toggle failed.'); return; }
      setFlags((current) =>
        current.map((f) => f.flag_key === flagKey ? { ...f, enabled } : f)
      );
    } catch {
      setError('Toggle failed.');
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '0.75rem' }}>
        <p style={{ color: 'var(--wm-muted)', fontSize: '0.875rem' }}>Loading flags...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--wm-navy)' }}>
        Feature Flags
      </h3>
      {error ? (
        <p style={{ color: 'var(--wm-destructive)', fontSize: '0.85rem', margin: 0 }}>{error}</p>
      ) : null}
      {flags.length === 0 ? (
        <p style={{ color: 'var(--wm-muted)', fontSize: '0.875rem', margin: 0 }}>No flags configured.</p>
      ) : (
        <div style={{ display: 'grid', gap: '0.4rem' }}>
          {flags.map((flag) => (
            <div
              key={flag.flag_key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                padding: '0.5rem 0.6rem',
                borderRadius: '0.5rem',
                background: flag.enabled ? 'var(--wm-primary-faint)' : 'var(--wm-bg)',
                border: `1px solid ${flag.enabled ? 'var(--wm-primary-light)' : 'var(--wm-border)'}`,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.82rem', color: 'var(--wm-navy)' }}>
                  {flag.flag_key}
                </p>
                {flag.description ? (
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--wm-muted)' }}>{flag.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                disabled={toggling === flag.flag_key}
                onClick={() => toggle(flag.flag_key, !flag.enabled)}
                style={{
                  flexShrink: 0,
                  border: 'none',
                  borderRadius: '999px',
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: toggling === flag.flag_key ? 'not-allowed' : 'pointer',
                  background: flag.enabled ? 'var(--wm-primary)' : 'var(--wm-border)',
                  color: flag.enabled ? '#fff' : 'var(--wm-muted)',
                  opacity: toggling === flag.flag_key ? 0.6 : 1,
                  transition: 'background 0.15s',
                }}
              >
                {flag.enabled ? 'ON' : 'OFF'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
