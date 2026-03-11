import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { trackFunnelEventSchema } from '@/lib/validation/api';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiServerError } from '@/lib/api/error-response';

// POST /api/analytics/funnel
// Inserts a single funnel step event.
// Auth is optional — supports both authenticated and anonymous tracking.
// user_id is inferred from the session cookie when present; null otherwise.
async function handler(request: NextRequest): Promise<NextResponse> {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = trackFunnelEventSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Invalid request', 400);
  }

  const { funnel_name, step_name, step_number, session_id, metadata } = parsed.data;

  // Resolve user_id if a session cookie is present — null for anonymous visitors
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error: insertError } = await supabase.from('funnel_events').insert({
    user_id: user?.id ?? null,
    session_id,
    funnel_name,
    step_name,
    step_number,
    metadata: metadata ?? {},
  });

  if (insertError) {
    // Log server-side only — never expose DB errors to the client
    console.error('[analytics/funnel] insert failed:', insertError.message);
    return apiServerError('Event could not be recorded');
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, handler);
