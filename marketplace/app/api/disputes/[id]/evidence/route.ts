import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { disputeEvidenceSchema, DISPUTE_EVIDENCE_MAX_FILE_SIZE } from '@/lib/validation/api';
import { canAccessAdmin, getUserRoles } from '@/lib/auth/rbac';
import { getDisputeParticipantContext, isDisputeParticipant } from '@/lib/disputes';
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

  const parsed = disputeEvidenceSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiError('Validation failed', 400);
  }

  // Enforce file size limit even if Zod schema marks file_size as optional
  // (backwards-compatible: older clients that don't send file_size still work,
  //  but any client that does send it gets validated)
  if (parsed.data.file_size && parsed.data.file_size > DISPUTE_EVIDENCE_MAX_FILE_SIZE) {
    return apiError(`File size exceeds the ${DISPUTE_EVIDENCE_MAX_FILE_SIZE / (1024 * 1024)} MB limit.`, 400);
  }

  const { data: dispute } = await supabase.from('disputes').select('id,job_id').eq('id', id).maybeSingle();
  if (!dispute) return apiNotFound('Dispute not found');

  const roles = await getUserRoles(supabase, user.id);
  const isAdmin = canAccessAdmin(roles);
  const context = await getDisputeParticipantContext(supabase, dispute.job_id);

  if (!isAdmin && (!context || !isDisputeParticipant(user.id, context))) {
    return apiForbidden();
  }

  const serviceSupabase = getSupabaseServiceClient();
  const { data: evidence, error } = await serviceSupabase
    .from('dispute_evidence')
    .insert({
      dispute_id: id,
      uploaded_by: user.id,
      file_url: parsed.data.file_url,
      file_type: parsed.data.file_type,
      description: parsed.data.description,
    })
    .select('*')
    .single();

  if (error || !evidence) {
    return apiError(error?.message ?? 'Evidence upload failed.', 400);
  }

  await serviceSupabase.from('dispute_logs').insert({
    dispute_id: id,
    actor_id: user.id,
    actor_role: isAdmin ? 'admin' : user.id === context?.customerId ? 'customer' : 'provider',
    action: 'evidence_uploaded',
    details: {
      file_type: parsed.data.file_type,
      file_url: parsed.data.file_url,
    },
  });

  return NextResponse.json({ evidence }, { status: 201 });
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
