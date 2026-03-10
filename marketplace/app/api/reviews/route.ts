import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { createReviewSchema } from '@/lib/validation/api';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiValidationError, apiUnauthorized, apiNotFound, apiConflict } from '@/lib/api/error-response';

// GET /api/reviews?job_id=xxx
// Returns the review submitted by the authenticated customer for the given job.
export async function GET(request: NextRequest) {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  const jobId = request.nextUrl.searchParams.get('job_id');
  if (!jobId) {
    return apiError('job_id is required', 400);
  }

  const { data, error } = await supabase
    .from('reviews')
    .select('id,job_id,rating,comment,quality_rating,communication_rating,punctuality_rating,value_rating,created_at')
    .eq('job_id', jobId)
    .eq('customer_id', user.id)
    .maybeSingle();

  if (error) {
    return apiError(error.message, 400);
  }

  return NextResponse.json({ review: data ?? null }, { status: 200 });
}

// POST /api/reviews
// Creates a review for a completed job. One review per (job, customer).
async function postHandler(request: NextRequest) {
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

  const parsed = createReviewSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues);
  }

  const body = parsed.data;

  // Verify the job is completed and belongs to this customer
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id,status,customer_id,accepted_quote_id')
    .eq('id', body.job_id)
    .eq('customer_id', user.id)
    .maybeSingle();

  if (jobError || !job) {
    return apiNotFound('Job not found.');
  }

  if (job.status !== 'completed') {
    return apiError('Reviews can only be submitted for completed jobs.', 422);
  }

  if (!job.accepted_quote_id) {
    return apiError('No accepted quote found for this job.', 422);
  }

  // Get the pro_id from the accepted quote — use service client to bypass RLS on quotes
  const serviceSupabase = getSupabaseServiceClient();
  const { data: quote, error: quoteError } = await serviceSupabase
    .from('quotes')
    .select('pro_id')
    .eq('id', job.accepted_quote_id)
    .maybeSingle();

  if (quoteError || !quote) {
    return apiNotFound('Accepted quote not found.');
  }

  // Check for existing review (friendly error before unique constraint fires)
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('job_id', body.job_id)
    .eq('customer_id', user.id)
    .maybeSingle();

  if (existing) {
    return apiConflict('You have already reviewed this job.');
  }

  // Insert the review
  const { data: review, error: insertError } = await supabase
    .from('reviews')
    .insert({
      job_id: body.job_id,
      customer_id: user.id,
      pro_id: quote.pro_id,
      rating: body.rating,
      comment: body.comment || null,
      quality_rating: body.quality_rating ?? null,
      communication_rating: body.communication_rating ?? null,
      punctuality_rating: body.punctuality_rating ?? null,
      value_rating: body.value_rating ?? null,
      is_public: true,
    })
    .select('id,rating,created_at')
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      return apiConflict('You have already reviewed this job.');
    }
    return apiError(insertError.message, 400);
  }

  // Notify the provider
  await serviceSupabase.from('notifications').insert({
    user_id: quote.pro_id,
    type: 'new_review',
    payload: {
      job_id: body.job_id,
      rating: body.rating,
      customer_id: user.id,
    },
  });

  return NextResponse.json({ review }, { status: 201 });
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
