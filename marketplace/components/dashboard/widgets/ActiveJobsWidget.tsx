'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Briefcase } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getLocaleRoot, withLocalePrefix } from '@/lib/i18n/locale-path';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

type Job = {
  id: string;
  title: string;
  status: string;
  created_at: string;
};

type Props = {
  limit?: number;
};

export default function ActiveJobsWidget({ limit = 6 }: Props) {
  const pathname = usePathname() || '/';
  const localeRoot = getLocaleRoot(pathname);
  const [jobs, setJobs] = useState<Job[]>([]);
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

      const { data: roleRows } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
      const isProvider = (roleRows ?? []).some((r: { role: string }) => r.role === 'verified_pro');

      if (isProvider) {
        const { data: quotes } = await supabase.from('quotes').select('id').eq('pro_id', user.id);
        const acceptedQuoteIds = (quotes ?? []).map((row: { id: string }) => row.id);
        if (acceptedQuoteIds.length === 0) {
          setJobs([]);
          setLoading(false);
          return;
        }

        const { data: providerJobs, error: jobError } = await supabase
          .from('jobs')
          .select('id,title,status,created_at')
          .in('accepted_quote_id', acceptedQuoteIds)
          .in('status', ['accepted', 'in_progress'])
          .order('created_at', { ascending: false })
          .limit(limit);

        if (jobError) {
          setError(jobError.message);
        } else {
          setJobs(providerJobs ?? []);
        }
      } else {
        const { data: customerJobs, error: jobError } = await supabase
          .from('jobs')
          .select('id,title,status,created_at')
          .eq('customer_id', user.id)
          .in('status', ['open', 'quoted', 'accepted', 'in_progress'])
          .order('created_at', { ascending: false })
          .limit(limit);

        if (jobError) {
          setError(jobError.message);
        } else {
          setJobs(customerJobs ?? []);
        }
      }

      setLoading(false);
    };

    void load();
  }, [limit]);

  return (
    <div>
      <p className="text-sm font-bold" style={{ color: 'var(--wm-navy)' }}>Active Jobs</p>
      <p className="mt-1 text-xs" style={{ color: 'var(--wm-muted)' }}>Jobs currently open or in progress.</p>
      {loading ? (
        <div className="mt-3">
          <Skeleton lines={3} height="h-10" />
        </div>
      ) : null}
      {error ? <p className="mt-2 text-sm text-[var(--wm-destructive)]">{error}</p> : null}
      {!loading && !error && jobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={28} />}
          title="No active jobs"
          description="Jobs you are working on will appear here."
        />
      ) : null}
      <div className="mt-2 space-y-2">
        {jobs.map((job) => (
          <Link
            key={job.id}
            href={withLocalePrefix(localeRoot, `/jobs/${job.id}`)}
            className="block rounded-xl px-3 py-2.5 text-sm no-underline transition"
            style={{ border: '1px solid var(--wm-border)', background: 'var(--wm-surface)' }}
          >
            <p className="font-semibold" style={{ color: 'var(--wm-navy)' }}>{job.title}</p>
            <p className="text-xs" style={{ color: 'var(--wm-muted)' }}>
              {job.status.replace('_', ' ')} · {new Date(job.created_at).toLocaleDateString('en-IE')}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
