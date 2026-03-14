import { NextRequest, NextResponse } from 'next/server';

import { normalizeEircode } from '@/lib/ireland/eircode';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { updateJobDraftSchema } from '@/lib/validation/api';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import {
  apiError,
  apiValidationError,
  apiUnauthorized,
  apiNotFound,
  apiServerError,
} from '@/lib/api/error-response';
import { checkIdempotency, saveIdempotencyResponse } from '@/lib/idempotency';

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

  const { data: job, error } = await supabase
    .from('jobs')
    .select('id,title,description,eircode,county,locality,budget_range,status,review_status,created_at')
    .eq('id', jobId)
    .eq('customer_id', user.id)
    .maybeSingle();

  if (error) {
    return apiServerError(error.message);
  }

  if (!job) {
    return apiNotFound('Job not found');
  }

  return NextResponse.json({ job }, { status: 200 });
}

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

  // Idempotency check — prevents duplicate job updates on retry
  const iKey = request.headers.get('Idempotency-Key');
  if (iKey) {
    const cached = await checkIdempotency(iKey, 'jobs/update', user.id);
    if (cached) return NextResponse.json(cached.body, { status: cached.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = updateJobDraftSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues);
  }

  const eircode = normalizeEircode(parsed.data.eircode);

  const { data: existing, error: existingError } = await supabase
    .from('jobs')
    .select('id,status,review_status,customer_id')
    .eq('id', jobId)
    .eq('customer_id', user.id)
    .maybeSingle();

  if (existingError) {
    return apiServerError(existingError.message);
  }

  if (!existing) {
    return apiNotFound('Job not found');
  }

  if (!['open', 'quoted'].includes(existing.status)) {
    return apiError('Only open/quoted jobs can be edited from this summary page.', 400);
  }

  const { data: updated, error: updateError } = await supabase
    .from('jobs')
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      eircode,
      county: parsed.data.county,
      locality: parsed.data.locality,
      budget_range: parsed.data.budget_range,
    })
    .eq('id', jobId)
    .eq('customer_id', user.id)
    .select('id,title,description,eircode,county,locality,budget_range,status,review_status,created_at')
    .single();

  if (updateError) {
    return apiServerError(updateError.message);
  }

  const responseBody = { job: updated };
  if (iKey) {
    void saveIdempotencyResponse(iKey, 'jobs/update', user.id, 200, responseBody as Record<string, unknown>);
  }
  return NextResponse.json(responseBody, { status: 200 });
}

export const PATCH = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, patchHandler);
