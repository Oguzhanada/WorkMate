import { NextRequest, NextResponse } from 'next/server';
import { authenticatePublicRequest } from '@/lib/api/public-auth';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { apiServerError } from '@/lib/api/error-response';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  const auth = await authenticatePublicRequest(request);
  if (auth.error) return auth.error;

  const svc = getSupabaseServiceClient();
  const search = request.nextUrl.searchParams;
  const limit = Math.min(Math.max(Number(search.get('limit') ?? DEFAULT_LIMIT), 1), MAX_LIMIT);
  const offset = Math.max(Number(search.get('offset') ?? 0), 0);
  const county = search.get('county');
  const categoryId = search.get('category_id');
  const q = search.get('q');

  // Fetch admin user IDs upfront so they can be excluded from the public provider list.
  const { data: adminRoleRows } = await svc
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin');
  const adminIds = (adminRoleRows ?? []).map((row) => row.user_id as string);

  let filteredIds: string[] | null = null;

  if (categoryId) {
    const { data: serviceRows, error } = await svc
      .from('pro_services')
      .select('profile_id')
      .eq('category_id', categoryId);
    if (error) return apiServerError(error.message);
    filteredIds = (serviceRows ?? []).map((row) => row.profile_id);
  }

  if (county) {
    const { data: areaRows, error } = await svc
      .from('pro_service_areas')
      .select('profile_id')
      .eq('county', county);
    if (error) return apiServerError(error.message);
    const areaIds = new Set((areaRows ?? []).map((row) => row.profile_id));
    filteredIds =
      filteredIds === null ? Array.from(areaIds) : filteredIds.filter((id) => areaIds.has(id));
  }

  let providersQuery = svc
    .from('profiles')
    .select('id,full_name,avatar_url,verification_status,created_at')
    .eq('verification_status', 'verified')
    .eq('is_verified', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (q) providersQuery = providersQuery.ilike('full_name', `%${q}%`);
  // Exclude admin-role users from the public provider directory.
  if (adminIds.length) {
    // PostgREST requires UUID values to be double-quoted inside the parentheses.
    providersQuery = providersQuery.not('id', 'in', `(${adminIds.map((id) => `"${id}"`).join(',')})`);
  }
  if (filteredIds !== null) {
    if (filteredIds.length === 0) return NextResponse.json({ providers: [] }, { status: 200 });
    providersQuery = providersQuery.in('id', filteredIds);
  }

  const { data: providers, error: providersError } = await providersQuery;
  if (providersError) {
    return apiServerError(providersError.message);
  }

  const providerIds = (providers ?? []).map((item) => item.id);
  if (providerIds.length === 0) return NextResponse.json({ providers: [] }, { status: 200 });

  const [{ data: services }, { data: areas }, { data: categories }] = await Promise.all([
    svc.from('pro_services').select('profile_id,category_id').in('profile_id', providerIds),
    svc.from('pro_service_areas').select('profile_id,county').in('profile_id', providerIds),
    svc.from('categories').select('id,name'),
  ]);

  const categoryMap = new Map((categories ?? []).map((item) => [item.id, item.name]));
  const serviceByProvider = new Map<string, string[]>();
  const areaByProvider = new Map<string, string[]>();

  for (const row of services ?? []) {
    const serviceName = categoryMap.get(row.category_id);
    if (!serviceName) continue;
    const list = serviceByProvider.get(row.profile_id) ?? [];
    if (!list.includes(serviceName)) list.push(serviceName);
    serviceByProvider.set(row.profile_id, list);
  }

  for (const row of areas ?? []) {
    const list = areaByProvider.get(row.profile_id) ?? [];
    if (!list.includes(row.county)) list.push(row.county);
    areaByProvider.set(row.profile_id, list);
  }

  return NextResponse.json(
    {
      providers: (providers ?? []).map((provider) => ({
        ...provider,
        services: serviceByProvider.get(provider.id) ?? [],
        counties: areaByProvider.get(provider.id) ?? [],
      })),
      pagination: { limit, offset, count: (providers ?? []).length },
    },
    { status: 200 }
  );
}
