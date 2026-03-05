import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getUserRoles } from '@/lib/auth/rbac';
import JobCollaborationPanel from '@/components/jobs/JobCollaborationPanel';
import TimeTracking from '@/components/jobs/TimeTracking';
import JobScheduler from '@/components/jobs/JobScheduler';
import styles from '../../inner.module.css';

type Props = {
  params: Promise<{ locale: string; jobId: string }>;
};

export default async function JobDetailPage({ params }: Props) {
  const { locale, jobId } = await params;
  const supabase = await getSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const roles = await getUserRoles(supabase, user.id);
  const isAdmin = roles.includes('admin');

  // Fetch job with accepted quote
  const { data: job } = await supabase
    .from('jobs')
    .select(`
      id, title, description, category, county, locality, budget_range,
      status, review_status, created_at, customer_id, accepted_quote_id,
      customer:profiles!customer_id(full_name)
    `)
    .eq('id', jobId)
    .maybeSingle();

  if (!job) redirect(`/${locale}/jobs`);

  // Resolve the pro from accepted quote
  let proId: string | null = null;
  let proName: string | null = null;
  if (job.accepted_quote_id) {
    const { data: quote } = await supabase
      .from('quotes')
      .select('pro_id, pro:profiles!pro_id(full_name)')
      .eq('id', job.accepted_quote_id)
      .maybeSingle();
    if (quote) {
      proId = quote.pro_id;
      proName = (quote.pro as unknown as { full_name: string | null } | null)?.full_name ?? null;
    }
  }

  const isCustomer = user.id === job.customer_id;
  const isPro = user.id === proId;

  if (!isCustomer && !isPro && !isAdmin) {
    redirect(`/${locale}/jobs`);
  }

  const otherUserName = isCustomer
    ? (proName ?? 'Provider')
    : ((job.customer as unknown as { full_name: string | null } | null)?.full_name ?? 'Customer');

  const statusColors: Record<string, string> = {
    open: '#0ea5e9',
    quoted: '#f59e0b',
    accepted: '#10b981',
    in_progress: '#8b5cf6',
    completed: '#6b7280',
    cancelled: '#ef4444',
  };

  return (
    <main className={styles.section}>
      <section className={styles.container}>
        <article className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{job.title}</h1>
              <p className={styles.muted} style={{ marginTop: 4 }}>
                {job.category} &middot; {job.county ?? job.locality ?? 'Ireland'} &middot; {job.budget_range}
              </p>
            </div>
            <span
              style={{
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: '0.8rem',
                fontWeight: 600,
                background: statusColors[job.status] ?? '#6b7280',
                color: '#fff',
                textTransform: 'capitalize',
              }}
            >
              {job.status.replace('_', ' ')}
            </span>
          </div>

          {job.description ? (
            <p style={{ marginTop: 12, fontSize: '0.9rem', lineHeight: 1.6 }}>{job.description}</p>
          ) : null}
        </article>

        <article className={styles.card} style={{ padding: 0 }}>
          <JobCollaborationPanel
            jobId={job.id}
            currentUserId={user.id}
            otherUserName={otherUserName}
          />
        </article>

        <TimeTracking
          jobId={job.id}
          isCustomer={isCustomer}
          isProvider={isPro}
          isAdmin={isAdmin}
        />

        <JobScheduler
          jobId={job.id}
          providerId={proId}
          isCustomer={isCustomer}
          isProvider={isPro}
          isAdmin={isAdmin}
        />
      </section>
    </main>
  );
}
