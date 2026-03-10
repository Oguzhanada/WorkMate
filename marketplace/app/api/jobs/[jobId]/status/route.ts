import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { canAccessAdmin, canPostJob, getUserRoles } from '@/lib/auth/rbac';
import { updateJobStatusSchema } from '@/lib/validation/api';
import { logAdminAudit } from '@/lib/admin/audit';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiValidationError, apiUnauthorized, apiForbidden } from '@/lib/api/error-response';

async function patchHandler(
  request: NextRequest,
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

  const roles = await getUserRoles(supabase, user.id);
  const isAdmin = canAccessAdmin(roles);
  if (!canPostJob(roles)) {
    return apiForbidden('Only customers can update job status');
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = updateJobStatusSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues);
  }

  const patch: Record<string, unknown> = { status: parsed.data.status };
  if (parsed.data.status === 'completed') {
    const nowIso = new Date().toISOString();
    patch.complete_marked_at = nowIso;
    patch.completed_at = nowIso;
    patch.auto_release_at = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    patch.payment_released_at = null;
  }

  let query = supabase.from('jobs').update(patch).eq('id', jobId);
  if (!isAdmin) {
    query = query.eq('customer_id', user.id);
  }

  const { data, error } = await query.select('id,status,completed_at,auto_release_at,payment_released_at').single();
  if (error) {
    return apiError(error.message, 400);
  }

  if (isAdmin) {
    await logAdminAudit({
      adminUserId: user.id,
      adminEmail: user.email ?? null,
      action: 'admin_update_job_status',
      targetType: 'job',
      details: {
        job_id: jobId,
        new_status: parsed.data.status,
      },
    });
  }

  return NextResponse.json({ job: data }, { status: 200 });
}

export const PATCH = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, patchHandler);
