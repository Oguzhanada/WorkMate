import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { updatePortfolioItemSchema } from '@/lib/validation/api';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiUnauthorized, apiForbidden, apiNotFound } from '@/lib/api/error-response';

type Params = Promise<{ itemId: string }>;

// DELETE /api/profile/portfolio/[itemId] — deletes item (owner only)
async function deleteHandler(_request: NextRequest, { params }: { params: Params }) {
  const { itemId } = await params;

  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  const service = getSupabaseServiceClient();

  // Verify ownership before delete
  const { data: existing } = await service
    .from('portfolio_items')
    .select('id, provider_id')
    .eq('id', itemId)
    .maybeSingle();

  if (!existing) {
    return apiNotFound('Item not found');
  }
  if (existing.provider_id !== user.id) {
    return apiForbidden();
  }

  const { error } = await service
    .from('portfolio_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    return apiError(error.message, 400);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

// PATCH /api/profile/portfolio/[itemId] — update title/description/display_order
async function patchHandler(request: NextRequest, { params }: { params: Params }) {
  const { itemId } = await params;

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

  const parsed = updatePortfolioItemSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiError('Validation failed', 400);
  }

  const service = getSupabaseServiceClient();

  // Verify ownership before update
  const { data: existing } = await service
    .from('portfolio_items')
    .select('id, provider_id')
    .eq('id', itemId)
    .maybeSingle();

  if (!existing) {
    return apiNotFound('Item not found');
  }
  if (existing.provider_id !== user.id) {
    return apiForbidden();
  }

  const { data: item, error: updateError } = await service
    .from('portfolio_items')
    .update(parsed.data)
    .eq('id', itemId)
    .select('id, title, description, image_url, display_order, created_at')
    .single();

  if (updateError) {
    return apiError(updateError.message, 400);
  }

  return NextResponse.json({ item }, { status: 200 });
}

export const PATCH = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, patchHandler);

export const DELETE = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, deleteHandler);
