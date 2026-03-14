// ── Cache layer with pluggable store ─────────────────────────────────────────
//
// Store selection (automatic at module init):
//   1. Upstash Redis REST  — if UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set
//   2. In-memory fallback  — development / no KV configured
//
// API:
//   cacheGet<T>(key, fetcher, ttlSeconds) → Promise<T>
//   Cache-aside pattern: return cached value if present, otherwise call fetcher,
//   store the result, and return it.

// ── In-memory fallback store ──────────────────────────────────────────────────

type MemoryEntry = {
  value: unknown;
  expiresAt: number;
};

const memoryCache = new Map<string, MemoryEntry>();

// Periodic cleanup to prevent unbounded memory growth in dev
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryCache.entries()) {
      if (entry.expiresAt < now) memoryCache.delete(key);
    }
  }, 300_000);
}

// ── Upstash Redis REST helpers ────────────────────────────────────────────────
// Uses the Upstash HTTP API — no additional packages required.
// Docs: https://upstash.com/docs/redis/features/restapi

function buildUpstashHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function upstashGet(
  baseUrl: string,
  token: string,
  key: string
): Promise<string | null> {
  const res = await fetch(`${baseUrl}`, {
    method: 'POST',
    headers: buildUpstashHeaders(token),
    body: JSON.stringify(['GET', key]),
  });
  if (!res.ok) throw new Error(`Upstash GET error: ${res.status}`);
  const json = (await res.json()) as { result: string | null };
  return json.result;
}

async function upstashSet(
  baseUrl: string,
  token: string,
  key: string,
  value: string,
  ttlSeconds: number
): Promise<void> {
  const res = await fetch(`${baseUrl}`, {
    method: 'POST',
    headers: buildUpstashHeaders(token),
    body: JSON.stringify(['SET', key, value, 'EX', String(ttlSeconds)]),
  });
  if (!res.ok) throw new Error(`Upstash SET error: ${res.status}`);
}

// ── Store detection ───────────────────────────────────────────────────────────

type CacheStore = 'upstash' | 'memory';

function detectStore(): CacheStore {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return 'upstash';

  if (process.env.NODE_ENV === 'production') {
    console.warn(
      '[cache] WARNING: Using in-memory cache store in production. ' +
        'Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN for distributed caching.'
    );
  }
  return 'memory';
}

const activeStore: CacheStore = detectStore();

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Cache-aside helper.
 *
 * Returns the cached value for `key` if it exists and has not expired.
 * Otherwise calls `fetcher`, caches the result for `ttlSeconds`, and returns it.
 *
 * On any cache read/write error the fetcher result is still returned — the
 * cache layer degrades gracefully and never blocks the caller.
 *
 * @param key        Cache key (should be unique per logical resource)
 * @param fetcher    Async function that produces the value on a cache miss
 * @param ttlSeconds How long to keep the value in the cache (seconds)
 */
export async function cacheGet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? '';
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? '';

  // ── Try read from active store ──────────────────────────────────────────────
  if (activeStore === 'upstash') {
    try {
      const raw = await upstashGet(url, token, key);
      if (raw !== null) {
        return JSON.parse(raw) as T;
      }
    } catch {
      // Degrade gracefully — fall through to fetcher
    }
  } else {
    const entry = memoryCache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.value as T;
    }
  }

  // ── Cache miss: call fetcher ────────────────────────────────────────────────
  const value = await fetcher();

  // ── Write to active store (best-effort) ────────────────────────────────────
  if (activeStore === 'upstash') {
    try {
      await upstashSet(url, token, key, JSON.stringify(value), ttlSeconds);
    } catch {
      // Degrade gracefully — don't throw on cache write error
    }
  } else {
    memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  return value;
}
