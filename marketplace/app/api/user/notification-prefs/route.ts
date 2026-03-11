/**
 * GET  /api/user/notification-prefs  — fetch user's notification preferences from metadata
 * POST /api/user/notification-prefs  — update preferences (stored in auth.users metadata)
 *
 * Preferences are stored as JSON in auth.users.raw_user_meta_data under the key
 * "notification_prefs" to avoid a dedicated DB table.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { apiError, apiUnauthorized, apiServerError } from '@/lib/api/error-response';

const prefsSchema = z.object({
  email_new_quote: z.boolean(),
  email_quote_accepted: z.boolean(),
  email_payment_released: z.boolean(),
  email_job_approved: z.boolean(),
  email_task_alert_match: z.boolean(),
  email_review_received: z.boolean(),
  email_marketing: z.boolean(),
});

export type NotificationPrefs = z.infer<typeof prefsSchema>;

const DEFAULT_PREFS: NotificationPrefs = {
  email_new_quote: true,
  email_quote_accepted: true,
  email_payment_released: true,
  email_job_approved: true,
  email_task_alert_match: true,
  email_review_received: true,
  email_marketing: false,
};

export async function GET() {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return apiUnauthorized();

  const stored = (user.user_metadata?.notification_prefs ?? {}) as Partial<NotificationPrefs>;
  const prefs: NotificationPrefs = { ...DEFAULT_PREFS, ...stored };

  return NextResponse.json({ prefs });
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return apiUnauthorized();

  const body: unknown = await request.json().catch(() => null);
  const parsed = prefsSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('Invalid preferences data', 400);
  }

  const service = await getSupabaseServiceClient();
  const { error } = await service.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      notification_prefs: parsed.data,
    },
  });

  if (error) {
    return apiServerError('Failed to save preferences');
  }

  return NextResponse.json({ ok: true });
}
