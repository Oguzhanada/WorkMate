import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ensureAdminRoute } from '@/lib/auth/admin';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { logAdminAudit } from '@/lib/admin/audit';

const bulkNotificationSchema = z.object({
  profile_ids: z.array(z.string().uuid()).min(1).max(200),
  message: z.string().trim().min(2).max(300),
  type: z.enum(['admin_bulk_notice', 'admin_verification_update']).optional().default('admin_bulk_notice'),
});

export async function POST(request: NextRequest) {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = bulkNotificationSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
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
    return NextResponse.json({ error: error.message }, { status: 400 });
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
