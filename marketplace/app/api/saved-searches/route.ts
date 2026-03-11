import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { createSavedSearchSchema } from '@/lib/validation/api';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiUnauthorized, apiConflict } from '@/lib/api/error-response';

// GET /api/saved-searches — returns current user's saved searches
export async function GET() {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  const { data, error } = await supabase
    .from('saved_searches')
    .select('id,name,filters,notify_email,notify_bell,last_notified_at,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return apiError(error.message, 400);

  return NextResponse.json({ saved_searches: data ?? [] });
}

// POST /api/saved-searches — create a saved search
// Body: { name, filters, notify_email, notify_bell }
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

  const parsed = createSavedSearchSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Invalid request', 400);
  }

  const { name, filters, notify_email, notify_bell } = parsed.data;

  const { data, error } = await supabase
    .from('saved_searches')
    .insert({ user_id: user.id, name, filters, notify_email, notify_bell })
    .select('id,name,filters,notify_email,notify_bell,created_at')
    .single();

  if (error) {
    // Unique constraint violation → duplicate name
    if (error.code === '23505') {
      return apiConflict('You already have a saved search with this name.');
    }
    return apiError(error.message, 400);
  }

  return NextResponse.json({ saved_search: data }, { status: 201 });
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
