import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveJobAccessContext } from '@/lib/jobs/access';
import { createTimeEntrySchema } from '@/lib/validation/api';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiUnauthorized, apiForbidden, apiNotFound, apiServerError } from '@/lib/api/error-response';

function computeBillableCents(minutes: number, hourlyRateCents: number) {
  return Math.round((minutes / 60) * hourlyRateCents);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const supabase = await getSupabaseRouteClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return apiUnauthorized();

  const access = await resolveJobAccessContext(supabase, jobId, user.id);
  if (!access.exists) return apiNotFound('Job not found');
  if (!access.isAdmin && !access.isCustomer && !access.isProvider) {
    return apiForbidden();
  }

  const [{ data: job }, { data: entries, error: entriesError }] = await Promise.all([
    supabase
      .from('jobs')
      .select('id,accepted_quote_id')
      .eq('id', jobId)
      .maybeSingle(),
    supabase
      .from('time_entries')
      .select('id,job_id,provider_id,started_at,ended_at,duration_minutes,hourly_rate,description,approved,approved_at,approved_by,created_at')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false }),
  ]);

  if (entriesError) return apiServerError(entriesError.message);

  let defaultHourlyRate: number | null = null;
  if (job?.accepted_quote_id) {
    const { data: quote } = await supabase
      .from('quotes')
      .select('quote_amount_cents')
      .eq('id', job.accepted_quote_id)
      .maybeSingle();
    defaultHourlyRate = quote?.quote_amount_cents ?? null;
  }

  const normalized = (entries ?? []).map((entry) => {
    const effectiveRate = entry.hourly_rate ?? defaultHourlyRate ?? 0;
    const duration = entry.duration_minutes ?? 0;
    return {
      ...entry,
      effective_hourly_rate: effectiveRate,
      billable_cents: entry.ended_at ? computeBillableCents(duration, effectiveRate) : 0,
    };
  });

  const summary = normalized.reduce(
    (acc, entry) => {
      const minutes = entry.duration_minutes ?? 0;
      if (!entry.ended_at) return acc;
      acc.total_minutes += minutes;
      acc.total_billable_cents += entry.billable_cents;
      if (entry.approved) {
        acc.approved_minutes += minutes;
        acc.approved_billable_cents += entry.billable_cents;
      }
      return acc;
    },
    {
      total_minutes: 0,
      approved_minutes: 0,
      total_billable_cents: 0,
      approved_billable_cents: 0,
    }
  );

  return NextResponse.json(
    {
      entries: normalized,
      summary,
      active_entry_id: normalized.find((item) => !item.ended_at)?.id ?? null,
    },
    { status: 200 }
  );
}

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const supabase = await getSupabaseRouteClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return apiUnauthorized();

  const access = await resolveJobAccessContext(supabase, jobId, user.id);
  if (!access.exists) return apiNotFound('Job not found');
  if (!access.isProvider) {
    return apiForbidden('Only the assigned provider can add time entries.');
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = createTimeEntrySchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiError('Validation failed', 400);
  }

  if (parsed.data.action === 'start') {
    const { data: existingActive } = await supabase
      .from('time_entries')
      .select('id')
      .eq('job_id', jobId)
      .eq('provider_id', user.id)
      .is('ended_at', null)
      .maybeSingle();

    if (existingActive) {
      return apiError('An active timer already exists. Stop it before starting a new one.', 400);
    }

    const startedAt = parsed.data.started_at ?? new Date().toISOString();
    const { data: inserted, error: insertError } = await supabase
      .from('time_entries')
      .insert({
        job_id: jobId,
        provider_id: user.id,
        started_at: startedAt,
        description: parsed.data.description || null,
        hourly_rate: parsed.data.hourly_rate ?? null,
      })
      .select('id,job_id,provider_id,started_at,ended_at,duration_minutes,hourly_rate,description,approved,created_at')
      .single();

    if (insertError) return apiError(insertError.message, 400);

    if (access.customerId) {
      const service = getSupabaseServiceClient();
      await service.from('notifications').insert({
        user_id: access.customerId,
        type: 'time_entry_created',
        payload: {
          job_id: jobId,
          provider_id: user.id,
          time_entry_id: inserted.id,
          started_at: inserted.started_at,
        },
      });
    }

    return NextResponse.json({ entry: inserted }, { status: 201 });
  }

  const endedAt = parsed.data.ended_at ?? new Date().toISOString();

  let stopQuery = supabase
    .from('time_entries')
    .select('id,started_at,ended_at,provider_id')
    .eq('job_id', jobId)
    .eq('provider_id', user.id)
    .is('ended_at', null);

  if (parsed.data.entry_id) {
    stopQuery = stopQuery.eq('id', parsed.data.entry_id);
  } else {
    stopQuery = stopQuery.order('started_at', { ascending: false }).limit(1);
  }

  const { data: activeEntry, error: activeError } = await stopQuery.maybeSingle();
  if (activeError) return apiError(activeError.message, 400);
  if (!activeEntry) return apiNotFound('No active timer found.');

  if (new Date(endedAt).getTime() < new Date(activeEntry.started_at).getTime()) {
    return apiError('ended_at must be after started_at.', 400);
  }

  const { data: updated, error: updateError } = await supabase
    .from('time_entries')
    .update({
      ended_at: endedAt,
      description: parsed.data.description ?? undefined,
    })
    .eq('id', activeEntry.id)
    .eq('provider_id', user.id)
    .select('id,job_id,provider_id,started_at,ended_at,duration_minutes,hourly_rate,description,approved,created_at')
    .single();

  if (updateError) return apiError(updateError.message, 400);

  return NextResponse.json({ entry: updated }, { status: 200 });
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
