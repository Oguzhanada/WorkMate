import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { canQuote, getUserRoles } from '@/lib/auth/rbac';
import { upsertPortfolioSchema } from '@/lib/validation/api';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';

export async function GET(request: NextRequest) {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profileId = request.nextUrl.searchParams.get('profile_id') ?? user.id;
  const { data, error } = await supabase
    .from('portfolio_items')
    .select(
      'id,provider_id,category_id,title,before_image_url,after_image_url,experience_note,visibility_scope,is_public,created_at'
    )
    .eq('provider_id', profileId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ items: data ?? [] }, { status: 200 });
}

async function postHandler(request: NextRequest) {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = await getUserRoles(supabase, user.id);
  if (!canQuote(roles)) {
    return NextResponse.json({ error: 'Only providers can manage portfolio' }, { status: 403 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = upsertPortfolioSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const body = parsed.data;
  const visibilityScope =
    body.visibility_scope ?? (body.is_public === false ? 'applied_customers' : 'public');
  const isPublic = visibilityScope === 'public';

  if (body.id) {
    const { data, error } = await supabase
      .from('portfolio_items')
      .update({
        category_id: body.category_id ?? null,
        title: body.title,
        before_image_url: body.before_image_url,
        after_image_url: body.after_image_url,
        experience_note: body.experience_note,
        visibility_scope: visibilityScope,
        is_public: isPublic,
      })
      .eq('id', body.id)
      .eq('provider_id', user.id)
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ item: data }, { status: 200 });
  }

  const { data, error } = await supabase
    .from('portfolio_items')
    .insert({
      provider_id: user.id,
      category_id: body.category_id ?? null,
      title: body.title,
      before_image_url: body.before_image_url,
      after_image_url: body.after_image_url,
      experience_note: body.experience_note,
      visibility_scope: visibilityScope,
      is_public: isPublic,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ item: data }, { status: 201 });
}

async function deleteHandler(request: NextRequest) {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('portfolio_items')
    .delete()
    .eq('id', id)
    .eq('provider_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true }, { status: 200 });
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);

export const DELETE = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, deleteHandler);
