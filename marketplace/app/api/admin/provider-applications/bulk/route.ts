import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminRoute } from '@/lib/auth/admin';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { logAdminAudit } from '@/lib/admin/audit';
import { bulkNotificationSchema } from '@/lib/validation/api';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError } from '@/lib/api/error-response';

async function postHandler(request: NextRequest) {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = bulkNotificationSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiError('Validation failed', 400);
  }

  const { profile_ids, message, type } = parsed.data;
  const serviceSupabase = getSupabaseServiceClient();
  const now = new Date().toISOString();

  const rows = profile_ids.map((profileId) => ({
    user_id: profileId,
    type,
    payload: {
      message,
      reviewed_at: now,
      sent_by: auth.user?.id ?? null,
      sent_by_email: auth.user?.email ?? null,
    },
  }));

  const { error } = await serviceSupabase.from('notifications').insert(rows);
  if (error) {
    return apiError(error.message, 400);
  }

  await logAdminAudit({
    adminUserId: auth.user?.id ?? null,
    adminEmail: auth.user?.email ?? null,
    action: 'bulk_notification_sent',
    targetType: 'bulk_notification',
    details: {
      count: rows.length,
      message,
      target_profile_ids: profile_ids,
    },
  });

  return NextResponse.json({ ok: true, count: rows.length });
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
