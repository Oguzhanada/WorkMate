'use client';

// ─── Funnel Telemetry ─────────────────────────────────────────────────────────
// Fire-and-forget step tracking for job_posting, provider_onboarding, booking.
// Never stores PII — metadata accepts IDs and non-personal scalars only.

export const FUNNEL_JOB_POSTING        = 'job_posting'        as const;
export const FUNNEL_PROVIDER_ONBOARDING = 'provider_onboarding' as const;
export const FUNNEL_BOOKING            = 'booking'            as const;

export type FunnelName =
  | typeof FUNNEL_JOB_POSTING
  | typeof FUNNEL_PROVIDER_ONBOARDING
  | typeof FUNNEL_BOOKING;

const SESSION_STORAGE_KEY = 'wm_session_id';

function getOrCreateSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    const id = `${Date.now().toString(36)}-${hex}`;
    sessionStorage.setItem(SESSION_STORAGE_KEY, id);
    return id;
  } catch {
    // sessionStorage unavailable (SSR guard, private browsing edge cases)
    return 'fallback';
  }
}

export interface TrackFunnelStepParams {
  funnelName: FunnelName;
  stepName: string;
  stepNumber: number;
  metadata?: Record<string, string | number | boolean>;
}

/**
 * trackFunnelStep — fire-and-forget. Never throws, never blocks UI.
 * Call at each step transition to record funnel progression.
 */
export function trackFunnelStep(params: TrackFunnelStepParams): void {
  const { funnelName, stepName, stepNumber, metadata } = params;
  const sessionId = getOrCreateSessionId();

  // Fire and forget — intentionally not awaited
  fetch('/api/analytics/funnel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      funnel_name: funnelName,
      step_name: stepName,
      step_number: stepNumber,
      session_id: sessionId,
      metadata: metadata ?? {},
    }),
  }).catch(() => {
    // Telemetry failures must never surface to the user
  });
}
