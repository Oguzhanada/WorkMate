import { getSupabaseServiceClient } from '@/lib/supabase/service';

export type SendNotificationParams = {
  userId: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
};

/**
 * Fire-and-forget helper to insert a notification row.
 * Uses the service role client so it bypasses RLS INSERT restriction.
 * Errors are swallowed — never let a notification failure break a user flow.
 */
export async function sendNotification(params: SendNotificationParams): Promise<void> {
  try {
    const supabase = getSupabaseServiceClient();
    const { userId, type, title, body, data } = params;
    const payload: Record<string, unknown> = { title, ...(body ? { body } : {}), ...(data ?? {}) };

    await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      body: body ?? null,
      data: data ?? {},
      // Keep legacy payload column in sync so the existing NotificationsInbox still works
      payload,
    });
  } catch (err) {
    console.error('[sendNotification] Failed to insert notification:', err);
  }
}
