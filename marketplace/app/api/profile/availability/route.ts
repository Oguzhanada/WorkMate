import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { getUserRoles, canQuote } from '@/lib/auth/rbac';
import { updateAvailabilitySchema } from '@/lib/validation/api';

// GET /api/profile/availability — returns current provider's full weekly schedule
export async function GET() {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = await getUserRoles(supabase, user.id);
  if (!canQuote(roles)) {
    return NextResponse.json({ error: 'Forbidden: verified_pro role required' }, { status: 403 });
  }

  const service = getSupabaseServiceClient();
  const { data, error } = await service
    .from('provider_availability')
    .select('id, day_of_week, start_time, end_time, is_available')
    .eq('provider_id', user.id)
    .order('day_of_week', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ availability: data ?? [] }, { status: 200 });
}

// PUT /api/profile/availability — replaces entire weekly schedule for current user
export async function PUT(request: NextRequest) {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = await getUserRoles(supabase, user.id);
  if (!canQuote(roles)) {
    return NextResponse.json({ error: 'Forbidden: verified_pro role required' }, { status: 403 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = updateAvailabilitySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Validate end_time > start_time for each day
  for (const day of parsed.data) {
    if (day.start_time >= day.end_time) {
      return NextResponse.json(
        { error: `end_time must be after start_time for day_of_week ${day.day_of_week}` },
        { status: 400 }
      );
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
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ availability: data }, { status: 200 });
}
