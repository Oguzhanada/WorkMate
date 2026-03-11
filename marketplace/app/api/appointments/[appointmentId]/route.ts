import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { canAccessAdmin, getUserRoles } from '@/lib/auth/rbac';
import { patchAppointmentSchema } from '@/lib/validation/api';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiUnauthorized, apiForbidden, apiNotFound, apiServerError } from '@/lib/api/error-response';

async function patchHandler(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  const { appointmentId } = await params;
  const supabase = await getSupabaseRouteClient();
  const service = getSupabaseServiceClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  const roles = await getUserRoles(supabase, user.id);
  const isAdmin = canAccessAdmin(roles);

  const { data: existing, error: existingError } = await service
    .from('appointments')
    .select('id,job_id,provider_id,customer_id,status,start_time,end_time')
    .eq('id', appointmentId)
    .maybeSingle();

  if (existingError) {
    return apiServerError(existingError.message);
  }
  if (!existing) {
    return apiNotFound('Appointment not found');
  }

  const isParticipant = user.id === existing.provider_id || user.id === existing.customer_id;
  if (!isParticipant && !isAdmin) {
    return apiForbidden();
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = patchAppointmentSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiError('Validation failed', 400);
  }

  if (parsed.data.status === 'scheduled') {
    return apiError('Only cancellation or completion is supported from this endpoint.', 400);
  }

  if (existing.status === 'cancelled' && parsed.data.status === 'completed') {
    return apiError('Cancelled appointments cannot be marked as completed.', 400);
  }

  if (existing.status === 'completed' && parsed.data.status === 'cancelled') {
    return apiError('Completed appointments cannot be cancelled.', 400);
  }

  const updatePayload: Record<string, unknown> = {};
  if (parsed.data.status) updatePayload.status = parsed.data.status;
  if ('video_link' in parsed.data) updatePayload.video_link = parsed.data.video_link ?? null;
  if ('notes' in parsed.data) updatePayload.notes = parsed.data.notes ?? null;

  const { data: updated, error: updateError } = await service
    .from('appointments')
    .update(updatePayload)
    .eq('id', appointmentId)
    .select('id,job_id,provider_id,customer_id,start_time,end_time,status,video_link,notes,created_at')
    .single();

  if (updateError) {
    return apiError(updateError.message, 400);
  }

  // Only send status-change notifications when status was actually updated
  if (parsed.data.status) {
    const notificationType =
      parsed.data.status === 'cancelled' ? 'appointment_cancelled' : 'appointment_completed';

    await Promise.all(
      [updated.provider_id, updated.customer_id].map(async (targetId) => {
        await service.from('notifications').insert({
          user_id: targetId,
          type: notificationType,
          payload: {
            appointment_id: updated.id,
            job_id: updated.job_id,
            status: updated.status,
            start_time: updated.start_time,
            end_time: updated.end_time,
          },
        });
      })
    );
  }

  return NextResponse.json({ appointment: updated }, { status: 200 });
}

export const PATCH = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, patchHandler);
