import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { getUserRoles, canAccessAdmin } from '@/lib/auth/rbac';
import { appointmentCalendarQuerySchema } from '@/lib/validation/api';

export type CalendarAppointment = {
  id: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  job_title: string | null;
  other_party_name: string | null;
  video_link: string | null;
  notes: string | null;
};

export type CalendarResponse = {
  month: string;
  days: Record<string, CalendarAppointment[]>;
};

export async function GET(request: NextRequest) {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse and validate query params
  const { searchParams } = new URL(request.url);
  const rawQuery = {
    month: searchParams.get('month') ?? '',
    role:  searchParams.get('role') ?? undefined,
  };

  const parsed = appointmentCalendarQuerySchema.safeParse(rawQuery);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { month, role } = parsed.data;

  // Determine effective role for the filter
  const roles = await getUserRoles(supabase, user.id);
  const isAdmin = canAccessAdmin(roles);

  // Build the month date range (UTC-safe)
  const [yearStr, monthStr] = month.split('-');
  const year  = parseInt(yearStr, 10);
  const mon   = parseInt(monthStr, 10) - 1; // 0-indexed
  const start = new Date(Date.UTC(year, mon, 1)).toISOString();
  const end   = new Date(Date.UTC(year, mon + 1, 0, 23, 59, 59, 999)).toISOString();

  const service = getSupabaseServiceClient();

  // Build role-sensitive query.
  // We join jobs for the title, and profiles for other_party display name.
  // The query uses service client (bypass RLS) but we filter to the user's own
  // appointments — same scope that RLS appointments_select_participants enforces.
  let query = service
    .from('appointments')
    .select(
      `
      id,
      start_time,
      end_time,
      status,
      video_link,
      notes,
      provider_id,
      customer_id,
      jobs ( title ),
      provider:profiles!appointments_provider_id_fkey ( full_name ),
      customer:profiles!appointments_customer_id_fkey ( full_name )
      `
    )
    .gte('start_time', start)
    .lte('start_time', end)
    .order('start_time', { ascending: true });

  // Scope to the authenticated user's appointments unless admin with explicit role param
  const effectiveRole = role ?? (isAdmin ? undefined : undefined);
  if (!isAdmin || !effectiveRole) {
    // Non-admin: filter to their own appointments as either participant
    query = query.or(`provider_id.eq.${user.id},customer_id.eq.${user.id}`);
  } else if (effectiveRole === 'provider') {
    query = query.eq('provider_id', user.id);
  } else {
    query = query.eq('customer_id', user.id);
  }

  const { data: rows, error: queryError } = await query;

  if (queryError) {
    return NextResponse.json({ error: queryError.message }, { status: 500 });
  }

  // Group by calendar date in Europe/Dublin timezone
  const grouped: Record<string, CalendarAppointment[]> = {};

  for (const row of rows ?? []) {
    // Determine other party from the perspective of the calling user
    const isProvider = row.provider_id === user.id;
    const otherParty = isProvider
      ? (Array.isArray(row.customer) ? row.customer[0] : row.customer)
      : (Array.isArray(row.provider) ? row.provider[0] : row.provider);

    const otherPartyName = (otherParty as { full_name?: string } | null)?.full_name ?? null;
    const jobRecord = Array.isArray(row.jobs) ? row.jobs[0] : row.jobs;
    const jobTitle = (jobRecord as { title?: string } | null)?.title ?? null;

    // Get the date string in Dublin local time
    const dublinDate = new Date(row.start_time).toLocaleDateString('en-CA', {
      timeZone: 'Europe/Dublin',
    }); // produces YYYY-MM-DD

    if (!grouped[dublinDate]) {
      grouped[dublinDate] = [];
    }

    grouped[dublinDate].push({
      id:               row.id,
      start_time:       row.start_time,
      end_time:         row.end_time,
      status:           row.status as 'scheduled' | 'completed' | 'cancelled',
      job_title:        jobTitle,
      other_party_name: otherPartyName,
      video_link:       row.video_link ?? null,
      notes:            row.notes ?? null,
    });
  }

  const response: CalendarResponse = { month, days: grouped };
  return NextResponse.json(response, { status: 200 });
}
