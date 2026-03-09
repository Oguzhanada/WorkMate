import type { Metadata } from 'next';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Shell from '@/components/ui/Shell';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import ComplianceBadge from '@/components/ui/ComplianceBadge';
import GardaVettingBadge from '@/components/ui/GardaVettingBadge';
import FavouriteButton from '@/components/providers/FavouriteButton';
import SearchFilters from '@/components/providers/SearchFilters';
import ActiveFilterChips from './ActiveFilterChips';
import SaveSearchPanel from '@/components/providers/SaveSearchPanel';

// Server-side: reads URL params, calls the search API internally via Supabase
// (no fetch — we query directly to avoid a round-trip in the same process).
import { providerSearchSchema, IRISH_COUNTIES } from '@/lib/validation/api';

const baseUrl = process.env.NEXT_PUBLIC_PLATFORM_BASE_URL ?? 'https://workmate.ie';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = 'Find Local Service Providers in Ireland | WorkMate';
  const description =
    'Browse verified tradespeople and service providers across Ireland. Book online, read reviews, and get quotes.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'WorkMate',
      url: `${baseUrl}/${locale}/providers`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `${baseUrl}/${locale}/providers`,
    },
  };
}

type SearchParams = { [key: string]: string | string[] | undefined };

// Resolve a single string from a potentially multi-value param.
function sp(v: string | string[] | undefined): string {
  if (!v) return '';
  if (Array.isArray(v)) return v[0] ?? '';
  return v;
}

export default async function ProvidersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<SearchParams>;
}) {
  const [resolvedParams, resolvedSearch] = await Promise.all([params, searchParams]);
  const locale = resolvedParams.locale;

  // Parse & validate search params with the canonical Zod schema.
  const rawParams = {
    q:             sp(resolvedSearch?.q),
    county:        sp(resolvedSearch?.county),
    category_id:   sp(resolvedSearch?.category_id),
    verified_only: sp(resolvedSearch?.verified_only),
    garda_vetted:  sp(resolvedSearch?.garda_vetted),
    sort:          sp(resolvedSearch?.sort),
    page:          sp(resolvedSearch?.page) || '1',
    limit:         '12',
  };

  const parsed = providerSearchSchema.safeParse(rawParams);
  const filters = parsed.success ? parsed.data : {
    q: '', county: 'Any' as typeof IRISH_COUNTIES[number], category_id: undefined,
    verified_only: 'true' as const, garda_vetted: 'false' as const,
    sort: 'relevance' as const, page: 1, limit: 12,
  };

  const { q, county, category_id, verified_only, garda_vetted, sort } = filters;
  const page  = filters.page  ?? 1;
  const limit = filters.limit ?? 12;
  const offset = (page - 1) * limit;
  const supabase = getSupabaseServiceClient();

  // Auth client for personalised favourite state.
  const authClient = await getSupabaseServerClient();
  const { data: { user: currentUser } } = await authClient.auth.getUser();

  // ── Sub-query: category filter → provider IDs ──────────────────────────────
  let categoryFilterIds: string[] | null = null;
  if (category_id) {
    const { data: svcRows } = await supabase
      .from('pro_services')
      .select('profile_id')
      .eq('category_id', category_id);
    categoryFilterIds = (svcRows ?? []).map((r) => r.profile_id as string);
    if (categoryFilterIds.length === 0) {
      categoryFilterIds = ['__no_match__'];
    }
  }

  // ── Sub-query: county filter → provider IDs ────────────────────────────────
  let countyFilterIds: string[] | null = null;
  if (county && county !== 'Any') {
    const { data: areaRows } = await supabase
      .from('pro_service_areas')
      .select('profile_id')
      .eq('county', county);
    countyFilterIds = (areaRows ?? []).map((r) => r.profile_id as string);
    if (countyFilterIds.length === 0) {
      countyFilterIds = ['__no_match__'];
    }
  }

  // ── Intersect ID sets ──────────────────────────────────────────────────────
  let filteredIds: string[] | null = null;
  const idSets = [categoryFilterIds, countyFilterIds].filter((s): s is string[] => s !== null);
  if (idSets.length > 0) {
    filteredIds = idSets.reduce((acc, set) => {
      const setOf = new Set(set);
      return acc.filter((id) => setOf.has(id));
    });
  }

  // ── Main profiles query ────────────────────────────────────────────────────
  // Safe public columns only — no email, phone, stripe data, etc.
  type SortOrder = { column: string; ascending: boolean };

  const needsPostSort = sort === 'rating';
  const sortMap: Record<string, SortOrder> = {
    newest:    { column: 'created_at',       ascending: false },
    rate_asc:  { column: 'compliance_score', ascending: true  },
    rate_desc: { column: 'compliance_score', ascending: false },
    relevance: { column: 'compliance_score', ascending: false },
  };
  const sortOrder = sortMap[sort] ?? sortMap.relevance;

  let profileQuery = supabase
    .from('profiles')
    .select(
      'id,full_name,avatar_url,verification_status,id_verification_status,garda_vetting_status,compliance_score,is_verified,created_at',
      { count: 'exact' },
    )
    .eq('is_verified', true);

  if (verified_only === 'true') {
    profileQuery = profileQuery.eq('id_verification_status', 'approved');
  }
  if (garda_vetted === 'true') {
    profileQuery = profileQuery.eq('garda_vetting_status', 'approved');
  }
  if (filteredIds !== null) {
    profileQuery = profileQuery.in('id', filteredIds.length ? filteredIds : ['__no_match__']);
  }
  if (q) {
    profileQuery = profileQuery.ilike('full_name', `%${q}%`);
  }

  if (!needsPostSort) {
    profileQuery = profileQuery
      .order(sortOrder.column, { ascending: sortOrder.ascending })
      .range(offset, offset + limit - 1);
  } else {
    profileQuery = profileQuery.limit(500);
  }

  const { data: profileRows, error: profilesError, count: rawCount } = await profileQuery;
  const profiles = profileRows ?? [];
  const returnedIds = profiles.map((p) => p.id as string);

  // ── Fetch associated data ──────────────────────────────────────────────────
  const [
    { data: servicesData },
    { data: areasData },
    { data: categoriesData },
    { data: reviewsData },
    { data: favouritesData },
    { data: sameDaySlots },
  ] = await Promise.all([
    returnedIds.length
      ? supabase.from('pro_services').select('profile_id,category_id').in('profile_id', returnedIds)
      : Promise.resolve({ data: [] }),
    returnedIds.length
      ? supabase.from('pro_service_areas').select('profile_id,county').in('profile_id', returnedIds)
      : Promise.resolve({ data: [] }),
    supabase.from('categories').select('id,name'),
    returnedIds.length
      ? supabase.from('reviews').select('pro_id,rating').in('pro_id', returnedIds)
      : Promise.resolve({ data: [] }),
    currentUser
      ? supabase.from('favourite_providers').select('provider_id').eq('customer_id', currentUser.id)
      : Promise.resolve({ data: [] }),
    (() => {
      if (!returnedIds.length) return Promise.resolve({ data: [] });
      const todayDate = new Date().toISOString().slice(0, 10);
      const todayDow = new Date().getDay();
      return supabase
        .from('provider_availability')
        .select('provider_id')
        .in('provider_id', returnedIds)
        .or(`and(is_recurring.eq.true,day_of_week.eq.${todayDow}),and(is_recurring.eq.false,specific_date.eq.${todayDate})`);
    })(),
  ]);

  const categories = (categoriesData ?? []) as { id: string; name: string }[];
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));
  const savedProviderIds = new Set((favouritesData ?? []).map((f) => (f as { provider_id: string }).provider_id));
  const sameDayProviderIds = new Set((sameDaySlots ?? []).map((r) => (r as { provider_id: string }).provider_id));

  const servicesByProvider = new Map<string, string[]>();
  for (const row of (servicesData ?? []) as { profile_id: string; category_id: string }[]) {
    const list = servicesByProvider.get(row.profile_id) ?? [];
    const name = categoryNameById.get(row.category_id);
    if (name && !list.includes(name)) list.push(name);
    servicesByProvider.set(row.profile_id, list);
  }

  const areasByProvider = new Map<string, string[]>();
  for (const row of (areasData ?? []) as { profile_id: string; county: string }[]) {
    const list = areasByProvider.get(row.profile_id) ?? [];
    if (!list.includes(row.county)) list.push(row.county);
    areasByProvider.set(row.profile_id, list);
  }

  const reviewStats = new Map<string, { total: number; count: number }>();
  for (const row of (reviewsData ?? []) as { pro_id: string; rating: number }[]) {
    const current = reviewStats.get(row.pro_id) ?? { total: 0, count: 0 };
    reviewStats.set(row.pro_id, { total: current.total + row.rating, count: current.count + 1 });
  }

  // ── Post-sort for rating ───────────────────────────────────────────────────
  type ProfileRow = {
    id: unknown; full_name: unknown; avatar_url: unknown;
    verification_status: unknown; id_verification_status: unknown;
    garda_vetting_status: unknown; compliance_score: unknown;
    is_verified: unknown; created_at: unknown;
  };

  let displayProfiles: ProfileRow[] = profiles as ProfileRow[];
  let totalCount = rawCount ?? profiles.length;

  if (needsPostSort) {
    displayProfiles = [...profiles].sort((a, b) => {
      const sA = reviewStats.get(a.id as string);
      const sB = reviewStats.get(b.id as string);
      const rA = sA ? sA.total / sA.count : 0;
      const rB = sB ? sB.total / sB.count : 0;
      if (rB !== rA) return rB - rA;
      return ((b.compliance_score as number) ?? 0) - ((a.compliance_score as number) ?? 0);
    }) as ProfileRow[];
    totalCount = displayProfiles.length;
    displayProfiles = displayProfiles.slice(offset, offset + limit) as ProfileRow[];
  }

  // ── Pagination helpers ─────────────────────────────────────────────────────
  const totalPages = Math.ceil(totalCount / limit);

  function buildPageUrl(targetPage: number): string {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (county && county !== 'Any') sp.set('county', county);
    if (category_id) sp.set('category_id', category_id);
    if (verified_only === 'false') sp.set('verified_only', 'false');
    if (garda_vetted === 'true') sp.set('garda_vetted', 'true');
    if (sort !== 'relevance') sp.set('sort', sort);
    if (targetPage > 1) sp.set('page', String(targetPage));
    const qs = sp.toString();
    return qs ? `/${locale}/providers?${qs}` : `/${locale}/providers`;
  }

  // ── Active-filter chip metadata (passed to client chip component) ──────────
  type ChipDef = { label: string; removeParam: string };
  const activeChips: ChipDef[] = [];
  if (q) activeChips.push({ label: `"${q}"`, removeParam: 'q' });
  if (county && county !== 'Any') activeChips.push({ label: county, removeParam: 'county' });
  if (category_id) {
    const catName = categoryNameById.get(category_id) ?? category_id;
    activeChips.push({ label: catName, removeParam: 'category_id' });
  }
  if (verified_only === 'false') activeChips.push({ label: 'All verification levels', removeParam: 'verified_only' });
  if (garda_vetted === 'true') activeChips.push({ label: 'Garda vetted', removeParam: 'garda_vetted' });
  if (sort !== 'relevance') {
    const sortLabels: Record<string, string> = { rating: 'Highest rated', newest: 'Newest', rate_asc: 'Rate ↑', rate_desc: 'Rate ↓' };
    activeChips.push({ label: sortLabels[sort] ?? sort, removeParam: 'sort' });
  }

  return (
    <Shell
      header={
        <Card
          className="rounded-[1.6rem]"
          style={{ boxShadow: 'var(--wm-shadow-lg)' }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1
                className="text-3xl font-extrabold"
                style={{ color: 'var(--wm-navy)', letterSpacing: '-0.03em', fontFamily: 'var(--wm-font-display)' }}
              >
                Provider Directory
              </h1>
              <p className="text-sm" style={{ color: 'var(--wm-muted)' }}>
                Explore verified providers, their service categories and coverage areas across Ireland.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button href={`/${locale}/post-job`} variant="navy">
                Create job request
              </Button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <StatCard label="Results" value={totalCount} />
            <StatCard label="Page" value={`${page} / ${totalPages || 1}`} />
            <StatCard label="Verified providers" value={totalCount} />
          </div>
        </Card>
      }
    >
      <section>
        {profilesError ? (
          <div
            className="mb-4 rounded-xl px-3 py-2 text-sm"
            style={{
              border: '1px solid rgba(var(--wm-destructive-rgb, 220,38,38), 0.25)',
              background: 'var(--wm-destructive-light)',
              color: 'var(--wm-destructive)',
            }}
          >
            Providers could not be loaded: {profilesError.message}
          </div>
        ) : null}

        {/* Filter panel — client component */}
        <SearchFilters />

        {/* Active filter chips */}
        {activeChips.length > 0 ? (
          <ActiveFilterChips chips={activeChips} locale={locale} />
        ) : null}

        {/* Result count + Save Search */}
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <p className="text-sm" style={{ color: 'var(--wm-muted)' }}>
            {totalCount === 0
              ? 'No providers match your filters.'
              : `${totalCount} provider${totalCount === 1 ? '' : 's'} found`}
            {totalPages > 1 ? ` — page ${page} of ${totalPages}` : ''}
          </p>
          {currentUser ? (
            <SaveSearchPanel
              currentFilters={{
                ...(q             ? { q }                                    : {}),
                ...(county && county !== 'Any' ? { county }                 : {}),
                ...(category_id   ? { category_id }                         : {}),
                ...(verified_only ? { verified_only }                        : {}),
                ...(garda_vetted  ? { garda_vetted }                         : {}),
              }}
            />
          ) : null}
        </div>

        {/* Provider grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {displayProfiles.map((provider) => {
            const stats = reviewStats.get(provider.id as string);
            const avgRating = stats ? (stats.total / stats.count).toFixed(1) : null;
            const isGardaVetted = (provider.garda_vetting_status as string | null) === 'approved';
            const isIdVerified  = (provider.id_verification_status as string | null) === 'approved';

            return (
              <Card
                key={provider.id as string}
                className="flex flex-col justify-between transition-shadow hover:shadow-[var(--wm-shadow-xl)]"
              >
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3
                      className="text-[1.45rem] font-extrabold"
                      style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)', letterSpacing: '-0.02em' }}
                    >
                      {(provider.full_name as string | null) ?? 'Provider'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <ComplianceBadge score={provider.compliance_score as number} />
                      {isIdVerified  ? <Badge tone="completed">ID Verified</Badge> : null}
                      {isGardaVetted ? <GardaVettingBadge status="approved" /> : null}
                      {sameDayProviderIds.has(provider.id as string) ? (
                        <Badge tone="open">Same-Day</Badge>
                      ) : null}
                      {currentUser ? (
                        <FavouriteButton
                          providerId={provider.id as string}
                          initialSaved={savedProviderIds.has(provider.id as string)}
                        />
                      ) : null}
                    </div>
                  </div>

                  {avgRating ? (
                    <p className="mt-1 flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--wm-amber-dark)' }}>
                      ★ {avgRating}
                      <span className="text-xs font-normal" style={{ color: 'var(--wm-muted)' }}>
                        ({stats!.count} review{stats!.count !== 1 ? 's' : ''})
                      </span>
                    </p>
                  ) : null}

                  <p className="mt-2 text-sm" style={{ color: 'var(--wm-muted)' }}>
                    <span className="font-medium" style={{ color: 'var(--wm-text)' }}>Services:</span>{' '}
                    {(servicesByProvider.get(provider.id as string) ?? []).join(', ') || 'Not set up'}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: 'var(--wm-muted)' }}>
                    <span className="font-medium" style={{ color: 'var(--wm-text)' }}>Areas:</span>{' '}
                    {(areasByProvider.get(provider.id as string) ?? []).join(', ') || 'Not set up'}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--wm-subtle)' }}>
                    Joined {new Date(provider.created_at as string).toLocaleDateString('en-IE')}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button
                    href={`/${locale}/post-job?mode=direct_request&provider_id=${provider.id as string}`}
                    variant="navy"
                    size="sm"
                  >
                    Direct Request
                  </Button>
                  <Button href={`/${locale}/profile/public/${provider.id as string}`} variant="secondary" size="sm">
                    View profile
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {displayProfiles.length === 0 ? (
          <Card className="mt-4">
            <EmptyState
              title="No providers match your filters"
              description="Try adjusting your search or filters to find more providers."
              action={
                <Button href={`/${locale}/providers`} variant="primary">
                  Clear all filters
                </Button>
              }
            />
          </Card>
        ) : null}

        {/* Pagination */}
        {totalPages > 1 ? (
          <div className="mt-8 flex items-center justify-center gap-3">
            {page > 1 ? (
              <Button href={buildPageUrl(page - 1)} variant="secondary" size="sm">
                ← Previous
              </Button>
            ) : null}
            <span className="text-sm" style={{ color: 'var(--wm-muted)' }}>
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Button href={buildPageUrl(page + 1)} variant="secondary" size="sm">
                Next →
              </Button>
            ) : null}
          </div>
        ) : null}
      </section>
    </Shell>
  );
}
