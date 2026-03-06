import Link from 'next/link';
import { Briefcase } from 'lucide-react';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import Shell from '@/components/ui/Shell';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';

type JobRow = {
  id: string;
  title: string;
  category: string;
  county: string | null;
  locality: string | null;
  budget_range: string;
  status: string;
  review_status: string;
  created_at: string;
};

const STATUS_TONE: Record<string, 'open' | 'pending' | 'completed' | 'assigned' | 'neutral'> = {
  open: 'open',
  quoted: 'pending',
  accepted: 'assigned',
  in_progress: 'assigned',
};

export default async function JobsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('jobs')
    .select('id,title,category,county,locality,budget_range,status,review_status,created_at')
    .in('status', ['open', 'quoted', 'accepted', 'in_progress'])
    .eq('review_status', 'approved')
    .order('created_at', { ascending: false })
    .limit(100);

  const jobs = (data ?? []) as JobRow[];

  return (
    <Shell
      header={
        <Card className="rounded-3xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1>Job Board</h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Browse recent job requests and available opportunities.
              </p>
            </div>
            <Button href={`/${locale}/post-job`} variant="primary">
              Post a new job
            </Button>
          </div>
        </Card>
      }
    >
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          Jobs could not be loaded: {error.message}
        </div>
      ) : null}

      {jobs.length === 0 && !error ? (
        <Card className="mt-4">
          <EmptyState
            icon={<Briefcase size={32} />}
            title="No active jobs yet"
            description="Be the first to post a job and get quotes from verified providers."
            action={
              <Button href={`/${locale}/post-job`} variant="primary">
                Post a job
              </Button>
            }
          />
        </Card>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <Link
            key={job.id}
            href={`/${locale}/jobs/${job.id}`}
            className="block no-underline"
          >
            <Card className="h-full transition-shadow hover:shadow-[var(--wm-shadow-lg)]">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold leading-snug">{job.title}</h3>
                <Badge tone={STATUS_TONE[job.status] ?? 'neutral'}>
                  {job.status.replace('_', ' ')}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                {job.category} · {job.locality ?? '-'}, {job.county ?? '-'}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Budget: {job.budget_range}
              </p>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                {new Date(job.created_at).toLocaleDateString('en-IE')}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </Shell>
  );
}
