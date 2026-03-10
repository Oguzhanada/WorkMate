import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { toggleFavouriteSchema } from '@/lib/validation/api';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';

// GET /api/favourites — list all provider IDs the current user has saved
export async function GET() {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('favourite_providers')
    .select('provider_id,created_at')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = toggleFavouriteSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
      { status: 400 }
    );
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

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 });

  return NextResponse.json({ saved: true }, { status: 201 });
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
