import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { toggleFavouriteSchema } from '@/lib/validation/api';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiValidationError, apiUnauthorized } from '@/lib/api/error-response';

// GET /api/favourites — list all provider IDs the current user has saved
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
    .from('favourite_providers')
    .select('provider_id,created_at')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return apiError(error.message, 400);

  return NextResponse.json({ favourites: data ?? [] });
}

// POST /api/favourites — toggle favourite for a provider
// Body: { provider_id: string }
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

  const parsed = toggleFavouriteSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues);
  }

  const { provider_id } = parsed.data;

  // Check if already favourited
  const { data: existing } = await supabase
    .from('favourite_providers')
    .select('id')
    .eq('customer_id', user.id)
    .eq('provider_id', provider_id)
    .maybeSingle();

  if (existing) {
    // Remove favourite
    await supabase
      .from('favourite_providers')
      .delete()
      .eq('customer_id', user.id)
      .eq('provider_id', provider_id);

    return NextResponse.json({ saved: false });
  }

  // Add favourite
  const { error: insertError } = await supabase.from('favourite_providers').insert({
    customer_id: user.id,
    provider_id,
  });

  if (insertError) return apiError(insertError.message, 400);

  return NextResponse.json({ saved: true }, { status: 201 });
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
