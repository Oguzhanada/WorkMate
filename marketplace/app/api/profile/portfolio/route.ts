import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { createPortfolioItemSchema } from '@/lib/validation/api';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';

const MAX_PORTFOLIO_ITEMS = 12;

// GET /api/profile/portfolio — returns current user's portfolio items
export async function GET() {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = getSupabaseServiceClient();
  const { data, error } = await service
    .from('portfolio_items')
    .select('id, title, description, image_url, display_order, created_at')
    .eq('provider_id', user.id)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ items: data ?? [] }, { status: 200 });
}

// POST /api/profile/portfolio — adds a portfolio item
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

  const parsed = createPortfolioItemSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const service = getSupabaseServiceClient();

  // Enforce max 12 items per provider
  const { count } = await service
    .from('portfolio_items')
    .select('id', { count: 'exact', head: true })
    .eq('provider_id', user.id);

  if ((count ?? 0) >= MAX_PORTFOLIO_ITEMS) {
    return NextResponse.json(
      { error: `Portfolio is limited to ${MAX_PORTFOLIO_ITEMS} items. Remove an item before adding a new one.` },
      { status: 422 }
    );
  }

  const { data: item, error: insertError } = await service
    .from('portfolio_items')
    .insert({
      provider_id:   user.id,
      title:         parsed.data.title,
      description:   parsed.data.description ?? null,
      image_url:     parsed.data.image_url,
      display_order: parsed.data.display_order ?? 0,
    })
    .select('id, title, description, image_url, display_order, created_at')
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({ item }, { status: 201 });
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
