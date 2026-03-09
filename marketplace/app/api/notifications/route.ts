import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { markNotificationsReadSchema, notificationsQuerySchema } from '@/lib/validation/api';

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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = notificationsQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid query params' },
      { status: 400 }
    );
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

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ notifications: data ?? [] });
}

// PATCH /api/notifications
// Body: { ids: string[] } | { all: true }
// Marks the specified notifications (or all) as read for the current user.
export async function PATCH(request: NextRequest) {
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

  const parsed = markNotificationsReadSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
      { status: 400 }
    );
  }

  const { ids, all } = parsed.data;
  const now = new Date().toISOString();

  if (all === true) {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('user_id', user.id)
      .is('read_at', null);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ updated: 'all' });
  }

  // ids is guaranteed non-empty by schema
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: now })
    .eq('user_id', user.id)
    .in('id', ids!);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ updated: ids!.length });
}
