'use client';

import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

type ApiKeyItem = {
  id: string;
  full_name: string | null;
  api_key_masked: string | null;
  api_rate_limit: number;
  roles: string[];
  created_at: string;
};

export default function AdminApiKeysPanel() {
  const [items, setItems] = useState<ApiKeyItem[]>([]);
  const [draftLimits, setDraftLimits] = useState<Record<string, number>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const load = async () => {
    setError('');
    const response = await fetch('/api/admin/api-keys', { cache: 'no-store' });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.error || 'API keys could not be loaded.');
      return;
    }
    const rows = (payload.items ?? []) as ApiKeyItem[];
    setItems(rows);
    setDraftLimits(
      rows.reduce<Record<string, number>>((acc, item) => {
        acc[item.id] = item.api_rate_limit;
        return acc;
      }, {})
    );
  };

  useEffect(() => {
    load();
  }, []);

  const totalKeys = useMemo(() => items.length, [items.length]);

  const saveLimit = async (profileId: string) => {
    setPendingId(profileId);
    setError('');
    setOk('');
    try {
      const response = await fetch(`/api/admin/api-keys/${profileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_rate_limit: Number(draftLimits[profileId] ?? 1000) }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || 'Rate limit update failed.');
        return;
      }
      setItems((current) =>
        current.map((item) =>
          item.id === profileId ? { ...item, api_rate_limit: payload.profile?.api_rate_limit ?? item.api_rate_limit } : item
        )
      );
      setOk('Rate limit updated.');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="grid gap-4">
      <Card className="rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3>API Keys</h3>
            <p className="mt-1 text-sm" style={{ color: 'var(--wm-muted)' }}>
              Review active public API keys and adjust daily limits.
            </p>
          </div>
          <Badge tone="neutral">{totalKeys} active keys</Badge>
        </div>
      </Card>

      <Card className="rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead style={{ color: 'var(--wm-muted)' }}>
              <tr>
                <th className="px-2 py-2 font-medium">User</th>
                <th className="px-2 py-2 font-medium">Roles</th>
                <th className="px-2 py-2 font-medium">Key</th>
                <th className="px-2 py-2 font-medium">Rate/day</th>
                <th className="px-2 py-2 font-medium">Created</th>
                <th className="px-2 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} style={{ borderTop: '1px solid var(--wm-border)' }}>
                  <td className="px-2 py-3">{item.full_name ?? 'User'}</td>
                  <td className="px-2 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(item.roles.length > 0 ? item.roles : ['-']).map((role) => (
                        <Badge key={`${item.id}-${role}`} tone="neutral" className="px-2 py-0.5 text-[11px]">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <code className="text-xs">{item.api_key_masked ?? '-'}</code>
                  </td>
                  <td className="px-2 py-3">
                    <input
                      className="w-28 rounded-lg px-2 py-1 text-sm"
                      style={{ border: '1px solid var(--wm-border)', background: 'var(--wm-surface)' }}
                      type="number"
                      min={1}
                      max={500000}
                      value={draftLimits[item.id] ?? item.api_rate_limit}
                      onChange={(event) =>
                        setDraftLimits((current) => ({
                          ...current,
                          [item.id]: Number(event.target.value || item.api_rate_limit),
                        }))
                      }
                    />
                  </td>
                  <td className="px-2 py-3">{new Date(item.created_at).toLocaleDateString('en-IE')}</td>
                  <td className="px-2 py-3">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => saveLimit(item.id)}
                      disabled={pendingId === item.id}
                    >
                      {pendingId === item.id ? 'Saving...' : 'Save'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {error ? <p className="text-sm text-[var(--wm-destructive)]">{error}</p> : null}
      {ok ? <p className="text-sm" style={{ color: 'var(--wm-primary)' }}>{ok}</p> : null}
    </div>
  );
}
