import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { canAccessAdmin, getUserRoles } from '@/lib/auth/rbac';
import { patchFeatureFlagSchema } from '@/lib/validation/api';
import { logAdminAudit } from '@/lib/admin/audit';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiUnauthorized, apiForbidden, apiServerError } from '@/lib/api/error-response';

// GET /api/admin/feature-flags — list all flags
async function getHandler() {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  const roles = await getUserRoles(supabase, user.id);
  if (!canAccessAdmin(roles)) {
    return apiForbidden();
  }

  const service = getSupabaseServiceClient();
  const { data, error } = await service
    .from('feature_flags')
    .select('id,flag_key,description,enabled,enabled_for_roles,updated_at')
    .order('flag_key', { ascending: true });

  if (error) return apiServerError(error.message);

  return NextResponse.json({ flags: data ?? [] });
}

export const GET = withRateLimit(RATE_LIMITS.ADMIN_READ, getHandler);

// PATCH /api/admin/feature-flags — toggle a flag
async function patchHandler(request: NextRequest) {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  const roles = await getUserRoles(supabase, user.id);
  if (!canAccessAdmin(roles)) {
    return apiForbidden();
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = patchFeatureFlagSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiError('Validation failed', 400);
  }

  const service = getSupabaseServiceClient();
  const { data: updated, error: updateError } = await service
    .from('feature_flags')
    .update({ enabled: parsed.data.enabled })
    .eq('flag_key', parsed.data.flag_key)
    .select('id,flag_key,enabled,updated_at')
    .single();

  if (updateError) return apiError(updateError.message, 400);

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
