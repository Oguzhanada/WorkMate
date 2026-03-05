import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { createReviewSchema } from '@/lib/validation/api';

// GET /api/reviews?job_id=xxx
// Returns the review submitted by the authenticated customer for the given job.
export async function GET(request: NextRequest) {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const jobId = request.nextUrl.searchParams.get('job_id');
  if (!jobId) {
    return NextResponse.json({ error: 'job_id is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('reviews')
    .select('id,job_id,rating,comment,quality_rating,communication_rating,punctuality_rating,value_rating,created_at')
    .eq('job_id', jobId)
    .eq('customer_id', user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ review: data ?? null }, { status: 200 });
}

// POST /api/reviews
// Creates a review for a completed job. One review per (job, customer).
export async function POST(request: NextRequest) {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createReviewSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
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
    return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  }

  if (job.status !== 'completed') {
    return NextResponse.json({ error: 'Reviews can only be submitted for completed jobs.' }, { status: 422 });
  }

  if (!job.accepted_quote_id) {
    return NextResponse.json({ error: 'No accepted quote found for this job.' }, { status: 422 });
  }

  // Get the pro_id from the accepted quote — use service client to bypass RLS on quotes
  const serviceSupabase = getSupabaseServiceClient();
  const { data: quote, error: quoteError } = await serviceSupabase
    .from('quotes')
    .select('pro_id')
    .eq('id', job.accepted_quote_id)
    .maybeSingle();

  if (quoteError || !quote) {
    return NextResponse.json({ error: 'Accepted quote not found.' }, { status: 404 });
  }

  // Check for existing review (friendly error before unique constraint fires)
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('job_id', body.job_id)
    .eq('customer_id', user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'You have already reviewed this job.' }, { status: 409 });
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
      return NextResponse.json({ error: 'You have already reviewed this job.' }, { status: 409 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 400 });
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
