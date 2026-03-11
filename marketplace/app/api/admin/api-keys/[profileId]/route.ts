import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminRoute } from '@/lib/auth/admin';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { patchApiKeyRateLimitSchema } from '@/lib/validation/api';
import { logAdminAudit } from '@/lib/admin/audit';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiNotFound } from '@/lib/api/error-response';

async function patchHandler(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  const { profileId } = await params;
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = patchApiKeyRateLimitSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiError('Validation failed', 400);
  }

  const svc = getSupabaseServiceClient();
  const { data, error } = await svc
    .from('profiles')
    .update({ api_rate_limit: parsed.data.api_rate_limit })
    .eq('id', profileId)
    .select('id,api_rate_limit')
    .maybeSingle();

  if (error) return apiError(error.message, 400);
  if (!data) return apiNotFound('Profile not found');

  await logAdminAudit({
    adminUserId: auth.user?.id ?? null,
    adminEmail: auth.user?.email ?? null,
    action: 'update_api_rate_limit',
    targetType: 'api_key',
    targetProfileId: profileId,
    details: {
      new_rate_limit: parsed.data.api_rate_limit,
    },
  });

  return NextResponse.json({ profile: data }, { status: 200 });
}

export const PATCH = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, patchHandler);
