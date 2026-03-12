import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminRoute } from '@/lib/auth/admin';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { bulkReviewRiskSchema } from '@/lib/validation/api';
import { logAdminAudit } from '@/lib/admin/audit';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiServerError } from '@/lib/api/error-response';

// GET /api/admin/risk
// Returns all providers with risk_score > 0, ordered by risk_score DESC.
// Optional query param: ?unreviewed=true — only return profiles with risk_reviewed_at IS NULL.
async function getHandler(request: NextRequest) {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const unreviewedOnly = searchParams.get('unreviewed') === 'true';

  const svc = getSupabaseServiceClient();

  let query = svc
    .from('profiles')
    .select('id,full_name,email,risk_score,risk_flags,risk_reviewed_at,verification_status')
    .gt('risk_score', 0)
    .order('risk_score', { ascending: false });

  if (unreviewedOnly) {
    query = query.is('risk_reviewed_at', null);
  }

  const { data, error } = await query;

  if (error) return apiServerError(error.message);

  return NextResponse.json({ providers: data ?? [] });
}

export const GET = withRateLimit(RATE_LIMITS.ADMIN_READ, getHandler);

// PATCH /api/admin/risk
// Bulk mark-as-reviewed: sets risk_reviewed_at = now() for all given profile IDs.
// Body: { profile_ids: string[] }
async function patchHandler(request: NextRequest) {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = bulkReviewRiskSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiError('Validation failed', 400);
  }

  const { profile_ids } = parsed.data;
  const svc = getSupabaseServiceClient();

  const { error: updateError } = await svc
    .from('profiles')
    .update({ risk_reviewed_at: new Date().toISOString() })
    .in('id', profile_ids)
    .gt('risk_score', 0);

  if (updateError) {
    return apiError(updateError.message, 400);
  }

  await logAdminAudit({
    adminUserId: auth.user?.id ?? null,
    adminEmail: auth.user?.email ?? null,
    action: 'bulk_risk_mark_reviewed',
    targetType: 'risk_assessment',
    details: {
      profile_ids,
      count: profile_ids.length,
    },
  });

  return NextResponse.json({ updated: profile_ids.length });
}

export const PATCH = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, patchHandler);
