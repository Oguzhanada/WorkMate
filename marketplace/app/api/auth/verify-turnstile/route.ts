import { NextRequest, NextResponse } from 'next/server';
import { verifyTurnstileToken } from '@/lib/cloudflare/turnstile';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';

/**
 * POST /api/auth/verify-turnstile
 *
 * Lightweight endpoint used by the SignUpForm (and other client-only flows)
 * to verify a Cloudflare Turnstile token before proceeding with a Supabase
 * Auth call that doesn't pass through our server.
 *
 * Body: { token: string }
 * Returns 200 { ok: true } on success, 403 on failure.
 */
async function handler(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const token =
    body !== null &&
    typeof body === 'object' &&
    'token' in body &&
    typeof (body as Record<string, unknown>).token === 'string'
      ? ((body as Record<string, unknown>).token as string)
      : null;

  const remoteip = request.headers.get('x-forwarded-for') ?? undefined;
  const result = await verifyTurnstileToken(token, remoteip);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Bot protection check failed. Please try again.' },
      { status: 403 }
    );
  }

  return NextResponse.json({ ok: true });
}

export const POST = withRateLimit(RATE_LIMITS.AUTH_STRICT, handler);
