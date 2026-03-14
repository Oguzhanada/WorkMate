import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import Button from '@/components/ui/Button';
import ComplianceBadge from '@/components/ui/ComplianceBadge';
import FoundingProBadge from '@/components/ui/FoundingProBadge';
import PortfolioGallery from '@/components/profile/PortfolioGallery';
import ProviderBadges from '@/components/profile/ProviderBadges';
import QuoteRequestButton from '@/components/profile/QuoteRequestButton';

const baseUrl = process.env.NEXT_PUBLIC_PLATFORM_BASE_URL ?? 'https://workmate.ie';

type Params = Promise<{ locale: string; id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, id } = await params;
  const supabase = getSupabaseServiceClient();

  const [{ data: profile }, { data: services }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name,avatar_url,is_verified')
      .eq('id', id)
      .maybeSingle(),
    supabase.from('pro_services').select('category_id').eq('profile_id', id),
  ]);

  if (!profile) return {};

  const categoryIds = Array.from(new Set((services ?? []).map((s) => s.category_id)));
  const { data: categories } = categoryIds.length
    ? await supabase.from('categories').select('id,name').in('id', categoryIds)
    : { data: [] as Array<{ id: string; name: string }> };

  const serviceNames = (categories ?? []).map((c) => c.name).filter(Boolean);
  const providerName = profile.full_name ?? 'Service Provider';
  const primaryCategory = serviceNames[0] ?? 'Service Provider';
  const title = serviceNames.length
    ? `${providerName} — ${primaryCategory}`
    : providerName;
  const description = serviceNames.length
    ? `Book ${providerName} on WorkMate Ireland. Services: ${serviceNames.join(', ')}.`
    : `Book ${providerName} on WorkMate Ireland.`;

  return {
    title,
    description,
    openGraph: {
      title: `${providerName} | WorkMate`,
      description,
      images: profile.avatar_url ? [{ url: profile.avatar_url }] : [],
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

export default async function PublicProfilePage({ params }: { params: Params }) {
  const { locale, id } = await params;
  const supabase = getSupabaseServiceClient();

  const [{ data: profile }, { data: jobsCount }, { data: services }, { data: areas }, { data: portfolio }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id,full_name,avatar_url,created_at,is_verified,verification_status,compliance_score,is_founding_pro')
        .eq('id', id)
        .maybeSingle(),
      supabase
        .from('jobs')
        .select('id')
        .eq('customer_id', id),
      supabase.from('pro_services').select('category_id').eq('profile_id', id),
      supabase.from('pro_service_areas').select('county').eq('profile_id', id),
      supabase
        .from('portfolio_items')
        .select('id,title,before_image_url,after_image_url,experience_note,visibility_scope,created_at')
        .eq('provider_id', id)
        .eq('visibility_scope', 'public')
        .order('created_at', { ascending: false })
        .limit(8),
    ]);

  if (!profile) {
    notFound();
  }

  const categoryIds = Array.from(new Set((services ?? []).map((item) => item.category_id)));
  const { data: categories } = categoryIds.length
    ? await supabase.from('categories').select('id,name').in('id', categoryIds)
    : { data: [] as Array<{ id: string; name: string }> };
  const nameById = new Map((categories ?? []).map((item) => [item.id, item.name]));
  const serviceNames = categoryIds.map((idValue) => nameById.get(idValue)).filter(Boolean);
  const areaNames = Array.from(new Set((areas ?? []).map((item) => item.county)));
  const tasksPosted = (jobsCount ?? []).length;

  const { data: reviewRows } = await supabase
    .from('reviews')
    .select('id,rating,comment,quality_rating,communication_rating,punctuality_rating,value_rating,provider_response,provider_responded_at,created_at')
    .eq('pro_id', id)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(20);
  const reviewCount = (reviewRows ?? []).length;
  const avgRating =
    reviewCount > 0
      ? ((reviewRows ?? []).reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1)
      : null;

  const providerName = profile.full_name ?? 'Service Provider';
  const primaryCategory = (serviceNames[0] as string | undefined) ?? 'Service Provider';

  const initials = (profile.full_name ?? 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join('') || 'U';

  const joinedDate = new Date(profile.created_at).toLocaleDateString('en-IE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

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
      ...(areaNames.length ? { addressRegion: areaNames[0] } : {}),
    },
    ...(profile.avatar_url ? { image: profile.avatar_url } : {}),
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
    <main
      style={{
        background: 'var(--wm-bg)',
        minHeight: '100vh',
        paddingTop: 32,
        paddingBottom: 64,
        fontFamily: 'var(--wm-font-sans)',
        color: 'var(--wm-text)',
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

      <div className="mx-auto" style={{ maxWidth: 960, padding: '0 16px' }}>
        {/* ── Back button ──────────────────────────────────────────── */}
        <div className="mb-6">
          <Button href="/providers" variant="ghost" size="sm">
            &#8592; Back to Providers
          </Button>
        </div>

        {/* ── Profile hero card ────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            background: `linear-gradient(135deg, var(--wm-navy) 0%, rgba(var(--wm-navy-rgb), 0.85) 55%, var(--wm-primary-dark) 100%)`,
            boxShadow: 'var(--wm-shadow-xl), 0 0 0 1px rgba(var(--wm-primary-rgb), 0.15)',
          }}
        >
          {/* Radial glow decorations */}
          <div
            className="pointer-events-none absolute"
            style={{
              right: -80,
              top: -80,
              width: 340,
              height: 340,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(var(--wm-primary-rgb), 0.28) 0%, transparent 68%)',
            }}
          />
          <div className="flex flex-col items-center gap-6 px-8 py-10 md:flex-row md:items-start">
            {/* Avatar */}
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={`${providerName} profile photo`}
                width={112}
                height={112}
                className="h-28 w-28 rounded-full object-cover"
                style={{
                  border: '4px solid rgba(var(--wm-primary-rgb), 0.7)',
                  boxShadow: '0 0 0 6px rgba(var(--wm-primary-rgb), 0.18)',
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                className="grid h-28 w-28 place-items-center rounded-full text-3xl font-bold"
                style={{
                  border: '4px solid rgba(var(--wm-primary-rgb), 0.7)',
                  boxShadow: '0 0 0 6px rgba(var(--wm-primary-rgb), 0.18)',
                  background: 'rgba(var(--wm-primary-rgb), 0.18)',
                  color: 'var(--wm-primary)',
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
            )}

            {/* Name + badges + meta */}
            <div className="relative text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
                <h1
                  className="m-0 text-2xl font-extrabold md:text-3xl"
                  style={{
                    fontFamily: 'var(--wm-font-display)',
                    color: '#fff',
                    letterSpacing: '-0.025em',
                  }}
                >
                  {providerName}
                </h1>
                <ComplianceBadge score={(profile as { compliance_score?: number }).compliance_score ?? 0} />
                {(profile as { is_founding_pro?: boolean }).is_founding_pro ? (
                  <FoundingProBadge size="md" />
                ) : null}
              </div>
              <p className="mt-2 text-sm" style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                Joined {joinedDate}
                {' '}&middot;{' '}
                {profile.is_verified ? 'Verified' : profile.verification_status ?? 'Pending'}
              </p>
              {/* Status badge */}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span
                  className="inline-block rounded-full px-4 py-1.5 text-xs font-bold"
                  style={{
                    background: profile.is_verified
                      ? 'rgba(var(--wm-primary-rgb), 0.22)'
                      : 'rgba(var(--wm-destructive-rgb), 0.18)',
                    color: profile.is_verified ? 'var(--wm-primary-dark)' : '#fca5a5',
                    border: `1px solid ${profile.is_verified ? 'rgba(var(--wm-primary-rgb), 0.45)' : 'rgba(var(--wm-destructive-rgb), 0.35)'}`,
                  }}
                >
                  {profile.is_verified ? 'Verified Provider' : 'Pending Verification'}
                </span>
                <QuoteRequestButton providerId={id} locale={locale} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Document-based trust badges ──────────────────────────── */}
        <ProviderBadges providerId={id} />

        {/* ── Quick stats ──────────────────────────────────────────── */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'Tasks Posted', value: String(tasksPosted) },
            { label: 'Services', value: serviceNames.length ? serviceNames.join(', ') : '-' },
            { label: 'Service Areas', value: areaNames.length ? areaNames.join(', ') : '-' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl p-5 transition-shadow hover:shadow-md"
              style={{
                background: 'var(--wm-surface)',
                border: '1px solid var(--wm-border)',
                boxShadow: 'var(--wm-shadow-sm)',
              }}
            >
              <p
                className="mb-2 text-xs font-bold uppercase"
                style={{ color: 'var(--wm-muted)', letterSpacing: '0.07em' }}
              >
                {stat.label}
              </p>
              <p
                className="text-lg font-bold"
                style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Reviews ──────────────────────────────────────────────── */}
        <section
          className="mt-6 rounded-2xl p-6"
          style={{
            background: 'var(--wm-surface)',
            border: '1px solid var(--wm-border)',
            boxShadow: 'var(--wm-shadow-md)',
          }}
        >
          <div className="mb-5 flex items-center justify-between">
            <h2
              className="m-0 text-base font-bold"
              style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
            >
              Customer Reviews
            </h2>
            {avgRating && reviewCount > 0 ? (
              <span className="text-sm" style={{ color: 'var(--wm-muted)' }}>
                {avgRating} avg &middot; {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
              </span>
            ) : null}
          </div>
          <div className="h-px w-full" style={{ background: 'var(--wm-border)', marginBottom: 20 }} />
          {reviewCount === 0 ? (
            <p className="text-sm" style={{ color: 'var(--wm-muted)' }}>
              No public reviews yet.
            </p>
          ) : (
            <div className="grid gap-4">
              {(reviewRows ?? []).map((review) => (
                <div
                  key={review.id}
                  className="rounded-xl p-4"
                  style={{ border: '1px solid var(--wm-border)', background: 'var(--wm-bg)' }}
                >
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

                  {review.comment ? (
                    <p className="mt-2 text-sm" style={{ color: 'var(--wm-text)' }}>{review.comment}</p>
                  ) : null}

                  {(review.quality_rating || review.communication_rating || review.punctuality_rating || review.value_rating) ? (
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--wm-muted)' }}>
                      {review.quality_rating ? <span>Quality: {review.quality_rating}/5</span> : null}
                      {review.communication_rating ? <span>Communication: {review.communication_rating}/5</span> : null}
                      {review.punctuality_rating ? <span>Punctuality: {review.punctuality_rating}/5</span> : null}
                      {review.value_rating ? <span>Value: {review.value_rating}/5</span> : null}
                    </div>
                  ) : null}

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
        </section>

        {/* ── Public Portfolio (before/after) ──────────────────────── */}
        <section
          className="mt-6 rounded-2xl p-6"
          style={{
            background: 'var(--wm-surface)',
            border: '1px solid var(--wm-border)',
            boxShadow: 'var(--wm-shadow-md)',
          }}
        >
          <h2
            className="mb-5 text-base font-bold"
            style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
          >
            Portfolio
          </h2>
          <div className="h-px w-full" style={{ background: 'var(--wm-border)', marginBottom: 20 }} />
          {(portfolio ?? []).length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--wm-muted)' }}>
              No public work samples yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {(portfolio ?? []).map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-xl"
                  style={{
                    border: '1px solid var(--wm-border)',
                    background: 'var(--wm-bg)',
                  }}
                >
                  <div className="grid grid-cols-2 gap-0.5">
                    <div className="relative aspect-square">
                      {item.before_image_url ? (
                        <Image src={item.before_image_url} alt="Before" fill className="object-cover" sizes="(max-width: 768px) 50vw, 300px" />
                      ) : (
                        <div className="h-full w-full" style={{ background: 'var(--wm-surface-alt)' }} />
                      )}
                      <span
                        className="absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
                        style={{ background: 'rgba(15,23,42,0.7)', color: '#fff' }}
                      >
                        Before
                      </span>
                    </div>
                    <div className="relative aspect-square">
                      {item.after_image_url ? (
                        <Image src={item.after_image_url} alt="After" fill className="object-cover" sizes="(max-width: 768px) 50vw, 300px" />
                      ) : (
                        <div className="h-full w-full" style={{ background: 'var(--wm-surface-alt)' }} />
                      )}
                      <span
                        className="absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
                        style={{ background: 'rgba(var(--wm-primary-rgb), 0.8)', color: '#fff' }}
                      >
                        After
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold" style={{ color: 'var(--wm-text)' }}>
                      {item.title || 'Work sample'}
                    </p>
                    {item.experience_note ? (
                      <p className="mt-1 text-xs" style={{ color: 'var(--wm-muted)' }}>
                        {item.experience_note}
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ── Work Gallery ─────────────────────────────────────────── */}
        <section
          className="mt-6 rounded-2xl p-6"
          style={{
            background: 'var(--wm-surface)',
            border: '1px solid var(--wm-border)',
            boxShadow: 'var(--wm-shadow-md)',
          }}
        >
          <h2
            className="mb-5 text-base font-bold"
            style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
          >
            Work Gallery
          </h2>
          <div className="h-px w-full" style={{ background: 'var(--wm-border)', marginBottom: 20 }} />
          <PortfolioGallery providerId={id} />
        </section>
      </div>
    </main>
  );
}
