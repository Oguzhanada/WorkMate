'use client';

import { useEffect, useState, useCallback } from 'react';
import { Zap, TrendingUp, Calendar, Inbox, Info } from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type Transaction = {
  id: string;
  amount: number;
  reason: string;
  reference_id: string | null;
  created_at: string;
};

type CreditsData = {
  balance: number;
  last_updated: string | null;
  transactions: Transaction[];
};

/* ------------------------------------------------------------------ */
/*  Reason labels                                                       */
/* ------------------------------------------------------------------ */

const REASON_LABELS: Record<string, string> = {
  monthly_grant: 'Monthly grant',
  referral_bonus: 'Referral bonus',
  quote_debit: 'Quote submitted',
  urgent_quote_debit: 'Urgent quote submitted',
  admin_adjustment: 'Admin adjustment',
  signup_bonus: 'Sign-up bonus',
};

function reasonLabel(reason: string): string {
  return REASON_LABELS[reason] ?? reason.replace(/_/g, ' ');
}

function transactionTone(amount: number): 'primary' | 'pending' | 'neutral' {
  if (amount > 0) return 'primary';
  if (amount < 0) return 'pending';
  return 'neutral';
}

/* ------------------------------------------------------------------ */
/*  How credits work info box                                           */
/* ------------------------------------------------------------------ */

function HowCreditsWork() {
  return (
    <div
      className="rounded-2xl p-5 text-sm"
      style={{
        border: '1px solid var(--wm-primary)',
        background: 'var(--wm-primary-light)',
        color: 'var(--wm-navy)',
      }}
    >
      <div className="mb-3 flex items-center gap-2 font-semibold">
        <Info size={15} style={{ color: 'var(--wm-primary)' }} />
        How quote credits work
      </div>
      <ul className="space-y-1.5 text-sm" style={{ color: 'var(--wm-muted)' }}>
        <li>
          <strong style={{ color: 'var(--wm-navy)' }}>–1 credit</strong> when you submit a standard quote
        </li>
        <li>
          <strong style={{ color: 'var(--wm-navy)' }}>–2 credits</strong> when you submit an urgent quote
        </li>
        <li>
          <strong style={{ color: 'var(--wm-navy)' }}>+10 credits</strong> granted each month on the 1st
        </li>
        <li>
          <strong style={{ color: 'var(--wm-navy)' }}>+10 credits</strong> for each successful referral
        </li>
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                         */
/* ------------------------------------------------------------------ */

function EmptyTransactions() {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div
        className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{ background: 'var(--wm-surface-alt)' }}
      >
        <Inbox size={22} style={{ color: 'var(--wm-muted)' }} />
      </div>
      <p className="font-semibold" style={{ color: 'var(--wm-navy)' }}>
        No transactions yet
      </p>
      <p className="mt-1 max-w-xs text-sm" style={{ color: 'var(--wm-muted)' }}>
        Your credit activity will appear here once you submit quotes or receive grants.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main panel                                                          */
/* ------------------------------------------------------------------ */

export default function CreditsPanel() {
  const [data, setData] = useState<CreditsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/provider/credits');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError((body as { error?: string }).error ?? 'Failed to load credits');
        return;
      }
      setData(await res.json() as CreditsData);
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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-3xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="rounded-2xl px-5 py-4 text-sm"
        style={{ background: 'var(--wm-destructive-light)', color: 'var(--wm-destructive)' }}
      >
        {error || 'Could not load credit data.'}
      </div>
    );
  }

  const totalEarned = data.transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = Math.abs(
    data.transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0),
  );

  return (
    <div className="space-y-6">
      {/* Balance + stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {/* Balance */}
        <div
          className="col-span-2 flex items-center gap-4 rounded-2xl p-5 sm:col-span-1"
          style={{
            border: '1px solid var(--wm-primary)',
            background: 'var(--wm-primary-light)',
          }}
        >
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'var(--wm-primary)' }}
          >
            <Zap size={22} color="#fff" />
          </div>
          <div>
            <p className="text-3xl font-bold" style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}>
              {data.balance}
            </p>
            <p className="text-xs" style={{ color: 'var(--wm-muted)' }}>Available credits</p>
          </div>
        </div>

        {/* Total earned */}
        <div
          className="flex items-center gap-4 rounded-2xl p-4"
          style={{ border: '1px solid var(--wm-border)', background: 'var(--wm-surface)' }}
        >
          <TrendingUp size={20} style={{ color: 'var(--wm-primary)', flexShrink: 0 }} />
          <div>
            <p className="text-xl font-bold" style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}>
              {totalEarned}
            </p>
            <p className="text-xs" style={{ color: 'var(--wm-muted)' }}>Total earned</p>
          </div>
        </div>

        {/* Total spent */}
        <div
          className="flex items-center gap-4 rounded-2xl p-4"
          style={{ border: '1px solid var(--wm-border)', background: 'var(--wm-surface)' }}
        >
          <Calendar size={20} style={{ color: 'var(--wm-muted)', flexShrink: 0 }} />
          <div>
            <p className="text-xl font-bold" style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}>
              {totalSpent}
            </p>
            <p className="text-xs" style={{ color: 'var(--wm-muted)' }}>Used on quotes</p>
          </div>
        </div>
      </div>

      {/* How credits work */}
      <HowCreditsWork />

      {/* Transactions */}
      <Card className="rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2
            className="text-base font-semibold"
            style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
          >
            Transaction history
          </h2>
          <Badge tone="neutral">{data.transactions.length} entries</Badge>
        </div>

        {data.transactions.length === 0 ? (
          <EmptyTransactions />
        ) : (
          <div>
            {/* Header row */}
            <div
              className="mb-1 hidden grid-cols-[1fr_auto_auto] gap-4 px-2 pb-2 text-xs font-semibold uppercase tracking-wider sm:grid"
              style={{ color: 'var(--wm-muted)', borderBottom: '1px solid var(--wm-border)' }}
            >
              <span>Description</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Date</span>
            </div>

            <div className="divide-y" style={{ borderColor: 'var(--wm-border)' }}>
              {data.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-4"
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--wm-navy)' }}>
                      {reasonLabel(tx.reason)}
                    </p>
                    {tx.reference_id && (
                      <p className="mt-0.5 text-xs font-mono" style={{ color: 'var(--wm-subtle)' }}>
                        ref: {tx.reference_id.slice(0, 8)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 sm:justify-end">
                    <Badge tone={transactionTone(tx.amount)}>
                      {tx.amount > 0 ? '+' : ''}
                      {tx.amount} cr
                    </Badge>
                  </div>

                  <div className="text-xs sm:text-right" style={{ color: 'var(--wm-muted)' }}>
                    {new Date(tx.created_at).toLocaleDateString('en-IE', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
