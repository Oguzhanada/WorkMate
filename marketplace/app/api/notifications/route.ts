import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { markNotificationsReadSchema, notificationsQuerySchema } from '@/lib/validation/api';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiValidationError, apiUnauthorized } from '@/lib/api/error-response';

// GET /api/notifications
// Query: ?unread=true&limit=20
// Returns the user's notifications, newest first.
export async function GET(request: NextRequest) {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = notificationsQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues);
  }

  const { unread, limit = 20 } = parsed.data;

  let query = supabase
    .from('notifications')
    .select('id,type,title,body,data,payload,read_at,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unread === 'true') {
    query = query.is('read_at', null);
  }

  const { data, error } = await query;

  if (error) return apiError(error.message, 400);

  return NextResponse.json({ notifications: data ?? [] });
}

// PATCH /api/notifications
// Body: { ids: string[] } | { all: true }
// Marks the specified notifications (or all) as read for the current user.
async function patchHandler(request: NextRequest) {
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

  const parsed = markNotificationsReadSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues);
  }

  const { ids, all } = parsed.data;
  const now = new Date().toISOString();

  if (all === true) {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('user_id', user.id)
      .is('read_at', null);

    if (error) return apiError(error.message, 400);
    return NextResponse.json({ updated: 'all' });
  }

  // ids is guaranteed non-empty by schema
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: now })
    .eq('user_id', user.id)
    .in('id', ids!);

  if (error) return apiError(error.message, 400);

  return NextResponse.json({ updated: ids!.length });
}

export const PATCH = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, patchHandler);
