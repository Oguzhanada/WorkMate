import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { canAccessAdmin, getUserRoles } from '@/lib/auth/rbac';
import { patchFeatureFlagSchema } from '@/lib/validation/api';
import { logAdminAudit } from '@/lib/admin/audit';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';

// GET /api/admin/feature-flags — list all flags
export async function GET() {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = await getUserRoles(supabase, user.id);
  if (!canAccessAdmin(roles)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const service = getSupabaseServiceClient();
  const { data, error } = await service
    .from('feature_flags')
    .select('id,flag_key,description,enabled,enabled_for_roles,updated_at')
    .order('flag_key', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ flags: data ?? [] });
}

// PATCH /api/admin/feature-flags — toggle a flag
async function patchHandler(request: NextRequest) {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = await getUserRoles(supabase, user.id);
  if (!canAccessAdmin(roles)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = patchFeatureFlagSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const service = getSupabaseServiceClient();
  const { data: updated, error: updateError } = await service
    .from('feature_flags')
    .update({ enabled: parsed.data.enabled })
    .eq('flag_key', parsed.data.flag_key)
    .select('id,flag_key,enabled,updated_at')
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  await logAdminAudit({
    adminUserId: user.id,
    adminEmail: user.email ?? null,
    action: 'update_feature_flag',
    targetType: 'feature_flag',
    targetLabel: parsed.data.flag_key,
    details: {
      flag_key: parsed.data.flag_key,
      new_enabled: parsed.data.enabled,
    },
  });

  return NextResponse.json({ flag: updated });
}

export const PATCH = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, patchHandler);
