import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, type RateLimitConfig } from './index';

// Re-export RATE_LIMITS and types so routes only need one import
export { RATE_LIMITS } from './index';
export type { RateLimitConfig };

// ── Types ─────────────────────────────────────────────────────────────────────

type RouteHandler = (req: NextRequest, ctx?: unknown) => Promise<NextResponse> | NextResponse;

// ── Identifier extraction ─────────────────────────────────────────────────────
// Priority order:
//   1. x-api-key header (public API consumers — keyed by the API key value itself)
//   2. x-workmate-user-id header (set by internal middleware after session resolve)
//   3. x-forwarded-for (first IP in the proxy chain, typical for Vercel)
//   4. x-real-ip (fallback from some reverse proxies)
//   5. 'anonymous' (last resort — all unauthenticated requests share this bucket)

function extractIdentifier(req: NextRequest): string {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey && apiKey.trim().length > 0) return `apikey:${apiKey.trim()}`;

  const userId = req.headers.get('x-workmate-user-id');
  if (userId && userId.trim().length > 0) return `user:${userId.trim()}`;

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for may contain a comma-separated list; take the first (client) IP
    const clientIp = forwarded.split(',')[0]?.trim();
    if (clientIp) return `ip:${clientIp}`;
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp && realIp.trim().length > 0) return `ip:${realIp.trim()}`;

  return 'anonymous';
}

// ── Rate limit headers ────────────────────────────────────────────────────────

function applyRateLimitHeaders(
  response: NextResponse,
  config: RateLimitConfig,
  remaining: number,
  resetAt: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', String(config.max));
  response.headers.set('X-RateLimit-Remaining', String(Math.max(0, remaining)));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000))); // Unix seconds
  return response;
}

// ── withRateLimit wrapper ─────────────────────────────────────────────────────
/**
 * Wraps a Next.js API route handler with sliding-window rate limiting.
 *
 * Usage:
 *   export const POST = withRateLimit(RATE_LIMITS.AI_ENDPOINT, async (req) => { ... });
 *
 * When the limit is exceeded the wrapper returns 429 with a `Retry-After` header
 * and standard `X-RateLimit-*` headers. All allowed responses also receive the
 * `X-RateLimit-*` headers so clients can track their quota.
 *
 * The underlying store is async-capable (Upstash Redis when configured,
 * in-memory fallback otherwise).
 */
export function withRateLimit(config: RateLimitConfig, handler: RouteHandler): RouteHandler {
  const check = rateLimit(config);

  return async function rateLimitedHandler(req: NextRequest, ctx?: unknown): Promise<NextResponse> {
    const identifier = extractIdentifier(req);
    const { allowed, remaining, resetAt } = await check(identifier);

    if (!allowed) {
      const retryAfterSeconds = Math.ceil((resetAt - Date.now()) / 1000);
      const response = NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: retryAfterSeconds,
        },
        { status: 429 }
      );
      response.headers.set('Retry-After', String(retryAfterSeconds));
      applyRateLimitHeaders(response, config, 0, resetAt);
      return response;
    }

    // Call the underlying handler
    const response = (await handler(req, ctx)) as NextResponse;

    // Attach quota headers to the real response
    applyRateLimitHeaders(response, config, remaining, resetAt);
    return response;
  };
}
