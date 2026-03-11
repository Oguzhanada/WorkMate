import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { updateSavedSearchSchema } from '@/lib/validation/api';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiUnauthorized, apiNotFound } from '@/lib/api/error-response';

// DELETE /api/saved-searches/[id] — delete a saved search (user's own only)
async function deleteHandler(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  // RLS ensures only the owner can delete, but an explicit WHERE prevents silent no-ops
  const { error, count } = await supabase
    .from('saved_searches')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return apiError(error.message, 400);
  if (!count) return apiNotFound();

  return new NextResponse(null, { status: 204 });
}

// PATCH /api/saved-searches/[id] — toggle notify_email / notify_bell
// Body: { notify_email?: boolean, notify_bell?: boolean }
async function patchHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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

  const parsed = updateSavedSearchSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Invalid request', 400);
  }

  const { data, error } = await supabase
    .from('saved_searches')
    .update(parsed.data)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id,name,notify_email,notify_bell')
    .maybeSingle();

  if (error) return apiError(error.message, 400);
  if (!data) return apiNotFound();

  return NextResponse.json({ saved_search: data });
}

export const PATCH = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, patchHandler);

export const DELETE = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, deleteHandler);
