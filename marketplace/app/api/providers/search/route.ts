import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { providerSearchSchema } from '@/lib/validation/api';
import { apiError, apiServerError } from '@/lib/api/error-response';

// Public search endpoint — never returns email, phone, or private data.
export async function GET(req: NextRequest) {
  const rawParams: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((value, key) => {
    rawParams[key] = value;
  });

  const parsed = providerSearchSchema.safeParse(rawParams);
  if (!parsed.success) {
    return apiError('Invalid search parameters', 400);
  }

  const { q, category_id, county, verified_only, sort } = parsed.data;
  const page  = parsed.data.page  ?? 1;
  const limit = parsed.data.limit ?? 12;
  const offset = (page - 1) * limit;

  const supabase = getSupabaseServiceClient();

  // Fetch admin user IDs upfront so they can be excluded from all provider queries.
  const { data: adminRoleRows } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin');
  const adminIds = (adminRoleRows ?? []).map((r) => (r as { user_id: string }).user_id);

  // Step 1: Resolve provider IDs from pro_services if category filter is active.
  let categoryFilterIds: string[] | null = null;
  if (category_id) {
    const { data: svcRows, error: svcErr } = await supabase
      .from('pro_services')
      .select('profile_id')
      .eq('category_id', category_id);
    if (svcErr) {
      return apiServerError('Service lookup failed');
    }
    categoryFilterIds = (svcRows ?? []).map((r) => r.profile_id as string);
    if (categoryFilterIds.length === 0) {
      return NextResponse.json({ providers: [], total: 0, page, limit }, { status: 200 });
    }
  }

  // Step 2: Resolve provider IDs from pro_service_areas if county filter is active.
  let countyFilterIds: string[] | null = null;
  if (county && county !== 'Any') {
    const { data: areaRows, error: areaErr } = await supabase
      .from('pro_service_areas')
      .select('profile_id')
      .eq('county', county);
    if (areaErr) {
      return apiServerError('Area lookup failed');
    }
    countyFilterIds = (areaRows ?? []).map((r) => r.profile_id as string);
    if (countyFilterIds.length === 0) {
      return NextResponse.json({ providers: [], total: 0, page, limit }, { status: 200 });
    }
  }

  // Step 3: Build profiles query.
  // Only safe public fields — never email, phone, stripe_account_id, terms_version, etc.
  let query = supabase
    .from('profiles')
    .select(
      'id,full_name,avatar_url,verification_status,id_verification_status,compliance_score,is_verified,created_at',
      { count: 'exact' },
    )
    .eq('is_verified', true);

  if (verified_only === 'true') {
    query = query.eq('id_verification_status', 'approved');
  }

  // Intersect all ID sets derived from sub-queries.
  const idSets: string[][] = [];
  if (categoryFilterIds !== null) idSets.push(categoryFilterIds);
  if (countyFilterIds !== null) idSets.push(countyFilterIds);

  if (idSets.length > 0) {
    // Intersection: only IDs that appear in all filter sets.
    const intersection = idSets.reduce((acc, set) => {
      const setOf = new Set(set);
      return acc.filter((id) => setOf.has(id));
    });
    if (intersection.length === 0) {
      return NextResponse.json({ providers: [], total: 0, page, limit }, { status: 200 });
    }
    query = query.in('id', intersection);
  }

  // Exclude admin-role users from the public provider directory.
  if (adminIds.length) {
    // PostgREST requires UUID values to be double-quoted inside the parentheses.
    query = query.not('id', 'in', `(${adminIds.map((id) => `"${id}"`).join(',')})`);
  }

  // Full-name text search (simple ilike).
  if (q) {
    query = query.ilike('full_name', `%${q}%`);
  }

  // Sorting — we handle rating sort post-fetch since it requires review aggregation.
  const needsPostSort = sort === 'rating';
  if (!needsPostSort) {
    switch (sort) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      // rate_asc / rate_desc: profiles have no rate column — order by compliance_score as proxy.
      case 'rate_asc':
        query = query.order('compliance_score', { ascending: true });
        break;
      case 'rate_desc':
        query = query.order('compliance_score', { ascending: false });
        break;
      default:
        // relevance: highest compliance_score first.
        query = query.order('compliance_score', { ascending: false });
    }
  } else {
    // For rating sort we fetch all matching (up to 500) then sort + paginate in JS.
    query = query.limit(500);
  }

  if (!needsPostSort) {
    query = query.range(offset, offset + limit - 1);
  }

  const { data: profileRows, error: profilesErr, count } = await query;
  if (profilesErr) {
    return apiServerError('Provider search failed');
  }

  const profiles = profileRows ?? [];

  // Step 4: Fetch service areas and categories for all returned providers.
  const returnedIds = profiles.map((p) => p.id as string);

  const [{ data: areasData }, { data: servicesData }, { data: reviewsData }] = await Promise.all([
    returnedIds.length
      ? supabase.from('pro_service_areas').select('profile_id,county').in('profile_id', returnedIds)
      : Promise.resolve({ data: [] }),
    returnedIds.length
      ? supabase
          .from('pro_services')
          .select('profile_id,categories(id,name)')
          .in('profile_id', returnedIds)
      : Promise.resolve({ data: [] }),
    returnedIds.length
      ? supabase
          .from('reviews')
          .select('pro_id,rating')
          .in('pro_id', returnedIds)
      : Promise.resolve({ data: [] }),
  ]);

  // Aggregate review stats.
  const reviewStats = new Map<string, { total: number; count: number }>();
  for (const row of (reviewsData ?? []) as { pro_id: string; rating: number }[]) {
    const current = reviewStats.get(row.pro_id) ?? { total: 0, count: 0 };
    reviewStats.set(row.pro_id, { total: current.total + row.rating, count: current.count + 1 });
  }

  // Build county map.
  const areasByProvider = new Map<string, string[]>();
  for (const row of (areasData ?? []) as { profile_id: string; county: string }[]) {
    const list = areasByProvider.get(row.profile_id) ?? [];
    if (!list.includes(row.county)) list.push(row.county);
    areasByProvider.set(row.profile_id, list);
  }

  // Build service categories map — join result returns nested object.
  const categoriesByProvider = new Map<string, string[]>();
  for (const row of (servicesData ?? []) as { profile_id: string; categories: { id: string; name: string } | null }[]) {
    const list = categoriesByProvider.get(row.profile_id) ?? [];
    const name = row.categories?.name;
    if (name && !list.includes(name)) list.push(name);
    categoriesByProvider.set(row.profile_id, list);
  }

  // Build result objects — only public fields.
  type ProviderResult = {
    id: string;
    full_name: string;
    avatar_url: string | null;
    counties: string[];
    service_categories: string[];
    verified: boolean;
    id_verified: boolean;
    compliance_score: number;
    average_rating: number | null;
    review_count: number;
    created_at: string;
  };

  let results: ProviderResult[] = profiles.map((p) => {
    const stats = reviewStats.get(p.id as string);
    const average_rating = stats ? parseFloat((stats.total / stats.count).toFixed(1)) : null;
    return {
      id: p.id as string,
      full_name: (p.full_name as string | null) ?? 'Provider',
      avatar_url: (p.avatar_url as string | null) ?? null,
      counties: areasByProvider.get(p.id as string) ?? [],
      service_categories: categoriesByProvider.get(p.id as string) ?? [],
      verified: (p.is_verified as boolean) === true,
      id_verified: (p.id_verification_status as string | null) === 'approved',
      compliance_score: (p.compliance_score as number) ?? 0,
      average_rating,
      review_count: stats?.count ?? 0,
      created_at: p.created_at as string,
    };
  });

  // Post-sort for rating.
  let total = count ?? results.length;
  if (needsPostSort) {
    results.sort((a, b) => {
      const rA = a.average_rating ?? 0;
      const rB = b.average_rating ?? 0;
      if (rB !== rA) return rB - rA;
      return b.compliance_score - a.compliance_score;
    });
    total = results.length;
    results = results.slice(offset, offset + limit);
  }

  return NextResponse.json({ providers: results, total, page, limit }, { status: 200 });
}
