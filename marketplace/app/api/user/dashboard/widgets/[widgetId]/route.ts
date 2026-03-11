import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { getUserRoles } from '@/lib/auth/rbac';
import { isModeAllowedForRoles, isWidgetAllowedForMode, normalizeDashboardMode } from '@/lib/dashboard/widgets';
import { patchDashboardWidgetSchema } from '@/lib/validation/api';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiUnauthorized, apiForbidden, apiNotFound, apiServerError } from '@/lib/api/error-response';

async function resolveContext(request: NextRequest) {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: apiUnauthorized() };
  }

  const roles = await getUserRoles(supabase, user.id);
  const mode = normalizeDashboardMode(request.nextUrl.searchParams.get('mode'));
  if (!isModeAllowedForRoles(mode, roles)) {
    return { error: apiForbidden() };
  }

  return { user, mode };
}

async function patchHandler(
  request: NextRequest,
  { params }: { params: Promise<{ widgetId: string }> }
) {
  const { widgetId } = await params;
  const context = await resolveContext(request);
  if ('error' in context) return context.error;

  const service = getSupabaseServiceClient();
  const { data: existing, error: existingError } = await service
    .from('dashboard_widgets')
    .select('id,user_id,widget_type')
    .eq('id', widgetId)
    .eq('user_id', context.user.id)
    .maybeSingle();

  if (existingError) {
    return apiServerError(existingError.message);
  }
  if (!existing) {
    return apiNotFound('Widget not found');
  }
  if (!isWidgetAllowedForMode(context.mode, existing.widget_type)) {
    return apiError('Widget does not belong to this dashboard mode.', 400);
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = patchDashboardWidgetSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiError('Validation failed', 400);
  }

  const patch: Record<string, unknown> = {};
  if (parsed.data.position) patch.position = parsed.data.position;
  if (parsed.data.settings) patch.settings = parsed.data.settings;

  const { data, error } = await service
    .from('dashboard_widgets')
    .update(patch)
    .eq('id', widgetId)
    .eq('user_id', context.user.id)
    .select('id,user_id,widget_type,position,settings,created_at')
    .single();

  if (error) {
    return apiError(error.message, 400);
  }

  return NextResponse.json({ widget: data }, { status: 200 });
}

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ widgetId: string }> }
) {
  const { widgetId } = await params;
  const context = await resolveContext(request);
  if ('error' in context) return context.error;

  const service = getSupabaseServiceClient();
  const { data: existing, error: existingError } = await service
    .from('dashboard_widgets')
    .select('id,user_id,widget_type')
    .eq('id', widgetId)
    .eq('user_id', context.user.id)
    .maybeSingle();

  if (existingError) {
    return apiServerError(existingError.message);
  }
  if (!existing) {
    return apiNotFound('Widget not found');
  }
  if (!isWidgetAllowedForMode(context.mode, existing.widget_type)) {
    return apiError('Widget does not belong to this dashboard mode.', 400);
  }

  const { error } = await service
    .from('dashboard_widgets')
    .delete()
    .eq('id', widgetId)
    .eq('user_id', context.user.id);

  if (error) {
    return apiError(error.message, 400);
  }

  return NextResponse.json({ success: true }, { status: 200 });
}

export const PATCH = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, patchHandler);

export const DELETE = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, deleteHandler);
