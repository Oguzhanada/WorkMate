import {NextResponse} from 'next/server';

import {getSupabaseRouteClient} from '@/lib/supabase/route';

type ProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  verification_status: string | null;
  id_verification_status: string | null;
  is_verified: boolean | null;
  created_at: string;
};

type ReviewRow = {
  pro_id: string;
  rating: number;
};

type AddressRow = {
  profile_id: string;
  county: string | null;
  created_at: string;
};

function rankProviders(
  providers: Array<ProfileRow & {county: string | null}>,
  scores: Map<string, {rating: number; reviewCount: number}>
) {
  const buckets = new Map<string, Array<ProfileRow & {county: string | null; score: number; rating: number; reviewCount: number}>>();

  for (const provider of providers) {
    const stats = scores.get(provider.id) ?? {rating: 4.8, reviewCount: 0};
    const score = stats.rating * 100 + Math.min(stats.reviewCount, 120) + (provider.avatar_url ? 18 : 0);
    const county = provider.county?.trim() || 'Unknown';
    const list = buckets.get(county) ?? [];
    list.push({...provider, score, rating: stats.rating, reviewCount: stats.reviewCount});
    buckets.set(county, list);
  }

  for (const [county, list] of buckets.entries()) {
    list.sort((a, b) => b.score - a.score);
    buckets.set(county, list);
  }

  const countyOrder = [...buckets.keys()].sort(
    (left, right) => (buckets.get(right)?.[0]?.score ?? 0) - (buckets.get(left)?.[0]?.score ?? 0)
  );

  const balanced: Array<ProfileRow & {county: string | null; score: number; rating: number; reviewCount: number}> = [];
  let remaining = true;

  while (remaining && balanced.length < 12) {
    remaining = false;
    for (const county of countyOrder) {
      const list = buckets.get(county) ?? [];
      if (list.length === 0) continue;
      remaining = true;
      const next = list.shift();
      if (next) balanced.push(next);
      buckets.set(county, list);
      if (balanced.length >= 12) break;
    }
  }

  return balanced
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => ({
      id: item.id,
      full_name: item.full_name ?? 'Provider',
      profession: 'Verified Professional',
      county: item.county ?? 'Ireland',
      avatar_url: item.avatar_url,
      rating: Number(item.rating.toFixed(1)),
      review_count: item.reviewCount,
      verified: true
    }));
}

export async function GET() {
  const supabase = await getSupabaseRouteClient();

  const {data: roleRows} = await supabase.from('user_roles').select('user_id').eq('role', 'verified_pro').limit(200);
  const roleIds = (roleRows ?? []).map((item) => item.user_id as string);

  const profilesQuery = supabase
    .from('profiles')
    .select('id,full_name,avatar_url,verification_status,id_verification_status,is_verified,created_at')
    .order('created_at', {ascending: false})
    .limit(120);

  const {data: profileRows, error: profilesError} = roleIds.length
    ? await profilesQuery.in('id', roleIds)
    : await profilesQuery;

  if (profilesError) {
    return NextResponse.json({error: profilesError.message, providers: []}, {status: 400});
  }

  const providers = (profileRows ?? []) as ProfileRow[];
  if (providers.length === 0) {
    return NextResponse.json({providers: []}, {status: 200});
  }

  const providerIds = providers.map((item) => item.id);
  const verifiedProviders = providers.filter(
    (item) =>
      item.is_verified === true ||
      item.id_verification_status === 'approved' ||
      item.verification_status === 'verified'
  );
  const verifiedIds = verifiedProviders.map((item) => item.id);
  if (verifiedIds.length === 0) {
    return NextResponse.json({providers: []}, {status: 200});
  }

  const {data: addressRows} = await supabase
    .from('addresses')
    .select('profile_id,county,created_at')
    .in('profile_id', verifiedIds)
    .order('created_at', {ascending: false})
    .limit(500);

  const countyByProfile = new Map<string, string | null>();
  for (const row of (addressRows ?? []) as AddressRow[]) {
    if (!countyByProfile.has(row.profile_id)) {
      countyByProfile.set(row.profile_id, row.county ?? null);
    }
  }

  const rankedInput = verifiedProviders.map((item) => ({
    ...item,
    county: countyByProfile.get(item.id) ?? null,
  }));

  const {data: reviewRows} = await supabase
    .from('reviews')
    .select('pro_id,rating')
    .in('pro_id', verifiedIds)
    .limit(1000);

  const scoreMap = new Map<string, {rating: number; reviewCount: number}>();
  for (const row of (reviewRows ?? []) as ReviewRow[]) {
    const current = scoreMap.get(row.pro_id) ?? {rating: 0, reviewCount: 0};
    const nextCount = current.reviewCount + 1;
    const nextRating = (current.rating * current.reviewCount + row.rating) / nextCount;
    scoreMap.set(row.pro_id, {rating: nextRating, reviewCount: nextCount});
  }

  const ranked = rankProviders(rankedInput, scoreMap);

  return NextResponse.json({providers: ranked}, {status: 200});
}
