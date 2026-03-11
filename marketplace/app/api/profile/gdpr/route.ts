import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { gdprDeleteRequestSchema } from '@/lib/validation/api';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiUnauthorized, apiServerError } from '@/lib/api/error-response';

// ─── GET /api/profile/gdpr/export ────────────────────────────────────────────
// Returns all personal data for the authenticated user as a downloadable JSON.
// Uses the service client for cross-table queries but scopes every query to
// the authenticated user's ID — no other user's data is ever returned.
async function getHandler(_req: NextRequest): Promise<NextResponse> {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  const service = getSupabaseServiceClient();
  const uid = user.id;

  // Fetch all tables in parallel — each query is hard-scoped to uid.
  const [
    { data: profile },
    { data: jobs },
    { data: appointments },
    { data: reviews },
    { data: favourites },
    { data: addresses },
  ] = await Promise.all([
    service
      .from('profiles')
      .select(
        'id, full_name, phone, verification_status, id_verification_status, ' +
          'created_at, updated_at'
      )
      .eq('id', uid)
      .maybeSingle(),

    service
      .from('jobs')
      .select(
        'id, title, description, status, county, locality, eircode, budget_range, ' +
          'task_type, job_mode, created_at, updated_at'
      )
      .eq('customer_id', uid),

    service
      .from('appointments')
      .select('id, start_time, end_time, status, video_link, notes, created_at')
      .eq('customer_id', uid),

    service
      .from('reviews')
      .select(
        'id, job_id, rating, comment, quality_rating, communication_rating, ' +
          'punctuality_rating, value_rating, created_at'
      )
      .eq('reviewer_id', uid),

    service
      .from('favourite_providers')
      .select('id, provider_id, created_at')
      .eq('customer_id', uid),

    service
      .from('addresses')
      .select('address_line_1, address_line_2, locality, county, eircode, created_at')
      .eq('profile_id', uid),
  ]);

  const exportPayload = {
    exported_at: new Date().toISOString(),
    user_id: uid,
    email: user.email ?? null,
    profile: profile ?? null,
    addresses: addresses ?? [],
    jobs: jobs ?? [],
    appointments: appointments ?? [],
    reviews_written: reviews ?? [],
    favourite_providers: favourites ?? [],
  };

  const body = JSON.stringify(exportPayload, null, 2);

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="workmate-data-export.json"',
      'Cache-Control': 'no-store',
    },
  });
}

// ─── DELETE /api/profile/gdpr ─────────────────────────────────────────────────
// Soft-deletes the account: sets deletion_requested_at and marks the profile
// status. Data is NOT removed immediately — a 30-day hold applies for
// compliance (Irish GDPR / Data Protection Act 2018).
async function deleteHandler(req: NextRequest): Promise<NextResponse> {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  // Parse + validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = gdprDeleteRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('You must send { "confirm": true } to request deletion.', 422);
  }

  const service = getSupabaseServiceClient();
  const uid = user.id;

  const requestedAt = new Date();
  const scheduledAt = new Date(requestedAt);
  scheduledAt.setDate(scheduledAt.getDate() + 30);

  const { error: updateError } = await service
    .from('profiles')
    .update({
      deletion_requested_at: requestedAt.toISOString(),
    })
    .eq('id', uid);

  if (updateError) {
    return apiServerError(updateError.message);
  }

  return NextResponse.json(
    {
      message:
        'Your account has been scheduled for deletion. All personal data will be permanently removed on the scheduled date. You may contact privacy@workmate.ie before that date to cancel this request.',
      deletion_requested_at: requestedAt.toISOString(),
      deletion_scheduled_for: scheduledAt.toISOString(),
    },
    { status: 200 }
  );
}

export const GET = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, getHandler);
export const DELETE = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, deleteHandler);
