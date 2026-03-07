'use client';

import { useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

type Props = {
  initialApiKey: string | null;
  initialRateLimit: number;
};

function maskKey(value: string) {
  if (value.length <= 12) return value;
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

export default function ApiKeyCard({ initialApiKey, initialRateLimit }: Props) {
  const [apiKey, setApiKey] = useState<string | null>(initialApiKey);
  const [rateLimit] = useState(initialRateLimit);
  const [showPlain, setShowPlain] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'fail'>('idle');

  const displayKey = useMemo(() => {
    if (!apiKey) return '-';
    return showPlain ? apiKey : maskKey(apiKey);
  }, [apiKey, showPlain]);

  const createKey = async () => {
    setError('');
    setOk('');
    setIsPending(true);
    try {
      const response = await fetch('/api/profile/api-key', {
        method: 'POST',
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || 'API key could not be generated.');
        return;
      }
      setApiKey(payload.profile?.api_key ?? null);
      setShowPlain(true);
      setOk('API key generated.');
    } catch {
      setError('API key could not be generated.');
    } finally {
      setIsPending(false);
    }
  };

  const revokeKey = async () => {
    setError('');
    setOk('');
    setIsPending(true);
    try {
      const response = await fetch('/api/profile/api-key', {
        method: 'DELETE',
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || 'API key could not be revoked.');
        return;
      }
      setApiKey(null);
      setShowPlain(false);
      setOk('API key revoked.');
    } catch {
      setError('API key could not be revoked.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card className="rounded-2xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3>Public API Access</h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Manage your API key for `/api/public/v1/*` integrations.
          </p>
        </div>
        <Badge tone={apiKey ? 'open' : 'neutral'}>{apiKey ? 'Active key' : 'No key'}</Badge>
      </div>

      <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900/60">
        <p className="font-medium">API key</p>
        <code className="mt-1 block break-all text-xs">{displayKey}</code>
      </div>

      <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">Rate limit: {rateLimit} requests/day</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="primary"
          onClick={() => {
            if (apiKey && !window.confirm('Regenerating your API key will immediately invalidate the existing key. Any integrations using the old key will stop working. Continue?')) {
              return;
            }
            void createKey();
          }}
          disabled={isPending}
        >
          {isPending ? 'Processing...' : apiKey ? 'Regenerate key' : 'Generate key'}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            if (!apiKey) return;
            navigator.clipboard.writeText(apiKey)
              .then(() => {
                setCopyState('ok');
                setTimeout(() => setCopyState('idle'), 2000);
              })
              .catch(() => {
                setCopyState('fail');
                setTimeout(() => setCopyState('idle'), 2000);
              });
          }}
          disabled={!apiKey || isPending}
        >
          {copyState === 'ok' ? 'Copied!' : copyState === 'fail' ? 'Copy failed' : 'Copy key'}
        </Button>
        <Button
          variant="ghost"
          onClick={() => setShowPlain((current) => !current)}
          disabled={!apiKey || isPending}
        >
          {showPlain ? 'Hide key' : 'Show key'}
        </Button>
        <Button variant="ghost" onClick={revokeKey} disabled={!apiKey || isPending}>
          Revoke key
        </Button>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      {ok ? <p className="mt-3 text-sm" style={{ color: 'var(--wm-primary)' }}>{ok}</p> : null}
    </Card>
  );
}
