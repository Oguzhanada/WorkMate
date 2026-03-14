'use client';

import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import OfferRankingBadge from '@/components/offers/OfferRankingBadge';

type Quote = {
  id: string;
  job_id: string;
  status: string;
  created_at: string;
  ranking_score: number | null;
};

type Props = {
  limit?: number;
};

export default function PendingQuotesWidget({ limit = 8 }: Props) {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<Quote[]>([]);
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

      const { data: providerQuotes } = await supabase
        .from('quotes')
        .select('id,job_id,status,created_at,ranking_score')
        .eq('pro_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if ((providerQuotes ?? []).length > 0) {
        const pending = (providerQuotes ?? []).filter((quote: Quote) => quote.status !== 'accepted' && quote.status !== 'rejected');
        setItems(pending);
        setCount(pending.length);
        setLoading(false);
        return;
      }

      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (jobsError) {
        setError(jobsError.message);
        setLoading(false);
        return;
      }

      const jobIds = (jobs ?? []).map((job: { id: string }) => job.id);
      if (jobIds.length === 0) {
        setItems([]);
        setCount(0);
        setLoading(false);
        return;
      }

      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select('id,job_id,status,created_at,ranking_score')
        .in('job_id', jobIds)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (quotesError) {
        setError(quotesError.message);
      } else {
        const pending = (quotes ?? [])
          .filter((quote: Quote) => quote.status !== 'accepted' && quote.status !== 'rejected')
          .sort((a: Quote, b: Quote) => {
            const aScore = a.ranking_score ?? 0;
            const bScore = b.ranking_score ?? 0;
            if (bScore !== aScore) return bScore - aScore;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
        setItems(pending);
        setCount(pending.length);
      }

      setLoading(false);
    };

    void load();
  }, [limit]);

  return (
    <div>
      <p className="text-sm font-bold" style={{ color: 'var(--wm-navy)' }}>Pending Quotes</p>
      <p className="mt-1 text-xs" style={{ color: 'var(--wm-muted)' }}>Open quote activity waiting for next action.</p>
      {loading ? (
        <div className="mt-3">
          <Skeleton lines={3} height="h-10" />
        </div>
      ) : null}
      {error ? <p className="mt-2 text-sm text-[var(--wm-destructive)]">{error}</p> : null}
      {!loading && !error ? <p className="mt-2 text-lg font-semibold">{count}</p> : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState
          icon={<FileText size={28} />}
          title="No pending quotes"
          description="Quotes awaiting action will appear here."
        />
      ) : null}
      <div className="mt-2 space-y-2">
        {(() => {
          const seenJobs = new Set<string>();
          return items.slice(0, 4).map((item) => {
            const isTop = !seenJobs.has(item.job_id) && (item.ranking_score ?? 0) > 0;
            seenJobs.add(item.job_id);
            return (
              <div key={item.id} className="rounded-xl px-3 py-2.5 text-xs" style={{ border: '1px solid var(--wm-border)', background: 'var(--wm-surface)' }}>
                <div className="flex items-center gap-2 flex-wrap">
                  <p style={{ color: 'var(--wm-navy)' }}>Job: {item.job_id.slice(0, 8)}...</p>
                  {isTop ? <OfferRankingBadge score={item.ranking_score!} /> : null}
                </div>
                <p style={{ color: 'var(--wm-muted)' }}>{item.status} · {new Date(item.created_at).toLocaleDateString('en-IE')}</p>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}
