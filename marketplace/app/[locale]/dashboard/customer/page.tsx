import Link from 'next/link';
import { redirect } from 'next/navigation';
import { canPostJob, getUserRoles } from '@/lib/auth/rbac';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import JobMessagePanel from '@/components/dashboard/JobMessagePanel';
import JobPhotoUploader from '@/components/dashboard/JobPhotoUploader';
import JobStatusUpdater from '@/components/dashboard/JobStatusUpdater';
import QuoteActions from '@/components/dashboard/QuoteActions';
import DisputeButton from '@/components/disputes/DisputeButton';
import DisputeAlert from '@/components/disputes/DisputeAlert';
import AutoReleaseCountdown from '@/components/payments/AutoReleaseCountdown';
import CustomerReleaseWarning from '@/components/payments/CustomerReleaseWarning';
import styles from '../../inner.module.css';

export default async function CustomerDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login`);
  }

  const roles = await getUserRoles(supabase, user.id);
  if (!canPostJob(roles)) {
    redirect(`/profile`);
  }

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id,title,category,category_id,status,review_status,accepted_quote_id,budget_range,eircode,photo_urls,created_at,auto_release_at,payment_released_at')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return (
      <main className={styles.section}>
        <section className={styles.container}>
          <div className={styles.error}>Listings could not be loaded: {error.message}</div>
        </section>
      </main>
    );
  }

  const jobIds = (jobs ?? []).map((job) => job.id);
  const { data: activeDisputes } =
    jobIds.length > 0
      ? await supabase
          .from('disputes')
          .select('id,job_id,status')
          .in('job_id', jobIds)
          .in('status', ['open', 'under_review'])
      : { data: [] as Array<{ id: string; job_id: string; status: string }> };
  const { data: quotes } =
    jobIds.length > 0
      ? await supabase
          .from('quotes')
          .select('id,job_id,pro_id,quote_amount_cents,message,estimated_duration,includes,excludes,status,created_at')
          .in('job_id', jobIds)
          .order('created_at', { ascending: false })
      : { data: [] as Array<{ id: string; job_id: string; pro_id: string; quote_amount_cents: number; message: string | null; estimated_duration: string | null; includes: string[] | null; excludes: string[] | null; status: string; created_at: string }> };

  const proIds = Array.from(new Set((quotes ?? []).map((quote) => quote.pro_id)));
  const { data: pros } =
    proIds.length > 0
      ? await supabase
          .from('profiles')
          .select('id,full_name,stripe_account_id,id_verification_status,provider_matching_priority')
          .in('id', proIds)
      : {
          data: [] as Array<{
            id: string;
            full_name: string | null;
            stripe_account_id: string | null;
            id_verification_status: string | null;
            provider_matching_priority: number | null;
          }>
        };

  const { data: proReviews } =
    proIds.length > 0
      ? await supabase.from('reviews').select('pro_id,rating').in('pro_id', proIds)
      : { data: [] as Array<{ pro_id: string; rating: number }> };

  const proNameById = new Map((pros ?? []).map((pro) => [pro.id, pro.full_name ?? 'Professional']));
  const stripeAccountByProId = new Map((pros ?? []).map((pro) => [pro.id, pro.stripe_account_id]));
  const proVerificationById = new Map((pros ?? []).map((pro) => [pro.id, pro.id_verification_status ?? 'none']));
  const proPriorityById = new Map((pros ?? []).map((pro) => [pro.id, pro.provider_matching_priority ?? 1]));

  const { data: payments } =
    jobIds.length > 0
      ? await supabase
          .from('payments')
          .select('job_id,quote_id,status,stripe_payment_intent_id')
          .in('job_id', jobIds)
      : { data: [] as Array<{ job_id: string; quote_id: string; status: 'authorized' | 'captured' | 'cancelled' | 'refunded'; stripe_payment_intent_id: string }> };
  const paymentByQuoteId = new Map((payments ?? []).map((payment) => [payment.quote_id, payment]));

  const allQuoteIds = Array.from(new Set((quotes ?? []).map((quote) => quote.id)));
  const { data: completedJobs } =
    allQuoteIds.length > 0
      ? await supabase
          .from('jobs')
          .select('accepted_quote_id')
          .eq('status', 'completed')
          .in('accepted_quote_id', allQuoteIds)
      : { data: [] as Array<{ accepted_quote_id: string | null }> };

  const proByQuoteId = new Map((quotes ?? []).map((quote) => [quote.id, quote.pro_id]));
  const completedByPro = new Map<string, number>();
  for (const row of completedJobs ?? []) {
    if (!row.accepted_quote_id) continue;
    const proId = proByQuoteId.get(row.accepted_quote_id);
    if (!proId) continue;
    completedByPro.set(proId, (completedByPro.get(proId) ?? 0) + 1);
  }

  const { data: portfolio } =
    proIds.length > 0
      ? await supabase
          .from('pro_portfolio')
          .select('id,profile_id,category_id,before_image_url,after_image_url,experience_note,created_at')
          .in('profile_id', proIds)
          .order('created_at', { ascending: false })
      : {
          data: [] as Array<{
            id: string;
            profile_id: string;
            category_id: string | null;
            before_image_url: string;
            after_image_url: string;
            experience_note: string | null;
            created_at: string;
          }>,
        };

  const reviewStatsByPro = new Map<string, { count: number; avg: number }>();
  for (const review of proReviews ?? []) {
    const current = reviewStatsByPro.get(review.pro_id) ?? { count: 0, avg: 0 };
    const nextCount = current.count + 1;
    const nextAvg = (current.avg * current.count + review.rating) / nextCount;
    reviewStatsByPro.set(review.pro_id, { count: nextCount, avg: nextAvg });
  }

  const quotesByJob = new Map<string, Array<{ id: string; pro_id: string; quote_amount_cents: number; message: string | null; estimated_duration: string | null; includes: string[]; excludes: string[]; status: string; created_at: string }>>();
  for (const quote of quotes ?? []) {
    const arr = quotesByJob.get(quote.job_id) ?? [];
    arr.push({
      id: quote.id,
      pro_id: quote.pro_id,
      quote_amount_cents: quote.quote_amount_cents,
      message: quote.message,
      estimated_duration: quote.estimated_duration,
      includes: quote.includes ?? [],
      excludes: quote.excludes ?? [],
      status: quote.status,
      created_at: quote.created_at,
    });
    quotesByJob.set(quote.job_id, arr);
  }
  for (const [jobId, quoteList] of quotesByJob.entries()) {
    quotesByJob.set(
      jobId,
      quoteList.sort((left, right) => {
        const rightPriority = proPriorityById.get(right.pro_id) ?? 1;
        const leftPriority = proPriorityById.get(left.pro_id) ?? 1;
        if (rightPriority !== leftPriority) return rightPriority - leftPriority;
        return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
      })
    );
  }

  const statusCounts = new Map<string, number>();
  for (const job of jobs ?? []) {
    statusCounts.set(job.status, (statusCounts.get(job.status) ?? 0) + 1);
  }
  const totalJobs = (jobs ?? []).length;
  const openJobs = statusCounts.get('open') ?? 0;
  const assignedJobs = statusCounts.get('accepted') ?? 0;
  const completedJobsCount = statusCounts.get('completed') ?? 0;

  const monthKeys = Array.from({ length: 6 }, (_, index) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - index));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const monthCounts = new Map<string, number>(monthKeys.map((key) => [key, 0]));
  for (const job of jobs ?? []) {
    const d = new Date(job.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (monthCounts.has(key)) {
      monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
    }
  }
  const maxMonthly = Math.max(...Array.from(monthCounts.values()), 1);

  return (
    <main className={styles.section}>
      <section className={styles.container}>
        <article className={styles.card}>
          <h1>My Listings</h1>
          <p className={styles.muted}>Track all your job requests from here.</p>
          <div className={styles.actions}>
            <Link className={styles.primary} href={`/post-job`}>
              Create new job request
            </Link>
            <Link className={styles.secondaryLink} href={`/${locale}/dashboard/disputes`}>
              View disputes
            </Link>
          </div>
        </article>
        <DisputeAlert count={(activeDisputes ?? []).length} />
      </section>
      <section className={styles.container}>
        <article className={styles.card}>
          <h2>Job order overview</h2>
          <div className={styles.grid3}>
            <div className={styles.card}>
              <p className={styles.muted}>Total jobs</p>
              <p>{totalJobs}</p>
            </div>
            <div className={styles.card}>
              <p className={styles.muted}>Open jobs</p>
              <p>{openJobs}</p>
            </div>
            <div className={styles.card}>
              <p className={styles.muted}>Assigned / Completed</p>
              <p>
                {assignedJobs} / {completedJobsCount}
              </p>
            </div>
          </div>
          <div className={styles.chartWrap}>
            {monthKeys.map((key) => {
              const value = monthCounts.get(key) ?? 0;
              const height = Math.max(10, Math.round((value / maxMonthly) * 100));
              const labelDate = new Date(`${key}-01`);
              const label = labelDate.toLocaleDateString(undefined, { month: 'short' });
              return (
                <div key={key} className={styles.chartBarCol}>
                  <div className={styles.chartBar} style={{ height: `${height}px` }} title={`${value} jobs`} />
                  <small className={styles.muted}>{label}</small>
                  <small className={styles.muted}>{value}</small>
                </div>
              );
            })}
          </div>
        </article>
      </section>
      <section className={styles.container}>
        <div className={styles.grid3}>
          {(jobs ?? []).map((job) => (
            <article key={job.id} className={styles.card}>
              <h3>{job.title}</h3>
              <p className={styles.muted}>{job.category} • {job.eircode}</p>
              <p className={styles.muted}>Status: {job.status} • Review: {job.review_status ?? 'approved'}</p>
              <p className={styles.muted}>Budget: {job.budget_range}</p>
              {job.status === 'completed' ? <CustomerReleaseWarning /> : null}
              <AutoReleaseCountdown autoReleaseAt={job.auto_release_at ?? null} />
              {job.status === 'completed' ? <DisputeButton jobId={job.id} /> : null}
              <JobStatusUpdater jobId={job.id} initialStatus={job.status} />
              <JobPhotoUploader
                jobId={job.id}
                customerId={user.id}
                initialPhotoUrls={Array.isArray(job.photo_urls) ? job.photo_urls : []}
              />
              <hr />
              <h4>Incoming quotes</h4>
              {(quotesByJob.get(job.id) ?? []).length === 0 ? (
                <p className={styles.muted}>No quotes yet.</p>
              ) : (
                <div className={styles.cardGrid}>
                  {(quotesByJob.get(job.id) ?? []).map((quote) => {
                    const stats = reviewStatsByPro.get(quote.pro_id) ?? { count: 0, avg: 0 };
                    const completed = completedByPro.get(quote.pro_id) ?? 0;
                    const portfolioItem =
                      (portfolio ?? []).find(
                        (item) =>
                          item.profile_id === quote.pro_id &&
                          (item.category_id === job.category_id || item.category_id === null)
                      ) ?? (portfolio ?? []).find((item) => item.profile_id === quote.pro_id);
                    return (
                      <div key={quote.id} className={styles.card}>
                        <p><strong>{proNameById.get(quote.pro_id) ?? 'Professional'}</strong></p>
                        {(proVerificationById.get(quote.pro_id) ?? 'none') === 'approved' ? (
                          <p className={styles.verifiedBadge}>✅ Verified Pro</p>
                        ) : (
                          <p className={styles.unverifiedBadge}>⚠️ Unverified</p>
                        )}
                        <p className={styles.muted}>
                          Rating: {stats.count > 0 ? `${stats.avg.toFixed(1)} / 5 (${stats.count} reviews)` : 'No reviews yet'}
                        </p>
                        <p className={styles.muted}>Completed jobs: {completed}+</p>
                        <p className={styles.muted}>
                          Quote: EUR {(quote.quote_amount_cents / 100).toFixed(2)} • Status: {quote.status}
                        </p>
                        {paymentByQuoteId.get(quote.id) ? (
                          <p className={styles.muted}>
                            Payment: {paymentByQuoteId.get(quote.id)?.status}
                          </p>
                        ) : null}
                        <p className={styles.muted}>Estimated duration: {quote.estimated_duration ?? '-'}</p>
                        <p className={styles.muted}>Included: {(quote.includes ?? []).join(', ') || '-'}</p>
                        <p className={styles.muted}>Excluded: {(quote.excludes ?? []).join(', ') || '-'}</p>
                        {quote.message ? <p className={styles.muted}>Message: {quote.message}</p> : null}
                        {(proVerificationById.get(quote.pro_id) ?? 'none') !== 'approved' ? (
                          <p className={styles.error}>
                            This provider has not completed ID verification yet. For additional safety, verified providers are recommended.
                          </p>
                        ) : null}
                        <QuoteActions
                          jobId={job.id}
                          jobStatus={job.status}
                          quoteId={quote.id}
                          quoteStatus={quote.status}
                          quoteAmountCents={quote.quote_amount_cents}
                          proId={quote.pro_id}
                          customerId={user.id}
                          connectedAccountId={stripeAccountByProId.get(quote.pro_id) ?? null}
                          isAcceptedQuote={job.accepted_quote_id === quote.id}
                          payment={paymentByQuoteId.get(quote.id) ?? null}
                        />
                        {portfolioItem ? (
                          <>
                            <div className={styles.grid3}>
                              <img src={portfolioItem.before_image_url} alt="Before" style={{ width: '100%', borderRadius: 10 }} />
                              <img src={portfolioItem.after_image_url} alt="After" style={{ width: '100%', borderRadius: 10 }} />
                            </div>
                            {portfolioItem.experience_note ? (
                              <p className={styles.muted}>Experience: {portfolioItem.experience_note}</p>
                            ) : null}
                          </>
                        ) : null}
                        <JobMessagePanel
                          jobId={job.id}
                          quoteId={quote.id}
                          receiverId={quote.pro_id}
                          visibility="private"
                          title="Private chat"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
              <JobMessagePanel jobId={job.id} visibility="public" title="Public job discussion" />
            </article>
          ))}
        </div>
        {(jobs ?? []).length === 0 ? <p className={styles.muted}>You have not posted any listings yet.</p> : null}
      </section>
    </main>
  );
}

