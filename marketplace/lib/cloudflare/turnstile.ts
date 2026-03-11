/**
 * Cloudflare Turnstile — server-side token verification
 *
 * Turnstile is a privacy-preserving bot protection alternative to CAPTCHA.
 * It replaces reCAPTCHA/hCaptcha with a frictionless challenge.
 *
 * Env vars:
 *   TURNSTILE_SECRET_KEY — from dash.cloudflare.com → Turnstile → your site
 *
 * In development (no key set): verification is skipped and returns true.
 * In production without a key: returns false (secure fail-closed).
 */

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export type TurnstileOutcome = { success: true } | { success: false; reason: string };

/**
 * Verify a Turnstile token submitted from the browser.
 * Call this inside any API route that renders a Turnstile widget.
 *
 * @param token  - The `cf-turnstile-response` value from the client form.
 * @param remoteip - Optional client IP for enhanced logging (omit if unknown).
 */
export async function verifyTurnstileToken(
  token: string | undefined | null,
  remoteip?: string,
): Promise<TurnstileOutcome> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // Development shortcut: if no secret is configured, skip verification.
  if (!secret) {
    if (process.env.NODE_ENV !== 'production') {
      return { success: true };
    }
    return { success: false, reason: 'Turnstile secret key not configured.' };
  }

  if (!token) {
    return { success: false, reason: 'Missing Turnstile token.' };
  }

  const params = new URLSearchParams({ secret, response: token });
  if (remoteip) params.set('remoteip', remoteip);

  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      body: params,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (!res.ok) {
      return { success: false, reason: `Turnstile API error: ${res.status}` };
    }

    const data = (await res.json()) as { success: boolean; 'error-codes'?: string[] };

    if (data.success) return { success: true };

    const codes = data['error-codes']?.join(', ') ?? 'unknown';
    return { success: false, reason: `Turnstile challenge failed: ${codes}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error';
    return { success: false, reason: `Turnstile verification error: ${msg}` };
  }
}
