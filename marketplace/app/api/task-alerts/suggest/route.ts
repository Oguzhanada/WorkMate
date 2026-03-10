import { NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';

export type TaskAlertSuggestion = {
  categories: { id: string; name: string }[];
  counties: string[];
};

type TaskAlertRecord = {
  id: string;
  keywords: string[];
  categories: string[];
  counties: string[];
  budget_min: number | null;
  enabled: boolean;
};

async function getCurrentUserId() {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function getVerifiedPro(service: ReturnType<typeof getSupabaseServiceClient>, userId: string) {
  const { data } = await service
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .in('role', ['verified_pro', 'admin'])
    .limit(1)
    .maybeSingle();
  return data !== null;
}

async function getExistingAlert(service: ReturnType<typeof getSupabaseServiceClient>, userId: string) {
  const { data } = await service
    .from('task_alerts')
    .select('id, keywords, categories, counties, budget_min, enabled')
    .eq('provider_id', userId)
    .maybeSingle<TaskAlertRecord>();

  return data ?? null;
}

async function buildSuggestion(service: ReturnType<typeof getSupabaseServiceClient>, userId: string) {
  const [{ data: services, error: servicesError }, { data: areas, error: areasError }] = await Promise.all([
    service
      .from('pro_services')
      .select('category_id, categories(id, name)')
      .eq('profile_id', userId),
    service
      .from('pro_service_areas')
      .select('county')
      .eq('profile_id', userId),
  ]);

  if (servicesError || areasError) {
    return null;
  }

  if (!services?.length && !areas?.length) {
    return null;
  }

  const categoriesById = new Map<string, { id: string; name: string }>();
  for (const serviceItem of services ?? []) {
    const rawCategory = serviceItem.categories as
      | { id: string; name: string }
      | Array<{ id: string; name: string }>
      | null;
    const category = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory;
    if (category?.id) {
      categoriesById.set(category.id, { id: category.id, name: category.name });
    }
  }

  const counties = Array.from(
    new Set((areas ?? []).map((area) => (area.county ?? '').trim()).filter(Boolean))
  );

  return {
    categories: Array.from(categoriesById.values()),
    counties,
  } satisfies TaskAlertSuggestion;
}

// GET — return suggested task alert settings derived from pro_services + pro_service_areas.
// Returns { suggestion: null } if the provider already has an alert or has no services set up.
export async function GET() {
  const service = getSupabaseServiceClient();
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await getExistingAlert(service, userId);
  if (existing) {
    return NextResponse.json({ suggestion: null });
  }

  const suggestion = await buildSuggestion(service, userId);
  return NextResponse.json({ suggestion });
}

// POST — create task_alerts automatically from pro_services + pro_service_areas.
async function postHandler() {
  const service = getSupabaseServiceClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isPro = await getVerifiedPro(service, userId);
  if (!isPro) {
    return NextResponse.json({ error: 'Only verified providers can create suggested alerts.' }, { status: 403 });
  }

  const existing = await getExistingAlert(service, userId);
  if (existing) {
    return NextResponse.json({ created: false, reason: 'already_exists', alert: existing }, { status: 200 });
  }

  const suggestion = await buildSuggestion(service, userId);
  if (!suggestion) {
    return NextResponse.json(
      { error: 'No suggested alert could be generated. Add services or service areas first.' },
      { status: 400 }
    );
  }

  const categoryIds = suggestion.categories.map((category) => category.id);
  const counties = suggestion.counties;

  const { data: alert, error } = await service
    .from('task_alerts')
    .upsert(
      {
        provider_id: userId,
        keywords: [],
        categories: categoryIds,
        counties,
        task_types: ['in_person', 'remote', 'flexible'],
        urgency_levels: [],
        budget_min: null,
        enabled: true,
      },
      { onConflict: 'provider_id' }
    )
    .select('id, keywords, categories, counties, budget_min, enabled')
    .single<TaskAlertRecord>();

  if (error || !alert) {
    return NextResponse.json({ error: 'Failed to create suggested alert.' }, { status: 500 });
  }

  return NextResponse.json({ created: true, alert, suggestion }, { status: 200 });
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
