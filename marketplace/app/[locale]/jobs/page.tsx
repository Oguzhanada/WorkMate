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
  description: string | null;
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
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; status?: string; category?: string; sort?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const supabase = await getSupabaseServerClient();
  const selectedStatus = query.status?.trim() ?? 'all';
  const selectedCategory = query.category?.trim() ?? 'all';
  const selectedSort = query.sort?.trim() ?? 'newest';
  const textQuery = query.q?.trim() ?? '';

  let queryBuilder = supabase
    .from('jobs')
    .select('id,title,description,category,county,locality,budget_range,status,review_status,created_at')
    .in('status', ['open', 'quoted', 'accepted', 'in_progress'])
    .eq('review_status', 'approved')
    .order('created_at', { ascending: false })
    .limit(100);

  if (selectedStatus !== 'all') {
    queryBuilder = queryBuilder.eq('status', selectedStatus);
  }

  if (selectedCategory !== 'all') {
    queryBuilder = queryBuilder.eq('category', selectedCategory);
  }

  if (textQuery) {
    queryBuilder = queryBuilder.or(`title.ilike.%${textQuery}%,description.ilike.%${textQuery}%,category.ilike.%${textQuery}%`);
  }

  const { data, error } = await queryBuilder;
  const jobs = (data ?? []) as JobRow[];
  const categories = Array.from(new Set(jobs.map((job) => job.category))).sort((a, b) => a.localeCompare(b));

  const budgetRank = (value: string) => {
    if (value.includes('50') || value.includes('100')) return 1;
    if (value.includes('200')) return 2;
    if (value.includes('500')) return 3;
    if (value.includes('1,000') || value.includes('1000')) return 4;
    if (value.includes('+')) return 5;
    return 99;
  };

  const sortedJobs = [...jobs];
  if (selectedSort === 'oldest') {
    sortedJobs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  } else if (selectedSort === 'budget_low') {
    sortedJobs.sort((a, b) => budgetRank(a.budget_range) - budgetRank(b.budget_range));
  } else if (selectedSort === 'budget_high') {
    sortedJobs.sort((a, b) => budgetRank(b.budget_range) - budgetRank(a.budget_range));
  }

  // Server component: runs once per request, Date.now() is safe here
  // eslint-disable-next-line react-hooks/purity
  const serverNow = Date.now();
  const quoteWindowText = (createdAt: string) => {
    const end = new Date(createdAt).getTime() + 7 * 24 * 60 * 60 * 1000;
    const diff = end - serverNow;
    if (diff <= 0) return 'Quote window ending soon';
    const hours = Math.floor(diff / (60 * 60 * 1000));
    if (hours < 24) return `${hours}h left in quote window`;
    const days = Math.ceil(hours / 24);
    return `${days}d left in quote window`;
  };

  return (
    <Shell
      header={
        <Card className="rounded-3xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1>Job Board</h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--wm-muted)' }}>
                Browse active tasks with filters, sorting, and quick summaries.
              </p>
            </div>
            <Button href={`/${locale}/post-job`} variant="primary">
              Post a new job
            </Button>
          </div>
          <form className="mt-4 grid gap-3 md:grid-cols-4" method="get">
            <input
              type="text"
              name="q"
              defaultValue={textQuery}
              className="rounded-xl border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--wm-border)' }}
              placeholder="Search by title, category, or keyword"
            />
            <select
              name="status"
              defaultValue={selectedStatus}
              className="rounded-xl border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--wm-border)' }}
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="quoted">Quoted</option>
              <option value="accepted">Accepted</option>
              <option value="in_progress">In progress</option>
            </select>
            <select
              name="category"
              defaultValue={selectedCategory}
              className="rounded-xl border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--wm-border)' }}
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <select
                name="sort"
                defaultValue={selectedSort}
                className="w-full rounded-xl border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--wm-border)' }}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="budget_low">Budget: low to high</option>
                <option value="budget_high">Budget: high to low</option>
              </select>
              <Button
                type="submit"
                variant="outline"
                size="sm"
              >
                Apply
              </Button>
            </div>
          </form>
        </Card>
      }
    >
      {error ? (
        <div
          className="rounded-xl px-3 py-2 text-sm"
          style={{
            border: '1px solid rgba(var(--wm-destructive-rgb), 0.25)',
            background: 'var(--wm-destructive-light)',
            color: 'var(--wm-destructive)',
          }}
        >
          Jobs could not be loaded: {error.message}
        </div>
      ) : null}

      {sortedJobs.length === 0 && !error ? (
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
        {sortedJobs.map((job) => (
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
              <p className="mt-2 text-xs" style={{ color: 'var(--wm-muted)' }}>
                {job.category} · {job.locality ?? '-'}, {job.county ?? '-'}
              </p>
              <p className="mt-2 line-clamp-2 text-xs" style={{ color: 'var(--wm-muted)' }}>
                {job.description?.trim() || 'No additional summary provided yet.'}
              </p>
              <p className="mt-1 text-xs" style={{ color: 'var(--wm-muted)' }}>
                Budget: {job.budget_range}
              </p>
              <p className="mt-1 text-xs font-medium" style={{ color: 'var(--wm-primary-dark)' }}>
                {quoteWindowText(job.created_at)}
              </p>
              <p className="mt-1 text-xs" style={{ color: 'var(--wm-subtle)' }}>
                {new Date(job.created_at).toLocaleDateString('en-IE')}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </Shell>
  );
}
