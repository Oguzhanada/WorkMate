import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { getUserRoles, canQuote } from '@/lib/auth/rbac';
import { updateAvailabilitySchema } from '@/lib/validation/api';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiValidationError, apiUnauthorized, apiForbidden } from '@/lib/api/error-response';

// GET /api/profile/availability — returns current provider's full weekly schedule
export async function GET() {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  const roles = await getUserRoles(supabase, user.id);
  if (!canQuote(roles)) {
    return apiForbidden('Forbidden: verified_pro role required');
  }

  const service = getSupabaseServiceClient();
  const { data, error } = await service
    .from('provider_availability')
    .select('id, day_of_week, start_time, end_time, is_available')
    .eq('provider_id', user.id)
    .order('day_of_week', { ascending: true });

  if (error) {
    return apiError(error.message, 400);
  }

  return NextResponse.json({ availability: data ?? [] }, { status: 200 });
}

// PUT /api/profile/availability — replaces entire weekly schedule for current user
async function putHandler(request: NextRequest) {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  const roles = await getUserRoles(supabase, user.id);
  if (!canQuote(roles)) {
    return apiForbidden('Forbidden: verified_pro role required');
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = updateAvailabilitySchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues);
  }

  // Validate end_time > start_time for each day
  for (const day of parsed.data) {
    if (day.start_time >= day.end_time) {
      return apiError(`end_time must be after start_time for day_of_week ${day.day_of_week}`, 400);
    }
  }

  const service = getSupabaseServiceClient();

  // Upsert all days in a single call — UNIQUE(provider_id, day_of_week) ensures correct merge
  const rows = parsed.data.map((day) => ({
    provider_id:  user.id,
    day_of_week:  day.day_of_week,
    start_time:   day.start_time,
    end_time:     day.end_time,
    is_available: day.is_available,
  }));

  const { data, error } = await service
    .from('provider_availability')
    .upsert(rows, { onConflict: 'provider_id,day_of_week' })
    .select('id, day_of_week, start_time, end_time, is_available')
    .order('day_of_week', { ascending: true });

  if (error) {
    return apiError(error.message, 400);
  }

  return NextResponse.json({ availability: data }, { status: 200 });
}

export const PUT = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, putHandler);
