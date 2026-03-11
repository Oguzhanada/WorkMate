'use client';

import { useEffect, useState, useCallback } from 'react';
import { Copy, Check, Gift, Users, Zap, Inbox } from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type Redemption = {
  id: string;
  redeemed_at: string;
};

type ReferralData = {
  code: string;
  uses_count: number;
  max_uses: number;
  created_at: string;
  redemptions: Redemption[];
};

/* ------------------------------------------------------------------ */
/*  Copy button                                                         */
/* ------------------------------------------------------------------ */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95"
      style={{
        background: copied ? 'var(--wm-primary-light)' : 'var(--wm-primary)',
        color: copied ? 'var(--wm-primary-dark)' : '#fff',
        border: copied ? '1px solid var(--wm-primary)' : '1px solid transparent',
      }}
      type="button"
      aria-label="Copy referral code"
    >
      {copied ? <Check size={15} /> : <Copy size={15} />}
      {copied ? 'Copied!' : 'Copy code'}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat card                                                           */
/* ------------------------------------------------------------------ */

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Gift;
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-4 rounded-2xl p-4"
      style={{
        border: '1px solid var(--wm-border)',
        background: accent ? 'var(--wm-primary-light)' : 'var(--wm-surface)',
      }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: accent ? 'var(--wm-primary)' : 'var(--wm-surface-alt)' }}
      >
        <Icon size={18} style={{ color: accent ? '#fff' : 'var(--wm-primary)' }} />
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}>
          {value}
        </p>
        <p className="text-xs" style={{ color: 'var(--wm-muted)' }}>{label}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main panel                                                          */
/* ------------------------------------------------------------------ */

export default function ReferralPanel() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/referral/my-code');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError((body as { error?: string }).error ?? 'Failed to load referral data');
        return;
      }
      setData(await res.json() as ReferralData);
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-48 rounded-3xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="rounded-2xl px-5 py-4 text-sm"
        style={{ background: 'var(--wm-destructive-light)', color: 'var(--wm-destructive)' }}
      >
        {error || 'Could not load referral data.'}
      </div>
    );
  }

  const creditsEarned = data.uses_count * 10;
  const usesRemaining = data.max_uses - data.uses_count;
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/sign-up?ref=${data.code}`
    : `/sign-up?ref=${data.code}`;

  return (
    <div className="space-y-6">
      {/* Code card */}
      <Card className="rounded-3xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--wm-muted)' }}>
              Your referral code
            </p>
            <p
              className="text-3xl font-bold tracking-wider"
              style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)', letterSpacing: '0.12em' }}
            >
              {data.code}
            </p>
          </div>
          <CopyButton text={data.code} />
        </div>

        <div
          className="mt-4 rounded-xl p-4 text-sm"
          style={{ background: 'var(--wm-surface-alt)', color: 'var(--wm-muted)' }}
        >
          Share your code or this link with friends who want to join WorkMate as providers. When they sign
          up and get verified, <strong style={{ color: 'var(--wm-navy)' }}>you earn 10 credits</strong> per
          referral — up to {data.max_uses} total.
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="truncate text-xs font-mono" style={{ color: 'var(--wm-primary)' }}>
              {shareUrl}
            </span>
            <CopyButton text={shareUrl} />
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label="Referrals made" value={data.uses_count} accent />
        <StatCard icon={Zap} label="Credits earned" value={creditsEarned} />
        <StatCard icon={Gift} label="Uses remaining" value={usesRemaining} />
      </div>

      {/* Redemption history */}
      <Card className="rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2
            className="text-base font-semibold"
            style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
          >
            Referral history
          </h2>
          {data.uses_count > 0 && (
            <Badge tone="primary">{data.uses_count} referral{data.uses_count !== 1 ? 's' : ''}</Badge>
          )}
        </div>

        {data.redemptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div
              className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: 'var(--wm-surface-alt)' }}
            >
              <Inbox size={22} style={{ color: 'var(--wm-muted)' }} />
            </div>
            <p className="font-medium" style={{ color: 'var(--wm-navy)' }}>No referrals yet</p>
            <p className="mt-1 max-w-xs text-sm" style={{ color: 'var(--wm-muted)' }}>
              Share your code with other service providers to start earning credits.
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--wm-border)' }}>
            {data.redemptions.map((r, i) => (
              <div key={r.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{ background: 'var(--wm-primary-light)', color: 'var(--wm-primary-dark)' }}
                  >
                    {i + 1}
                  </div>
                  <span className="text-sm" style={{ color: 'var(--wm-navy)' }}>
                    New provider joined
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone="primary">+10 credits</Badge>
                  <span className="text-xs" style={{ color: 'var(--wm-muted)' }}>
                    {new Date(r.redeemed_at).toLocaleDateString('en-IE', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
