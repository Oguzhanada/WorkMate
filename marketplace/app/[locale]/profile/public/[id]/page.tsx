import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {getSupabaseServiceClient} from '@/lib/supabase/service';
import Button from '@/components/ui/Button';
import ComplianceBadge from '@/components/ui/ComplianceBadge';
import GardaVettingBadge from '@/components/ui/GardaVettingBadge';
import PortfolioGallery from '@/components/profile/PortfolioGallery';
import styles from '../../../inner.module.css';

const baseUrl = process.env.NEXT_PUBLIC_PLATFORM_BASE_URL ?? 'https://workmate.ie';

type Params = Promise<{locale: string; id: string}>;

export async function generateMetadata({params}: {params: Params}): Promise<Metadata> {
  const {locale, id} = await params;
  const supabase = getSupabaseServiceClient();

  const [{data: profile}, {data: services}] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name,avatar_url,is_verified')
      .eq('id', id)
      .maybeSingle(),
    supabase.from('pro_services').select('category_id').eq('profile_id', id),
  ]);

  if (!profile) return {};

  const categoryIds = Array.from(new Set((services ?? []).map((s) => s.category_id)));
  const {data: categories} = categoryIds.length
    ? await supabase.from('categories').select('id,name').in('id', categoryIds)
    : {data: [] as Array<{id: string; name: string}>};

  const serviceNames = (categories ?? []).map((c) => c.name).filter(Boolean);
  const providerName = profile.full_name ?? 'Service Provider';
  const primaryCategory = serviceNames[0] ?? 'Service Provider';
  const title = serviceNames.length
    ? `${providerName} — ${primaryCategory} | WorkMate`
    : `${providerName} | WorkMate`;
  const description = serviceNames.length
    ? `Book ${providerName} on WorkMate Ireland. Services: ${serviceNames.join(', ')}.`
    : `Book ${providerName} on WorkMate Ireland.`;

  return {
    title,
    description,
    openGraph: {
      title: `${providerName} | WorkMate`,
      description,
      images: profile.avatar_url ? [{url: profile.avatar_url}] : [],
      type: 'profile',
      siteName: 'WorkMate',
    },
    twitter: {
      card: 'summary',
      title: `${providerName} | WorkMate`,
      description,
    },
    alternates: {
      canonical: `${baseUrl}/${locale}/profile/public/${id}`,
    },
  };
}

export default async function PublicProfilePage({params}: {params: Params}) {
  const {locale, id} = await params;
  const supabase = getSupabaseServiceClient();

  const [{data: profile}, {data: jobsCount}, {data: services}, {data: areas}, {data: portfolio}] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id,full_name,avatar_url,created_at,is_verified,verification_status,compliance_score,garda_vetting_status,garda_vetting_expires_at')
        .eq('id', id)
        .maybeSingle(),
      supabase
        .from('jobs')
        .select('id')
        .eq('customer_id', id),
      supabase.from('pro_services').select('category_id').eq('profile_id', id),
      supabase.from('pro_service_areas').select('county').eq('profile_id', id),
      supabase
        .from('pro_portfolio')
        .select('id,title,before_image_url,after_image_url,experience_note,visibility_scope,created_at')
        .eq('profile_id', id)
        .eq('visibility_scope', 'public')
        .order('created_at', {ascending: false})
        .limit(8),
    ]);

  if (!profile) {
    notFound();
  }

  const categoryIds = Array.from(new Set((services ?? []).map((item) => item.category_id)));
  const {data: categories} = categoryIds.length
    ? await supabase.from('categories').select('id,name').in('id', categoryIds)
    : {data: [] as Array<{id: string; name: string}>};
  const nameById = new Map((categories ?? []).map((item) => [item.id, item.name]));
  const serviceNames = categoryIds.map((idValue) => nameById.get(idValue)).filter(Boolean);
  const areaNames = Array.from(new Set((areas ?? []).map((item) => item.county)));
  const tasksPosted = (jobsCount ?? []).length;

  // Fetch public reviews (including provider responses) for display + JSON-LD
  const {data: reviewRows} = await supabase
    .from('reviews')
    .select('id,rating,comment,quality_rating,communication_rating,punctuality_rating,value_rating,provider_response,provider_responded_at,created_at')
    .eq('pro_id', id)
    .eq('is_public', true)
    .order('created_at', {ascending: false})
    .limit(20);
  const reviewCount = (reviewRows ?? []).length;
  const avgRating =
    reviewCount > 0
      ? ((reviewRows ?? []).reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1)
      : null;

  const providerName = profile.full_name ?? 'Service Provider';
  const primaryCategory = (serviceNames[0] as string | undefined) ?? 'Service Provider';

  const personSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: providerName,
    description: serviceNames.length
      ? `${providerName} offers ${serviceNames.join(', ')} services in Ireland.`
      : `${providerName} is a verified service provider on WorkMate Ireland.`,
    jobTitle: primaryCategory,
    url: `${baseUrl}/${locale}/profile/public/${id}`,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IE',
      ...(areaNames.length ? {addressRegion: areaNames[0]} : {}),
    },
    ...(profile.avatar_url ? {image: profile.avatar_url} : {}),
    ...(avgRating && reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: avgRating,
            reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  return (
    <main className={styles.section}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(personSchema)}}
      />
      <section className={styles.container}>
        <article className={styles.card}>
          <div className={styles.profileTopRow}>
            <div className={styles.actions}>
              <Button href="/providers" variant="ghost" size="sm">
                ← Back
              </Button>
            </div>
          </div>
          <div className={styles.profileTopRow}>
            <div className={styles.actions}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile avatar" style={{width: 96, height: 96, borderRadius: 999}} />
              ) : (
                <div className="grid h-24 w-24 place-items-center rounded-full border border-[var(--wm-border)] bg-[var(--wm-surface)] font-bold text-[var(--wm-text-muted)]">
                  {(profile.full_name ?? 'U')
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase())
                    .join('') || 'U'}
                </div>
              )}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1>{profile.full_name ?? 'Member'}</h1>
                  <ComplianceBadge score={(profile as { compliance_score?: number }).compliance_score ?? 0} />
                  <GardaVettingBadge
                    status={(profile as { garda_vetting_status?: string | null }).garda_vetting_status as Parameters<typeof GardaVettingBadge>[0]['status']}
                    expiresAt={(profile as { garda_vetting_expires_at?: string | null }).garda_vetting_expires_at}
                  />
                </div>
                <p className={styles.muted}>Joined: {new Date(profile.created_at).toLocaleDateString()}</p>
                <p className={styles.muted}>
                  Status: {profile.is_verified ? 'Verified' : profile.verification_status ?? 'Pending'}
                </p>
              </div>
            </div>
          </div>
          <div className={styles.grid3}>
            <div>
              <p className={styles.muted}>Tasks posted</p>
              <p>{tasksPosted}</p>
            </div>
            <div>
              <p className={styles.muted}>Services</p>
              <p>{serviceNames.length ? serviceNames.join(', ') : '-'}</p>
            </div>
            <div>
              <p className={styles.muted}>Service areas</p>
              <p>{areaNames.length ? areaNames.join(', ') : '-'}</p>
            </div>
          </div>
        </article>
      </section>

      {/* ── Customer Reviews ──────────────────────────────────────────── */}
      <section className={styles.container}>
        <article className={styles.card}>
          <div className="flex items-center justify-between">
            <h2>Reviews</h2>
            {avgRating && reviewCount > 0 ? (
              <span className="text-sm" style={{ color: 'var(--wm-muted)' }}>
                {avgRating} avg · {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
              </span>
            ) : null}
          </div>
          {reviewCount === 0 ? (
            <p className={styles.muted}>No public reviews yet.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {(reviewRows ?? []).map((review) => (
                <div
                  key={review.id}
                  className="rounded-xl p-4"
                  style={{ border: '1px solid var(--wm-border)', background: 'var(--wm-bg)' }}
                >
                  {/* Overall stars + date */}
                  <div className="flex items-center justify-between gap-2">
                    <span style={{ color: 'var(--wm-amber)' }} aria-label={`${review.rating} out of 5`}>
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--wm-subtle)' }}>
                      {new Date(review.created_at).toLocaleDateString('en-IE', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Review comment */}
                  {review.comment ? (
                    <p className="mt-2 text-sm" style={{ color: 'var(--wm-text)' }}>{review.comment}</p>
                  ) : null}

                  {/* Dimension ratings */}
                  {(review.quality_rating || review.communication_rating || review.punctuality_rating || review.value_rating) ? (
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--wm-muted)' }}>
                      {review.quality_rating ? <span>Quality: {review.quality_rating}/5</span> : null}
                      {review.communication_rating ? <span>Communication: {review.communication_rating}/5</span> : null}
                      {review.punctuality_rating ? <span>Punctuality: {review.punctuality_rating}/5</span> : null}
                      {review.value_rating ? <span>Value: {review.value_rating}/5</span> : null}
                    </div>
                  ) : null}

                  {/* Provider response (read-only on public page) */}
                  {review.provider_response ? (
                    <div
                      className="mt-3 rounded-lg px-3 py-3"
                      style={{ border: '1px solid var(--wm-primary-light)', background: 'var(--wm-primary-faint)' }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold" style={{ color: 'var(--wm-primary-dark)' }}>
                          Provider&apos;s Response
                        </p>
                        {review.provider_responded_at ? (
                          <span className="shrink-0 text-xs" style={{ color: 'var(--wm-primary-dark)', opacity: 0.6 }}>
                            {new Date(review.provider_responded_at).toLocaleDateString('en-IE', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--wm-primary-dark)' }}>
                        {review.provider_response}
                      </p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      {/* ── Public Portfolio (before/after) ────────────────────────────── */}
      <section className={styles.container}>
        <article className={styles.card}>
          <h2>Public portfolio</h2>
          {(portfolio ?? []).length === 0 ? (
            <p className={styles.muted}>No public work samples yet.</p>
          ) : (
            <div className={styles.grid3}>
              {(portfolio ?? []).map((item) => (
                <article key={item.id} className={styles.card}>
                  <h3>{item.title || 'Work sample'}</h3>
                  <div className={styles.grid2}>
                    <img src={item.before_image_url} alt="Before" style={{width: '100%', borderRadius: 10}} />
                    <img src={item.after_image_url} alt="After" style={{width: '100%', borderRadius: 10}} />
                  </div>
                  {item.experience_note ? <p className={styles.muted}>{item.experience_note}</p> : null}
                </article>
              ))}
            </div>
          )}
        </article>
      </section>

      {/* ── Work Gallery ───────────────────────────────────────────────── */}
      <section className={styles.container}>
        <article className={styles.card}>
          <h2 className="mb-4">Work Gallery</h2>
          <PortfolioGallery providerId={id} />
        </article>
      </section>
    </main>
  );
}
