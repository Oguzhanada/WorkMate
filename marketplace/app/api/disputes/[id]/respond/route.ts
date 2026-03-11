import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { disputeRespondSchema } from '@/lib/validation/api';
import { getDisputeParticipantContext } from '@/lib/disputes';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiUnauthorized, apiForbidden, apiNotFound } from '@/lib/api/error-response';

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = disputeRespondSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiError('Validation failed', 400);
  }

  const { data: dispute } = await supabase.from('disputes').select('id,job_id,status').eq('id', id).maybeSingle();
  if (!dispute) return apiNotFound('Dispute not found');

  const context = await getDisputeParticipantContext(supabase, dispute.job_id);
  if (!context || user.id !== context.providerId) {
    return apiForbidden('Only the assigned provider can submit response.');
  }

  const serviceSupabase = getSupabaseServiceClient();
  const { data: updated, error } = await serviceSupabase
    .from('disputes')
    .update({
      provider_response: parsed.data.response,
      status: dispute.status === 'open' ? 'under_review' : dispute.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error || !updated) {
    return apiError(error?.message ?? 'Dispute response failed.', 400);
  }

  await serviceSupabase.from('dispute_logs').insert({
    dispute_id: id,
    actor_id: user.id,
    actor_role: 'provider',
    action: 'provider_response',
    details: { response: parsed.data.response },
    old_status: dispute.status,
    new_status: updated.status,
  });

  await serviceSupabase.from('notifications').insert({
    user_id: context.customerId,
    type: 'dispute_response_received',
    payload: {
      dispute_id: id,
      job_id: dispute.job_id,
    },
  });

  return NextResponse.json({ dispute: updated }, { status: 200 });
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
