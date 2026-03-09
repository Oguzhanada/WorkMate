// ── In-memory sliding window rate limiter ────────────────────────────────────
// Resets on server restart — acceptable for MVP. For distributed rate limiting
// across multiple serverless containers, replace the store with Vercel KV / Redis.

export type RateLimitConfig = {
  /** Duration of the window in milliseconds */
  windowMs: number;
  /** Maximum number of requests allowed per window */
  max: number;
  /** Prefix for the store key to avoid collisions between configs */
  keyPrefix: string;
};

type StoreEntry = {
  count: number;
  resetAt: number;
};

// Module-level store — shared across all calls within the same serverless container
const store = new Map<string, StoreEntry>();

// ── Predefined limit configurations ──────────────────────────────────────────

export const RATE_LIMITS = {
  /** 5 requests per minute — for AI generation endpoints (expensive, abuse-prone) */
  AI_ENDPOINT: { windowMs: 60_000, max: 5, keyPrefix: 'ai' } satisfies RateLimitConfig,
  /** 10 requests per 15 minutes — for API key creation / auth-sensitive operations */
  AUTH_ENDPOINT: { windowMs: 900_000, max: 10, keyPrefix: 'auth' } satisfies RateLimitConfig,
  /** 10 requests per minute — for login attempts */
  AUTH_LOGIN: { windowMs: 60_000, max: 10, keyPrefix: 'auth-login' } satisfies RateLimitConfig,
  /** 5 requests per minute — for registration, password reset, and other strict auth ops */
  AUTH_STRICT: { windowMs: 60_000, max: 5, keyPrefix: 'auth-strict' } satisfies RateLimitConfig,
  /** 30 requests per minute — for write operations (POST/PATCH/DELETE) */
  WRITE_ENDPOINT: { windowMs: 60_000, max: 30, keyPrefix: 'write' } satisfies RateLimitConfig,
  /** 100 requests per minute — for read operations */
  READ_ENDPOINT: { windowMs: 60_000, max: 100, keyPrefix: 'read' } satisfies RateLimitConfig,
  /** 20 requests per minute — for public API key consumers */
  PUBLIC_API: { windowMs: 60_000, max: 20, keyPrefix: 'pub' } satisfies RateLimitConfig,
} as const;

// ── Core rate limit function ──────────────────────────────────────────────────

export function rateLimit(config: RateLimitConfig) {
  return function checkRateLimit(identifier: string): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
  } {
    const now = Date.now();
    const key = `${config.keyPrefix}:${identifier}`;

    const existing = store.get(key);

    // No existing entry, or the window has expired — start a fresh window
    if (!existing || existing.resetAt <= now) {
      const resetAt = now + config.windowMs;
      store.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: config.max - 1, resetAt };
    }

    // Window is active — check against max
    if (existing.count >= config.max) {
      return { allowed: false, remaining: 0, resetAt: existing.resetAt };
    }

    existing.count++;
    return {
      allowed: true,
      remaining: config.max - existing.count,
      resetAt: existing.resetAt,
    };
  };
}

// ── Periodic cleanup — prevent unbounded memory growth ───────────────────────
// Runs every 5 minutes and removes entries whose window has already expired.

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of store.entries()) {
      if (value.resetAt < now) store.delete(key);
    }
  }, 300_000);
}
