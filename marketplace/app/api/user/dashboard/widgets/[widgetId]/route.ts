import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { getUserRoles } from '@/lib/auth/rbac';
import { isModeAllowedForRoles, isWidgetAllowedForMode, normalizeDashboardMode } from '@/lib/dashboard/widgets';
import { patchDashboardWidgetSchema } from '@/lib/validation/api';

async function resolveContext(request: NextRequest) {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const roles = await getUserRoles(supabase, user.id);
  const mode = normalizeDashboardMode(request.nextUrl.searchParams.get('mode'));
  if (!isModeAllowedForRoles(mode, roles)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { user, mode };
}

export async function PATCH(
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
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
  }
  if (!isWidgetAllowedForMode(context.mode, existing.widget_type)) {
    return NextResponse.json({ error: 'Widget does not belong to this dashboard mode.' }, { status: 400 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = patchDashboardWidgetSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
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
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ widget: data }, { status: 200 });
}

export async function DELETE(
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
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
  }
  if (!isWidgetAllowedForMode(context.mode, existing.widget_type)) {
    return NextResponse.json({ error: 'Widget does not belong to this dashboard mode.' }, { status: 400 });
  }

  const { error } = await service
    .from('dashboard_widgets')
    .delete()
    .eq('id', widgetId)
    .eq('user_id', context.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
