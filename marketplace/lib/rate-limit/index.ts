// ── Sliding window rate limiter with pluggable store ─────────────────────────
//
// Store selection (automatic at module init):
//   1. Upstash Redis REST  — if UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
//   2. @vercel/kv          — if VERCEL_KV is available (future, add import below)
//   3. In-memory fallback  — development / no KV configured (NOT suitable for production
//                            with multiple Vercel instances — brute force protection fails)
//
// To enable Upstash:
//   1. Create a Redis database at https://upstash.com (free tier is sufficient for launch)
//   2. Copy the REST URL and REST Token from the Upstash dashboard
//   3. Add to Vercel env:
//        UPSTASH_REDIS_REST_URL=https://xyz.upstash.io
//        UPSTASH_REDIS_REST_TOKEN=AXxx...
//   4. That's it — no code changes needed, the store auto-selects.

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

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

// ── Store adapter interface ──────────────────────────────────────────────────

export interface RateLimitStore {
  get(key: string): Promise<StoreEntry | null>;
  set(key: string, entry: StoreEntry, ttlMs: number): Promise<void>;
}

// ── In-memory store (fallback for development) ───────────────────────────────

const memoryMap = new Map<string, StoreEntry>();

const inMemoryStore: RateLimitStore = {
  async get(key: string): Promise<StoreEntry | null> {
    const entry = memoryMap.get(key);
    if (!entry) return null;
    if (entry.resetAt <= Date.now()) {
      memoryMap.delete(key);
      return null;
    }
    return entry;
  },
  async set(key: string, entry: StoreEntry): Promise<void> {
    memoryMap.set(key, entry);
  },
};

// Periodic cleanup to prevent unbounded memory growth in dev
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of memoryMap.entries()) {
      if (value.resetAt < now) memoryMap.delete(key);
    }
  }, 300_000);
}

// ── Upstash Redis REST store ─────────────────────────────────────────────────
// Uses the Upstash HTTP API — no additional packages required.
// Docs: https://upstash.com/docs/redis/features/restapi

class UpstashStore implements RateLimitStore {
  private baseUrl: string;
  private token: string;

  constructor(url: string, token: string) {
    this.baseUrl = url.replace(/\/$/, '');
    this.token = token;
  }

  private async call<T>(command: string[]): Promise<T> {
    const res = await fetch(`${this.baseUrl}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    });
    if (!res.ok) throw new Error(`Upstash error: ${res.status}`);
    const json = (await res.json()) as { result: T };
    return json.result;
  }

  async get(key: string): Promise<StoreEntry | null> {
    try {
      const raw = await this.call<string | null>(['GET', key]);
      if (!raw) return null;
      return JSON.parse(raw) as StoreEntry;
    } catch {
      return null; // Degrade gracefully — allow request on KV error
    }
  }

  async set(key: string, entry: StoreEntry, ttlMs: number): Promise<void> {
    try {
      const ttlSeconds = Math.ceil(ttlMs / 1000);
      // SET key value EX ttl
      await this.call<string>(['SET', key, JSON.stringify(entry), 'EX', String(ttlSeconds)]);
    } catch {
      // Degrade gracefully — don't throw on KV write error
    }
  }
}

// ── Active store selection ────────────────────────────────────────────────────

function buildActiveStore(): RateLimitStore {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[rate-limit] Using Upstash Redis distributed store');
    }
    return new UpstashStore(url, token);
  }

  if (process.env.NODE_ENV === 'production') {
    // Warn operators that rate limiting is in-memory — less effective on multi-instance
     
    console.warn(
      '[rate-limit] WARNING: Using in-memory store in production. ' +
        'Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN for distributed rate limiting.'
    );
  }

  return inMemoryStore;
}

const activeStore: RateLimitStore = buildActiveStore();

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
  /** 60 requests per minute — for admin dashboard GET requests */
  ADMIN_READ: { windowMs: 60_000, max: 60, keyPrefix: 'admin-read' } satisfies RateLimitConfig,
} as const;

// ── Core rate limit function (async) ─────────────────────────────────────────

export function rateLimit(config: RateLimitConfig) {
  return async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
    const now = Date.now();
    const key = `${config.keyPrefix}:${identifier}`;

    const existing = await activeStore.get(key);

    // No existing entry, or the window has expired — start a fresh window
    if (!existing || existing.resetAt <= now) {
      const resetAt = now + config.windowMs;
      await activeStore.set(key, { count: 1, resetAt }, config.windowMs);
      return { allowed: true, remaining: config.max - 1, resetAt };
    }

    // Window is active — check against max
    if (existing.count >= config.max) {
      return { allowed: false, remaining: 0, resetAt: existing.resetAt };
    }

    const updated = { count: existing.count + 1, resetAt: existing.resetAt };
    await activeStore.set(key, updated, existing.resetAt - now);
    return {
      allowed: true,
      remaining: config.max - updated.count,
      resetAt: existing.resetAt,
    };
  };
}
