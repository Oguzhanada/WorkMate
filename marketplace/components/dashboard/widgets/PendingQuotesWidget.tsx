'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Quote = {
  id: string;
  job_id: string;
  status: string;
  created_at: string;
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
        .select('id,job_id,status,created_at')
        .eq('pro_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if ((providerQuotes ?? []).length > 0) {
        const pending = (providerQuotes ?? []).filter((quote) => quote.status !== 'accepted' && quote.status !== 'rejected');
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

      const jobIds = (jobs ?? []).map((job) => job.id);
      if (jobIds.length === 0) {
        setItems([]);
        setCount(0);
        setLoading(false);
        return;
      }

      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select('id,job_id,status,created_at')
        .in('job_id', jobIds)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (quotesError) {
        setError(quotesError.message);
      } else {
        const pending = (quotes ?? []).filter((quote) => quote.status !== 'accepted' && quote.status !== 'rejected');
        setItems(pending);
        setCount(pending.length);
      }

      setLoading(false);
    };

    void load();
  }, [limit]);

  return (
    <div>
      <p className="text-sm font-semibold">Pending Quotes</p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Open quote activity waiting for next action.</p>
      {loading ? <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Loading...</p> : null}
      {error ? <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      {!loading && !error ? <p className="mt-2 text-lg font-semibold">{count}</p> : null}
      <div className="mt-2 space-y-2">
        {items.slice(0, 4).map((item) => (
          <div key={item.id} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs dark:border-zinc-700">
            <p>Job: {item.job_id.slice(0, 8)}...</p>
            <p className="text-zinc-500 dark:text-zinc-400">{item.status} · {new Date(item.created_at).toLocaleDateString('en-IE')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
