import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { canPostJob, getUserRoles } from '@/lib/auth/rbac';
import { updateJobPhotosSchema } from '@/lib/validation/api';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiUnauthorized, apiForbidden, apiNotFound } from '@/lib/api/error-response';

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
  if (!canPostJob(roles)) {
    return apiForbidden('Only customers can update job photos');
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = updateJobPhotosSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiError('Validation failed', 400);
  }

  const { data: currentJob, error: jobError } = await supabase
    .from('jobs')
    .select('id,photo_urls')
    .eq('id', jobId)
    .eq('customer_id', user.id)
    .maybeSingle();

  if (jobError || !currentJob) {
    return apiNotFound('Job not found or access denied.');
  }

  const existingUrls = Array.isArray(currentJob.photo_urls) ? currentJob.photo_urls : [];
  const merged = Array.from(new Set([...existingUrls, ...parsed.data.photo_urls]));
  if (merged.length > 20) {
    return apiError('Maximum 20 job photos allowed. Please remove some before uploading more.', 400);
  }

  const { data: updated, error: updateError } = await supabase
    .from('jobs')
    .update({ photo_urls: merged })
    .eq('id', jobId)
    .eq('customer_id', user.id)
    .select('id,photo_urls')
    .single();

  if (updateError) {
    return apiError(updateError.message, 400);
  }

  return NextResponse.json(
    { job: updated, added_count: parsed.data.photo_urls.length, total_count: merged.length },
    { status: 200 }
  );
}

export const PATCH = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, patchHandler);
