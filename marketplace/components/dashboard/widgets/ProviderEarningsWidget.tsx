'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Briefcase, Clock } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import Skeleton from '@/components/ui/Skeleton';

type EarningsSummary = {
  monthlyNetCents: number;
  pendingCents: number;
  completedJobsThisMonth: number;
};

function formatEur(cents: number) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
  return { start, end };
}

export default function ProviderEarningsWidget() {
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        setError('Not authenticated.');
        return;
      }

      const { start, end } = getMonthRange();

      // Fetch completed jobs this month where this provider was the accepted pro
      const { data: completedQuotes, error: quotesError } = await supabase
        .from('quotes')
        .select('id,quote_amount_cents,jobs!inner(status,completed_at,accepted_quote_id)')
        .eq('pro_id', user.id)
        .eq('jobs.status', 'completed')
        .gte('created_at', start)
        .lte('created_at', end);

      if (quotesError) {
        setError(quotesError.message);
        setLoading(false);
        return;
      }

      // Only count quotes that are actually the accepted quote for their job
      const acceptedCompleted = (completedQuotes ?? []).filter((q) => {
        const job = Array.isArray(q.jobs) ? q.jobs[0] : q.jobs;
        return job?.accepted_quote_id === q.id;
      });

      const monthlyGrossCents = acceptedCompleted.reduce(
        (sum, q) => sum + Number(q.quote_amount_cents ?? 0),
        0
      );
      // WorkMate service fee: 10% (standard) or 1.9% (rebooking — use conservative 10% here)
      const monthlyNetCents = Math.round(monthlyGrossCents * 0.9);
      const completedJobsThisMonth = acceptedCompleted.length;

      // Fetch in-progress jobs (pending payout)
      const { data: inProgressQuotes } = await supabase
        .from('quotes')
        .select('id,quote_amount_cents,jobs!inner(status,accepted_quote_id)')
        .eq('pro_id', user.id)
        .eq('jobs.status', 'in_progress');

      const pendingQuotes = (inProgressQuotes ?? []).filter((q) => {
        const job = Array.isArray(q.jobs) ? q.jobs[0] : q.jobs;
        return job?.accepted_quote_id === q.id;
      });

      const pendingCents = Math.round(
        pendingQuotes.reduce((sum, q) => sum + Number(q.quote_amount_cents ?? 0), 0) * 0.9
      );

      setSummary({ monthlyNetCents, pendingCents, completedJobsThisMonth });
      setLoading(false);
    };

    void load();
  }, []);

  return (
    <div>
      <p className="text-sm font-bold" style={{ color: '#0f172a' }}>Earnings</p>
      <p className="mt-0.5 text-xs" style={{ color: '#64748b' }}>
        {new Date().toLocaleDateString('en-IE', { month: 'long', year: 'numeric' })}
      </p>
      {loading ? (
        <div className="mt-3">
          <Skeleton lines={2} height="h-8" />
        </div>
      ) : null}
      {error ? <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      {!loading && !error && summary ? (
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div className="rounded-xl p-3" style={{ border: '1px solid var(--wm-border)', background: 'white' }}>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: '#64748b' }}>
              <TrendingUp size={13} />
              This month (net)
            </div>
            <p className="mt-1 text-xl font-bold" style={{ color: '#0f172a' }}>
              {formatEur(summary.monthlyNetCents)}
            </p>
          </div>
          <div className="rounded-xl p-3" style={{ border: '1px solid var(--wm-border)', background: 'white' }}>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: '#64748b' }}>
              <Clock size={13} />
              Pending payout
            </div>
            <p className="mt-1 text-xl font-bold" style={{ color: '#0f172a' }}>
              {formatEur(summary.pendingCents)}
            </p>
          </div>
          <div className="rounded-xl p-3" style={{ border: '1px solid var(--wm-border)', background: 'white' }}>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: '#64748b' }}>
              <Briefcase size={13} />
              Jobs completed
            </div>
            <p className="mt-1 text-xl font-bold" style={{ color: '#0f172a' }}>
              {summary.completedJobsThisMonth}
            </p>
          </div>
        </div>
      ) : null}
      {!loading && !error && summary && summary.monthlyNetCents === 0 && summary.completedJobsThisMonth === 0 ? (
        <p className="mt-2 text-xs" style={{ color: '#64748b' }}>
          No completed jobs this month. Earnings will appear here once jobs are marked complete.
        </p>
      ) : null}
    </div>
  );
}
