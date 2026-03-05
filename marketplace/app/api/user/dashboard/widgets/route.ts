import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { getUserRoles } from '@/lib/auth/rbac';
import {
  getAllowedWidgetTypes,
  getDefaultWidgets,
  isModeAllowedForRoles,
  isWidgetAllowedForMode,
  normalizeDashboardMode,
  type DashboardMode,
} from '@/lib/dashboard/widgets';
import { createDashboardWidgetSchema } from '@/lib/validation/api';

type Row = {
  id: string;
  user_id: string;
  widget_type: string;
  position: unknown;
  settings: unknown;
  created_at: string;
};

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

async function ensureDefaultWidgets(userId: string, mode: DashboardMode) {
  const service = getSupabaseServiceClient();
  const allowed = getAllowedWidgetTypes(mode);

  const { data: existing } = await service
    .from('dashboard_widgets')
    .select('id,widget_type')
    .eq('user_id', userId);

  const hasAllowed = (existing ?? []).some((row) => allowed.includes(row.widget_type as never));
  if (hasAllowed) return;

  const defaults = getDefaultWidgets(mode);
  const { error } = await service.from('dashboard_widgets').upsert(
    defaults.map((item) => ({
      user_id: userId,
      widget_type: item.widget_type,
      position: item.position,
      settings: item.settings,
    })),
    { onConflict: 'user_id,widget_type' }
  );

  if (error) {
    throw error;
  }
}

export async function GET(request: NextRequest) {
  const context = await resolveContext(request);
  if ('error' in context) return context.error;

  try {
    await ensureDefaultWidgets(context.user.id, context.mode);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Defaults could not be initialized.';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const supabase = await getSupabaseRouteClient();
  const { data, error } = await supabase
    .from('dashboard_widgets')
    .select('id,user_id,widget_type,position,settings,created_at')
    .eq('user_id', context.user.id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const widgets = ((data ?? []) as Row[]).filter((row) => isWidgetAllowedForMode(context.mode, row.widget_type));
  return NextResponse.json({ widgets, mode: context.mode }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const context = await resolveContext(request);
  if ('error' in context) return context.error;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const rawList = Array.isArray((rawBody as { widgets?: unknown[] })?.widgets)
    ? ((rawBody as { widgets: unknown[] }).widgets ?? [])
    : [rawBody];

  const parsedList = rawList.map((entry) => createDashboardWidgetSchema.safeParse(entry));
  const failed = parsedList.find((entry) => !entry.success);
  if (failed && !failed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: failed.error.flatten() },
      { status: 400 }
    );
  }

  const payloads = parsedList.map((entry) => (entry as { success: true; data: { widget_type: string; position?: unknown; settings?: unknown } }).data);

  for (const payload of payloads) {
    if (!isWidgetAllowedForMode(context.mode, payload.widget_type)) {
      return NextResponse.json(
        { error: `${payload.widget_type} is not allowed for ${context.mode} dashboard.` },
        { status: 400 }
      );
    }
  }

  const service = getSupabaseServiceClient();
  const { data, error } = await service
    .from('dashboard_widgets')
    .upsert(
      payloads.map((payload, index) => ({
        user_id: context.user.id,
        widget_type: payload.widget_type,
        position: payload.position ?? { x: 0, y: index, w: 6, h: 2 },
        settings: payload.settings ?? {},
      })),
      { onConflict: 'user_id,widget_type' }
    )
    .select('id,user_id,widget_type,position,settings,created_at');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const widgets = ((data ?? []) as Row[]).filter((row) => isWidgetAllowedForMode(context.mode, row.widget_type));
  return NextResponse.json({ widgets }, { status: 200 });
}
