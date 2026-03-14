import { createHmac } from 'crypto';
import { getSupabaseServiceClient } from '@/lib/supabase/service';

// ── Types ──────────────────────────────────────────────────────────────────

export type WebhookEvent =
  | 'job.created'
  | 'quote.accepted'
  | 'payment.completed'
  | 'provider.approved'
  | 'document.verified'
  | 'document.rejected';

// ── HMAC signature ─────────────────────────────────────────────────────────

function buildSignature(secret: string, body: string, timestamp: string): string {
  return createHmac('sha256', secret)
    .update(`${timestamp}.${body}`)
    .digest('hex');
}

// ── Delivery ───────────────────────────────────────────────────────────────

async function deliverWebhook(
  url: string,
  secret: string,
  event: string,
  payload: Record<string, unknown>,
  requestId?: string
): Promise<void> {
  // Only deliver to HTTPS endpoints
  if (!url.startsWith('https://')) {
    console.warn(`[webhook] Skipping non-HTTPS URL: ${url}`);
    return;
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const body = JSON.stringify({ event, data: payload, timestamp: Number(timestamp) });
  const signature = buildSignature(secret, body, timestamp);
  const resolvedRequestId = requestId ?? crypto.randomUUID();

  const attemptDelays = [0, 1_000, 3_000];
  for (let attempt = 0; attempt < attemptDelays.length; attempt++) {
    if (attemptDelays[attempt] > 0) {
      await new Promise((resolve) => setTimeout(resolve, attemptDelays[attempt]));
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WorkMate-Event': event,
          'X-WorkMate-Timestamp': timestamp,
          'X-WorkMate-Signature': `sha256=${signature}`,
          'X-Request-Id': resolvedRequestId,
        },
        body,
        signal: AbortSignal.timeout(10_000), // 10s timeout
      });

      if (response.ok) return;

      const isRetriable = response.status >= 500 || response.status === 429;
      if (!isRetriable || attempt === attemptDelays.length - 1) {
        console.warn(`[webhook] Delivery failed for ${url}: HTTP ${response.status}`);
        return;
      }
    } catch {
      if (attempt === attemptDelays.length - 1) {
        console.warn(`[webhook] Delivery failed for ${url}: network error`);
        return;
      }
    }
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Sends an event to all matching active webhook subscriptions.
 * Non-blocking — catches all errors so it never disrupts the calling route.
 *
 * @param requestId - Optional correlation ID from the originating HTTP request.
 *   Forwarded as `X-Request-Id` on every outgoing delivery so recipients can
 *   correlate webhook calls back to the triggering request. A new UUID is
 *   generated per delivery when omitted.
 */
export async function sendWebhookEvent(
  event: WebhookEvent,
  payload: Record<string, unknown>,
  requestId?: string
): Promise<void> {
  try {
    const svc = getSupabaseServiceClient();

    // Find all enabled subscriptions that include this event type
    const { data: subs, error } = await svc
      .from('webhook_subscriptions')
      .select('id, url, secret')
      .eq('enabled', true)
      .contains('events', [event]);

    if (error || !subs || subs.length === 0) return;

    // Fire all deliveries in parallel — best effort, non-blocking
    await Promise.allSettled(
      subs.map((sub) => deliverWebhook(sub.url, sub.secret, event, payload, requestId))
    );
  } catch {
    // Non-blocking: webhook failures must not disrupt the calling API route
  }
}
