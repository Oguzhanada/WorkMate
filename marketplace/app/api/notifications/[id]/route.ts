import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';

// DELETE /api/notifications/[id]
// Deletes a single notification belonging to the current user.
async function deleteHandler(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // RLS already enforces user_id = auth.uid() on DELETE, but we also filter
  // explicitly so we can tell the caller whether it was found.
  const { error, count } = await supabase
    .from('notifications')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ deleted: id });
}

export const DELETE = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, deleteHandler);
