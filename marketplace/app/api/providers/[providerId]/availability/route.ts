import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { canAccessAdmin, getUserRoles } from '@/lib/auth/rbac';
import { createProviderAvailabilitySchema } from '@/lib/validation/api';

function dublinTodayIsoDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Dublin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  const { providerId } = await params;
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = await getUserRoles(supabase, user.id);
  const isAdmin = canAccessAdmin(roles);
  const isOwner = user.id === providerId;

  let query = supabase
    .from('provider_availability')
    .select('id,provider_id,day_of_week,start_time,end_time,is_recurring,specific_date,created_at')
    .eq('provider_id', providerId)
    .order('is_recurring', { ascending: false })
    .order('day_of_week', { ascending: true, nullsFirst: false })
    .order('specific_date', { ascending: true, nullsFirst: false })
    .order('start_time', { ascending: true });

  if (!isOwner && !isAdmin) {
    query = query.or(`is_recurring.eq.true,and(is_recurring.eq.false,specific_date.gte.${dublinTodayIsoDate()})`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ availability: data ?? [] }, { status: 200 });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  const { providerId } = await params;
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = await getUserRoles(supabase, user.id);
  const isAdmin = canAccessAdmin(roles);
  if (user.id !== providerId && !isAdmin) {
    return NextResponse.json({ error: 'Only the provider can manage this schedule.' }, { status: 403 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createProviderAvailabilitySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (!parsed.data.is_recurring && parsed.data.specific_date) {
    if (parsed.data.specific_date < dublinTodayIsoDate()) {
      return NextResponse.json(
        { error: 'specific_date cannot be in the past.' },
        { status: 400 }
      );
    }
  }

  const { data: inserted, error: insertError } = await supabase
    .from('provider_availability')
    .insert({
      provider_id: providerId,
      day_of_week: parsed.data.is_recurring ? parsed.data.day_of_week : null,
      specific_date: parsed.data.is_recurring ? null : parsed.data.specific_date,
      start_time: parsed.data.start_time,
      end_time: parsed.data.end_time,
      is_recurring: parsed.data.is_recurring,
    })
    .select('id,provider_id,day_of_week,start_time,end_time,is_recurring,specific_date,created_at')
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({ availability: inserted }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  const { providerId } = await params;
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = await getUserRoles(supabase, user.id);
  const isAdmin = canAccessAdmin(roles);
  if (user.id !== providerId && !isAdmin) {
    return NextResponse.json({ error: 'Only the provider can manage this schedule.' }, { status: 403 });
  }

  const url = new URL(request.url);
  const availabilityId = url.searchParams.get('id');
  if (!availabilityId) {
    return NextResponse.json({ error: 'Missing availability id.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('provider_availability')
    .delete()
    .eq('id', availabilityId)
    .eq('provider_id', providerId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
