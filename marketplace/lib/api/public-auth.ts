import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service';

// ── In-memory rate limiter ─────────────────────────────────────────────────
// Best-effort per serverless container. For distributed rate limiting, use
// Vercel KV / Redis in production.
const rateLimitStore = new Map<string, { count: number; day: string }>();

function checkRateLimit(keyHash: string, limit: number): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const current = rateLimitStore.get(keyHash);

  if (!current || current.day !== today) {
    rateLimitStore.set(keyHash, { count: 1, day: today });
    return true;
  }

  if (current.count >= limit) return false;

  current.count++;
  return true;
}

// SHA-256 is appropriate here: API keys are high-entropy random strings (not
// user-chosen passwords), so a fast hash suffices for lookup. bcrypt/scrypt
// would add latency without meaningful security benefit.
export function hashApiKey(plaintext: string): string {
  return createHash('sha256').update(plaintext).digest('hex');
}

// ── Auth result type ───────────────────────────────────────────────────────

export type PublicAuthResult =
  | { profileId: string; error: null }
  | { profileId: null; error: NextResponse };

// ── Main authenticator ─────────────────────────────────────────────────────

/**
 * Validates `x-api-key` header and enforces per-key daily rate limits.
 * The plaintext key is hashed (SHA-256) before DB lookup — never stored raw.
 * Used by all `/api/public/v1/*` route handlers.
 */
export async function authenticatePublicRequest(
  request: Request
): Promise<PublicAuthResult> {
  const apiKey = request.headers.get('x-api-key');

  if (!apiKey) {
    return {
      profileId: null,
      error: NextResponse.json(
        { error: 'Missing x-api-key header. See /docs/api for authentication instructions.' },
        { status: 401 }
      ),
    };
  }

  const keyHash = hashApiKey(apiKey);

  const svc = getSupabaseServiceClient();
  const { data: profile, error } = await svc
    .from('profiles')
    .select('id, api_rate_limit')
    .eq('api_key_hash', keyHash)
    .maybeSingle();

  if (error || !profile) {
    return {
      profileId: null,
      error: NextResponse.json({ error: 'Invalid API key.' }, { status: 401 }),
    };
  }

  const allowed = checkRateLimit(keyHash, profile.api_rate_limit ?? 1000);
  if (!allowed) {
    return {
      profileId: null,
      error: NextResponse.json(
        {
          error: 'Rate limit exceeded.',
          limit: profile.api_rate_limit,
          resets: 'midnight UTC',
        },
        { status: 429 }
      ),
    };
  }

  return { profileId: profile.id, error: null };
}
