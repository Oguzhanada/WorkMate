/**
 * Unified Service Health Checks
 * ─────────────────────────────────────────────────────────────
 * Checks external service connectivity with structured results,
 * 5s timeout per check, and 60s in-memory TTL cache.
 *
 * Respects LIVE_SERVICES_ENABLED — disabled services return
 * `disabled` status without making external calls.
 *
 * Cache uses an adapter-style interface for future KV migration.
 */

import { liveServices } from '../live-services';

// ── Types ───────────────────────────────────────────────────────────────────

export type ServiceStatus = 'healthy' | 'degraded' | 'down' | 'disabled';

export type HealthCheckResult = {
  name: string;
  status: ServiceStatus;
  latency_ms: number;
  message?: string;
  checked_at: string;
};

export type DetailedHealthResponse = {
  success: boolean;
  status: ServiceStatus;
  services: HealthCheckResult[];
  timestamp: string;
};

// ── Cache adapter (in-memory, future KV-ready) ─────────────────────────────

interface CacheAdapter {
  get(key: string): DetailedHealthResponse | null;
  set(key: string, value: DetailedHealthResponse, ttlMs: number): void;
}

const CACHE_TTL_MS = 60_000; // 60 seconds
const CACHE_KEY = 'health:detailed';

const memoryCache: { data: DetailedHealthResponse | null; expiresAt: number } = {
  data: null,
  expiresAt: 0,
};

const inMemoryCacheAdapter: CacheAdapter = {
  get(key: string): DetailedHealthResponse | null {
    if (key !== CACHE_KEY) return null;
    if (Date.now() > memoryCache.expiresAt) {
      memoryCache.data = null;
      return null;
    }
    return memoryCache.data;
  },
  set(key: string, value: DetailedHealthResponse, ttlMs: number): void {
    if (key !== CACHE_KEY) return;
    memoryCache.data = value;
    memoryCache.expiresAt = Date.now() + ttlMs;
  },
};

// Active cache adapter — swap this for KV when ready
const cache: CacheAdapter = inMemoryCacheAdapter;

// ── Timeout helper ──────────────────────────────────────────────────────────

const CHECK_TIMEOUT_MS = 5_000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Health check timed out')), timeoutMs)
    ),
  ]);
}

// ── Individual service checks ───────────────────────────────────────────────

async function checkSupabase(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const { getSupabaseServiceClient } = await import('../supabase/service');
    const supabase = getSupabaseServiceClient();
    const { error } = await withTimeout(
      supabase.from('profiles').select('id').limit(1),
      CHECK_TIMEOUT_MS
    );
    return {
      name: 'Supabase',
      status: error ? 'degraded' : 'healthy',
      latency_ms: Date.now() - start,
      message: error?.message,
      checked_at: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: 'Supabase',
      status: 'down',
      latency_ms: Date.now() - start,
      message: err instanceof Error ? err.message : 'Unknown error',
      checked_at: new Date().toISOString(),
    };
  }
}

async function checkStripe(): Promise<HealthCheckResult> {
  const start = Date.now();
  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) {
    return {
      name: 'Stripe',
      status: 'disabled',
      latency_ms: 0,
      message: 'STRIPE_SECRET_KEY not configured',
      checked_at: new Date().toISOString(),
    };
  }

  try {
    // Lightweight balance retrieval — minimal API call
    const res = await withTimeout(
      fetch('https://api.stripe.com/v1/balance', {
        headers: { Authorization: `Bearer ${key}` },
      }),
      CHECK_TIMEOUT_MS
    );
    return {
      name: 'Stripe',
      status: res.ok ? 'healthy' : 'degraded',
      latency_ms: Date.now() - start,
      message: res.ok ? undefined : `HTTP ${res.status}`,
      checked_at: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: 'Stripe',
      status: 'down',
      latency_ms: Date.now() - start,
      message: err instanceof Error ? err.message : 'Unknown error',
      checked_at: new Date().toISOString(),
    };
  }
}

async function checkResend(): Promise<HealthCheckResult> {
  const start = Date.now();

  if (!liveServices.email) {
    return {
      name: 'Resend',
      status: 'disabled',
      latency_ms: 0,
      message: 'Email service disabled in this environment',
      checked_at: new Date().toISOString(),
    };
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return {
      name: 'Resend',
      status: 'disabled',
      latency_ms: 0,
      message: 'RESEND_API_KEY not configured',
      checked_at: new Date().toISOString(),
    };
  }

  try {
    const res = await withTimeout(
      fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${key}` },
      }),
      CHECK_TIMEOUT_MS
    );
    return {
      name: 'Resend',
      status: res.ok ? 'healthy' : 'degraded',
      latency_ms: Date.now() - start,
      message: res.ok ? undefined : `HTTP ${res.status}`,
      checked_at: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: 'Resend',
      status: 'down',
      latency_ms: Date.now() - start,
      message: err instanceof Error ? err.message : 'Unknown error',
      checked_at: new Date().toISOString(),
    };
  }
}

async function checkAnthropic(): Promise<HealthCheckResult> {
  const start = Date.now();

  if (!liveServices.ai) {
    return {
      name: 'Anthropic',
      status: 'disabled',
      latency_ms: 0,
      message: 'AI service disabled in this environment',
      checked_at: new Date().toISOString(),
    };
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return {
      name: 'Anthropic',
      status: 'disabled',
      latency_ms: 0,
      message: 'ANTHROPIC_API_KEY not configured',
      checked_at: new Date().toISOString(),
    };
  }

  try {
    // Lightweight models list — no token cost
    const res = await withTimeout(
      fetch('https://api.anthropic.com/v1/models', {
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
      }),
      CHECK_TIMEOUT_MS
    );
    return {
      name: 'Anthropic',
      status: res.ok ? 'healthy' : 'degraded',
      latency_ms: Date.now() - start,
      message: res.ok ? undefined : `HTTP ${res.status}`,
      checked_at: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: 'Anthropic',
      status: 'down',
      latency_ms: Date.now() - start,
      message: err instanceof Error ? err.message : 'Unknown error',
      checked_at: new Date().toISOString(),
    };
  }
}

async function checkSentry(): Promise<HealthCheckResult> {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (!dsn) {
    return {
      name: 'Sentry',
      status: 'disabled',
      latency_ms: 0,
      message: 'SENTRY_DSN not configured',
      checked_at: new Date().toISOString(),
    };
  }

  const start = Date.now();
  try {
    // Parse DSN to extract the host and validate format
    const url = new URL(dsn);
    const res = await withTimeout(
      fetch(`${url.protocol}//${url.host}/api/0/`, { method: 'GET' }),
      CHECK_TIMEOUT_MS
    );
    // Sentry returns 200 or 404 at root — any response means it's reachable
    return {
      name: 'Sentry',
      status: res.status < 500 ? 'healthy' : 'degraded',
      latency_ms: Date.now() - start,
      checked_at: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: 'Sentry',
      status: 'down',
      latency_ms: Date.now() - start,
      message: err instanceof Error ? err.message : 'Unknown error',
      checked_at: new Date().toISOString(),
    };
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Run all service health checks in parallel.
 * Returns cached result if within TTL, otherwise runs fresh checks.
 */
export async function runAllHealthChecks(
  options: { skipCache?: boolean } = {}
): Promise<DetailedHealthResponse> {
  if (!options.skipCache) {
    const cached = cache.get(CACHE_KEY);
    if (cached) return cached;
  }

  const services = await Promise.all([
    checkSupabase(),
    checkStripe(),
    checkResend(),
    checkAnthropic(),
    checkSentry(),
  ]);

  const overallStatus = deriveOverallStatus(services);

  const result: DetailedHealthResponse = {
    success: overallStatus === 'healthy',
    status: overallStatus,
    services,
    timestamp: new Date().toISOString(),
  };

  cache.set(CACHE_KEY, result, CACHE_TTL_MS);
  return result;
}

/**
 * Run a single service check by name.
 */
export async function checkService(
  name: 'supabase' | 'stripe' | 'resend' | 'anthropic' | 'sentry'
): Promise<HealthCheckResult> {
  switch (name) {
    case 'supabase':
      return checkSupabase();
    case 'stripe':
      return checkStripe();
    case 'resend':
      return checkResend();
    case 'anthropic':
      return checkAnthropic();
    case 'sentry':
      return checkSentry();
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function deriveOverallStatus(services: HealthCheckResult[]): ServiceStatus {
  const active = services.filter((s) => s.status !== 'disabled');
  if (active.length === 0) return 'healthy'; // all disabled = nothing to report
  if (active.some((s) => s.status === 'down')) return 'down';
  if (active.some((s) => s.status === 'degraded')) return 'degraded';
  return 'healthy';
}

/** Exported for testing */
export { deriveOverallStatus as _deriveOverallStatus };
export { CACHE_TTL_MS, CHECK_TIMEOUT_MS };
