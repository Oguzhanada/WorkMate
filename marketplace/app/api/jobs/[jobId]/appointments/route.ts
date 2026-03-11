import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveJobAccessContext } from '@/lib/jobs/access';
import { createAppointmentSchema } from '@/lib/validation/api';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiUnauthorized, apiForbidden, apiNotFound, apiConflict, apiServerError } from '@/lib/api/error-response';

function buildLocalParts(iso: string) {
  const date = new Date(iso);
  const localDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Dublin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  const localTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Dublin',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Dublin',
    weekday: 'short',
  }).format(date);

  const dowMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    localDate,
    localTime,
    dayOfWeek: dowMap[weekday] ?? 0,
  };
}

function dublinNowDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Dublin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function isSlotInsideAvailability(
  availability: Array<{
    is_recurring: boolean;
    day_of_week: number | null;
    specific_date: string | null;
    start_time: string;
    end_time: string;
  }>,
  startIso: string,
  endIso: string
) {
  const start = buildLocalParts(startIso);
  const end = buildLocalParts(endIso);

  if (start.localDate !== end.localDate) {
    return false;
  }

  return availability.some((slot) => {
    if (slot.is_recurring) {
      return (
        slot.day_of_week === start.dayOfWeek &&
        slot.start_time <= start.localTime &&
        slot.end_time >= end.localTime
      );
    }

    return (
      slot.specific_date === start.localDate &&
      slot.start_time <= start.localTime &&
      slot.end_time >= end.localTime
    );
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  const access = await resolveJobAccessContext(supabase, jobId, user.id);
  if (!access.exists) {
    return apiNotFound('Job not found');
  }
  if (!access.isAdmin && !access.isCustomer && !access.isProvider) {
    return apiForbidden();
  }

  const { data, error } = await supabase
    .from('appointments')
    .select('id,job_id,provider_id,customer_id,start_time,end_time,status,video_link,notes,created_at')
    .eq('job_id', jobId)
    .order('start_time', { ascending: true });

  if (error) {
    return apiServerError(error.message);
  }

  return NextResponse.json({ appointments: data ?? [] }, { status: 200 });
}

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const supabase = await getSupabaseRouteClient();
  const service = getSupabaseServiceClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  const access = await resolveJobAccessContext(supabase, jobId, user.id);
  if (!access.exists) {
    return apiNotFound('Job not found');
  }
  if (!access.providerId || !access.customerId) {
    return apiError('Job does not have an accepted provider yet.', 400);
  }
  if (!access.isAdmin && !access.isCustomer && !access.isProvider) {
    return apiForbidden();
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = createAppointmentSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiError('Validation failed', 400);
  }

  const startAt = new Date(parsed.data.start_time);
  const endAt = new Date(parsed.data.end_time);
  const now = new Date();

  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return apiError('Invalid start_time or end_time.', 400);
  }
  if (startAt.getTime() < now.getTime()) {
    return apiError('Appointments cannot be created in the past.', 400);
  }

  const localStartDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Dublin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(startAt);
  const localEndDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Dublin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(endAt);
  if (localStartDate !== localEndDate) {
    return apiError('Appointment must start and end on the same calendar day.', 400);
  }

  const startParts = buildLocalParts(parsed.data.start_time);
  const endParts = buildLocalParts(parsed.data.end_time);

  const { data: availability, error: availabilityError } = await service
    .from('provider_availability')
    .select('is_recurring,day_of_week,specific_date,start_time,end_time')
    .eq('provider_id', access.providerId)
    .or(`is_recurring.eq.true,and(is_recurring.eq.false,specific_date.gte.${dublinNowDate()})`);

  if (availabilityError) {
    return apiServerError(availabilityError.message);
  }

  if (!isSlotInsideAvailability(availability ?? [], parsed.data.start_time, parsed.data.end_time)) {
    return apiError('Selected slot is outside provider availability. Please pick a time within an available window.', 400);
  }

  const { data: conflicting } = await service
    .from('appointments')
    .select('id')
    .eq('provider_id', access.providerId)
    .eq('status', 'scheduled')
    .lt('start_time', parsed.data.end_time)
    .gt('end_time', parsed.data.start_time)
    .limit(1)
    .maybeSingle();

  if (conflicting) {
    return apiConflict('Provider already has an appointment in this time window.');
  }

  const { data: inserted, error: insertError } = await service
    .from('appointments')
    .insert({
      job_id: jobId,
      provider_id: access.providerId,
      customer_id: access.customerId,
      start_time: parsed.data.start_time,
      end_time: parsed.data.end_time,
      status: 'scheduled',
      video_link: parsed.data.video_link ?? null,
      notes: parsed.data.notes ?? null,
    })
    .select('id,job_id,provider_id,customer_id,start_time,end_time,status,video_link,notes,created_at')
    .single();

  if (insertError) {
    return apiError(insertError.message, 400);
  }

  const notifyTargets = [inserted.provider_id, inserted.customer_id];
  await Promise.all(
    notifyTargets.map(async (targetId) => {
      await service.from('notifications').insert({
        user_id: targetId,
        type: 'appointment_scheduled',
        payload: {
          appointment_id: inserted.id,
          job_id: jobId,
          start_time: inserted.start_time,
          end_time: inserted.end_time,
          provider_id: inserted.provider_id,
          customer_id: inserted.customer_id,
        },
      });
    })
  );

  return NextResponse.json(
    {
      appointment: inserted,
      local_slot: {
        date: startParts.localDate,
        start: startParts.localTime,
        end: endParts.localTime,
      },
    },
    { status: 201 }
  );
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
