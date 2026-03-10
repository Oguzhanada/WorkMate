import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { reviewResponseSchema } from '@/lib/validation/api';
import { sendNotification } from '@/lib/notifications/send';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';

type RouteContext = { params: Promise<{ reviewId: string }> };

// POST /api/reviews/[reviewId]/response
// Allows the reviewed provider to add or update their public response.
async function postHandler(request: NextRequest, { params }: RouteContext) {
  const { reviewId } = await params;

  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Validate body
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = reviewResponseSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { response } = parsed.data;

  // Fetch the review — verify it belongs to this provider
  const serviceSupabase = getSupabaseServiceClient();
  const { data: review, error: reviewError } = await serviceSupabase
    .from('reviews')
    .select('id, pro_id, customer_id, provider_response')
    .eq('id', reviewId)
    .maybeSingle();

  if (reviewError || !review) {
    return NextResponse.json({ error: 'Review not found.' }, { status: 404 });
  }

  if (review.pro_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden — you are not the reviewed provider.' }, { status: 403 });
  }

  // Write the response — use the route client so RLS (reviews_update_provider_response) applies
  const { error: updateError } = await supabase
    .from('reviews')
    .update({
      provider_response: response,
      provider_responded_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .eq('pro_id', user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  // Notify the reviewer — fire-and-forget, must not fail the request
  if (!review.provider_response) {
    // Only notify on first response, not edits
    await sendNotification({
      userId: review.customer_id,
      type: 'review_response',
      title: 'A provider responded to your review',
      body: 'The provider has posted a public reply to the review you left.',
      data: { review_id: reviewId },
    });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

// DELETE /api/reviews/[reviewId]/response
// Allows the provider to remove their response.
async function deleteHandler(_request: NextRequest, { params }: RouteContext) {
  const { reviewId } = await params;

  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Confirm the review belongs to this provider before clearing
  const serviceSupabase = getSupabaseServiceClient();
  const { data: review, error: reviewError } = await serviceSupabase
    .from('reviews')
    .select('id, pro_id')
    .eq('id', reviewId)
    .maybeSingle();

  if (reviewError || !review) {
    return NextResponse.json({ error: 'Review not found.' }, { status: 404 });
  }

  if (review.pro_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden — you are not the reviewed provider.' }, { status: 403 });
  }

  const { error: updateError } = await supabase
    .from('reviews')
    .update({ provider_response: null, provider_responded_at: null })
    .eq('id', reviewId)
    .eq('pro_id', user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);

export const DELETE = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, deleteHandler);
