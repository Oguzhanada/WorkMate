import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { resolveJobAccessContext } from '@/lib/jobs/access';
import { patchTimeEntrySchema } from '@/lib/validation/api';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';

async function patchHandler(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string; entryId: string }> }
) {
  const { jobId, entryId } = await params;
  const supabase = await getSupabaseRouteClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await resolveJobAccessContext(supabase, jobId, user.id);
  if (!access.exists) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  if (!access.isAdmin && !access.isCustomer && !access.isProvider) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: existing, error: existingError } = await supabase
    .from('time_entries')
    .select('id,job_id,provider_id,started_at,ended_at,approved')
    .eq('id', entryId)
    .eq('job_id', jobId)
    .maybeSingle();

  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 400 });
  if (!existing) return NextResponse.json({ error: 'Time entry not found' }, { status: 404 });

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = patchTimeEntrySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const hasApprovalChange = typeof parsed.data.approved === 'boolean';
  const hasProviderEdit = ['description', 'hourly_rate', 'started_at', 'ended_at'].some(
    (field) => field in parsed.data
  );

  if (hasApprovalChange && !access.isCustomer && !access.isAdmin) {
    return NextResponse.json({ error: 'Only the customer can approve time entries.' }, { status: 403 });
  }

  if (hasProviderEdit && !access.isAdmin && !(access.isProvider && existing.provider_id === user.id)) {
    return NextResponse.json(
      { error: 'Only the assigned provider can edit this time entry.' },
      { status: 403 }
    );
  }

  if (hasProviderEdit && existing.approved && !access.isAdmin) {
    return NextResponse.json(
      { error: 'Approved entries cannot be edited by provider.' },
      { status: 400 }
    );
  }

  if (parsed.data.approved === true && !existing.ended_at) {
    return NextResponse.json({ error: 'Cannot approve an active timer.' }, { status: 400 });
  }

  const nextStartedAt = parsed.data.started_at ?? existing.started_at;
  const nextEndedAt =
    parsed.data.ended_at === null
      ? null
      : parsed.data.ended_at === undefined
      ? existing.ended_at
      : parsed.data.ended_at;

  if (nextEndedAt && new Date(nextEndedAt).getTime() < new Date(nextStartedAt).getTime()) {
    return NextResponse.json({ error: 'ended_at must be after started_at.' }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if ('description' in parsed.data) patch.description = parsed.data.description ?? null;
  if ('hourly_rate' in parsed.data) patch.hourly_rate = parsed.data.hourly_rate ?? null;
  if ('started_at' in parsed.data) patch.started_at = parsed.data.started_at;
  if ('ended_at' in parsed.data) patch.ended_at = parsed.data.ended_at;

  if (hasApprovalChange) {
    patch.approved = parsed.data.approved;
    patch.approved_at = parsed.data.approved ? new Date().toISOString() : null;
    patch.approved_by = parsed.data.approved ? user.id : null;
  }

  const { data: updated, error: updateError } = await supabase
    .from('time_entries')
    .update(patch)
    .eq('id', entryId)
    .eq('job_id', jobId)
    .select('id,job_id,provider_id,started_at,ended_at,duration_minutes,hourly_rate,description,approved,approved_at,approved_by,created_at')
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  return NextResponse.json({ entry: updated }, { status: 200 });
}

async function deleteHandler(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string; entryId: string }> }
) {
  const { jobId, entryId } = await params;
  const supabase = await getSupabaseRouteClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await resolveJobAccessContext(supabase, jobId, user.id);
  if (!access.exists) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  const { data: existing, error: existingError } = await supabase
    .from('time_entries')
    .select('id,provider_id,approved')
    .eq('id', entryId)
    .eq('job_id', jobId)
    .maybeSingle();

  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 400 });
  if (!existing) return NextResponse.json({ error: 'Time entry not found' }, { status: 404 });

  const isOwnerProvider = access.isProvider && existing.provider_id === user.id;
  if (!access.isAdmin && !isOwnerProvider) {
    return NextResponse.json(
      { error: 'Only the assigned provider can delete this time entry.' },
      { status: 403 }
    );
  }

  if (existing.approved && !access.isAdmin) {
    return NextResponse.json({ error: 'Approved entries cannot be deleted.' }, { status: 400 });
  }

  const { error: deleteError } = await supabase
    .from('time_entries')
    .delete()
    .eq('id', entryId)
    .eq('job_id', jobId);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 400 });
  return NextResponse.json({ success: true }, { status: 200 });
}

export const PATCH = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, patchHandler);

export const DELETE = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, deleteHandler);
