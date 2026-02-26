import Link from 'next/link';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import styles from '../inner.module.css';

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

export default async function JobsPage() {
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
    <main className={styles.section}>
      <section className={styles.container}>
        <article className={styles.card}>
          <h1>Job Board</h1>
          <p className={styles.muted}>Browse recent job requests and available opportunities.</p>
          <Link className={styles.primary} href="/post-job">
            Post a new job
          </Link>
        </article>
      </section>

      <section className={styles.container}>
        {error ? <div className={styles.error}>Jobs could not be loaded: {error.message}</div> : null}
        <div className={styles.grid3}>
          {jobs.map((job) => (
            <article key={job.id} className={styles.card}>
              <h3>{job.title}</h3>
              <p className={styles.muted}>
                {job.category} • {job.locality ?? '-'}, {job.county ?? '-'}
              </p>
              <p className={styles.muted}>Budget: {job.budget_range}</p>
              <p className={styles.muted}>Status: {job.status}</p>
              <p className={styles.muted}>
                Posted: {new Date(job.created_at).toLocaleDateString()}
              </p>
            </article>
          ))}
        </div>
        {jobs.length === 0 ? <p className={styles.muted}>No active jobs yet.</p> : null}
      </section>
    </main>
  );
}
