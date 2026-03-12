import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { getUserRoles } from '@/lib/auth/rbac';
import JobCollaborationPanel from '@/components/jobs/JobCollaborationPanel';
import JobOffersPanel from '@/components/jobs/JobOffersPanel';
import JobContractPanel from '@/components/jobs/JobContractPanel';
import JobStatusTimeline from '@/components/jobs/JobStatusTimeline';
import TimeTracking from '@/components/jobs/TimeTracking';
import JobScheduler from '@/components/jobs/JobScheduler';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import styles from '../../inner.module.css';

const baseUrl = process.env.NEXT_PUBLIC_PLATFORM_BASE_URL ?? 'https://workmate.ie';

type Props = {
  params: Promise<{ locale: string; jobId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, jobId } = await params;
  const supabase = getSupabaseServiceClient();

  const { data: job } = await supabase
    .from('jobs')
    .select('title, description, status, category, county, locality, created_at')
    .eq('id', jobId)
    .maybeSingle();

  if (!job) return {};

  const isOpen = job.status === 'open';
  const title = `${job.title} — Find a Provider`;
  const rawDescription = job.description ?? `${job.title} — find a trusted provider in Ireland.`;
  const description = rawDescription.length > 160 ? rawDescription.slice(0, 157) + '...' : rawDescription;
  const location = job.county ?? job.locality ?? 'Ireland';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'WorkMate',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: `${baseUrl}/${locale}/jobs/${jobId}`,
    },
    robots: isOpen
      ? { index: true, follow: true }
      : { index: false, follow: false },
    other: {
      'job:location': location,
      'job:category': job.category ?? '',
    },
  };
}

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
      id, title, description, category, category_id, county, locality, budget_range,
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

  // Check if the customer viewing their own job is verified (for Limited Visibility banner)
  let customerIsVerified = true;
  if (isCustomer) {
    const { data: customerProfile } = await supabase
      .from('profiles')
      .select('id_verification_status')
      .eq('id', user.id)
      .maybeSingle();
    customerIsVerified = customerProfile?.id_verification_status === 'approved';
  }

  const otherUserName = isCustomer
    ? (proName ?? 'Provider')
    : ((job.customer as unknown as { full_name: string | null } | null)?.full_name ?? 'Customer');

  const statusColors: Record<string, string> = {
    open: 'var(--wm-info)',
    quoted: 'var(--wm-amber-dark)',
    accepted: 'var(--wm-primary)',
    in_progress: 'var(--wm-navy)',
    completed: 'var(--wm-muted)',
    cancelled: 'var(--wm-destructive)',
  };

  const validThrough = new Date(
    new Date(job.created_at).getTime() + 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const [{ data: reviews }, { data: questions }, { count: offerCount }, { data: firstAppointment }] = await Promise.all([
    supabase
      .from('reviews')
      .select('id,customer_id,rating,comment,created_at')
      .eq('job_id', job.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('job_messages')
      .select('id,sender_id,message,created_at,visibility')
      .eq('job_id', job.id)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('quotes')
      .select('id', { count: 'exact', head: true })
      .eq('job_id', job.id),
    supabase
      .from('appointments')
      .select('start_time')
      .eq('job_id', job.id)
      .order('start_time', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const profileIds = Array.from(
    new Set([
      ...(reviews ?? []).map((item) => item.customer_id),
      ...(questions ?? []).map((item) => item.sender_id),
    ])
  );

  const profileMap = new Map<string, string>();
  if (profileIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id,full_name')
      .in('id', profileIds);
    for (const profile of profiles ?? []) {
      profileMap.set(profile.id, profile.full_name ?? 'WorkMate user');
    }
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description ?? job.title,
    datePosted: job.created_at,
    validThrough,
    hiringOrganization: {
      '@type': 'Organization',
      name: 'WorkMate',
      sameAs: process.env.NEXT_PUBLIC_PLATFORM_BASE_URL ?? 'https://workmate.ie',
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'IE',
        ...(job.county ?? job.locality
          ? { addressRegion: job.county ?? job.locality }
          : {}),
      },
    },
    employmentType: 'CONTRACTOR',
  };

  return (
    <main className={styles.section}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
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
                background: statusColors[job.status] ?? 'var(--wm-muted)',
                color: 'var(--wm-background)',
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

        {isCustomer || isPro || isAdmin ? (
          <Card>
            <JobStatusTimeline
              jobId={job.id}
              status={job.status}
              createdAt={job.created_at}
              offers={{ count: offerCount ?? 0 }}
              appointmentAt={firstAppointment?.start_time ?? null}
            />
          </Card>
        ) : null}

        {isCustomer && !customerIsVerified && (job.status === 'open' || job.status === 'quoted') ? (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '14px 18px',
              borderRadius: 12,
              background: 'color-mix(in srgb, var(--wm-amber-dark) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--wm-amber-dark) 30%, transparent)',
            }}
          >
            <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⚡</span>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>
                Limited Visibility — fewer providers can see this listing
              </p>
              <p style={{ margin: '4px 0 10px', fontSize: '0.85rem', color: 'var(--wm-muted)' }}>
                Verified customers receive up to 3× more offers.{' '}
                <strong>Verify your identity</strong> to unlock full visibility and unlimited quotes.
              </p>
              <Button href={`/${locale}/dashboard/customer?tab=verification`} variant="primary" size="sm">
                Verify my identity
              </Button>
            </div>
          </div>
        ) : null}

        {isCustomer && (job.status === 'open' || job.status === 'quoted') ? (
          <JobOffersPanel
            jobId={job.id}
            customerId={user.id}
            locale={locale}
            categoryId={(job as { category_id?: string | null }).category_id ?? null}
            jobCreatedAt={job.created_at}
          />
        ) : null}

        {['accepted', 'in_progress', 'completed'].includes(job.status) &&
        (isCustomer || isPro || isAdmin) ? (
          <JobContractPanel
            jobId={job.id}
            currentUserId={user.id}
            userRole={isAdmin ? 'admin' : isCustomer ? 'customer' : 'verified_pro'}
          />
        ) : null}

        <article className={styles.card} style={{ padding: 0 }}>
          <JobCollaborationPanel
            jobId={job.id}
            currentUserId={user.id}
            otherUserName={otherUserName}
          />
        </article>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Reviews and ratings</h2>
            <Button href={`/${locale}/profile/public/${proId ?? user.id}`} variant="secondary" size="sm">
              View profile
            </Button>
          </div>
          {reviews && reviews.length > 0 ? (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-xl border p-3" style={{ borderColor: 'var(--wm-border)' }}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">
                      {profileMap.get(review.customer_id) ?? 'Customer'}
                    </p>
                    <p className="text-xs font-semibold" style={{ color: 'var(--wm-amber-dark)' }}>
                      {'★'.repeat(Math.max(1, Math.min(5, review.rating)))}
                    </p>
                  </div>
                  <p className="mt-1 text-xs" style={{ color: 'var(--wm-muted)' }}>
                    {review.comment?.trim() || 'No written review provided.'}
                  </p>
                  <p className="mt-1 text-[11px]" style={{ color: 'var(--wm-subtle)' }}>
                    {new Date(review.created_at).toLocaleDateString('en-IE')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm" style={{ color: 'var(--wm-muted)' }}>
              No public review submitted yet for this task.
            </p>
          )}
        </Card>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Questions and answers</h2>
            <Button href={`/${locale}/messages`} variant="primary" size="sm">
              Ask a question in messages
            </Button>
          </div>
          {questions && questions.length > 0 ? (
            <div className="mt-3 space-y-3">
              {questions.map((entry) => (
                <div key={entry.id} className="rounded-xl border p-3" style={{ borderColor: 'var(--wm-border)' }}>
                  <p className="text-sm font-semibold">
                    {profileMap.get(entry.sender_id) ?? 'WorkMate user'}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: 'var(--wm-text)' }}>{entry.message}</p>
                  <p className="mt-1 text-[11px]" style={{ color: 'var(--wm-subtle)' }}>
                    {new Date(entry.created_at).toLocaleString('en-IE')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm" style={{ color: 'var(--wm-muted)' }}>
              No public questions yet. Use private messages to coordinate details safely.
            </p>
          )}
        </Card>

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
