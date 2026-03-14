/**
 * Service Status Cache
 * ─────────────────────────────────────────────────────────────
 * Lightweight push-based cache for per-service health statuses.
 *
 * Design intent:
 *   - Health routes or background jobs call `setServiceStatus()` to
 *     push the latest status into the cache.
 *   - Consumers call `getServiceStatus()` / `getAllServiceStatuses()`
 *     to read the last known status without triggering an external call.
 *   - Cache entries expire after CACHE_TTL_MS (30 seconds).
 *     Expired or unknown services return 'disabled'.
 *
 * This module does NOT call health-check endpoints itself.
 */

import type { ServiceStatus } from '../monitoring/health-checks';

// ── Constants ────────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 30_000; // 30 seconds

// ── Internal store ───────────────────────────────────────────────────────────

interface CacheEntry {
  status: ServiceStatus;
  cachedAt: number;
}

const store = new Map<string, CacheEntry>();

// ── Write ────────────────────────────────────────────────────────────────────

/**
 * Store the latest status for a named service.
 * Any existing entry is replaced; the TTL clock restarts from now.
 */
export function setServiceStatus(service: string, status: ServiceStatus): void {
  store.set(service, { status, cachedAt: Date.now() });
}

// ── Read ─────────────────────────────────────────────────────────────────────

/**
 * Return the cached status for `service`.
 * Returns `'disabled'` when the entry is absent or has expired.
 */
export async function getServiceStatus(service: string): Promise<ServiceStatus> {
  const entry = store.get(service);
  if (!entry) return 'disabled';
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    store.delete(service);
    return 'disabled';
  }
  return entry.status;
}

/**
 * Return the cached status for every service currently in the store.
 * Expired entries are pruned before building the result.
 */
export async function getAllServiceStatuses(): Promise<Record<string, ServiceStatus>> {
  const now = Date.now();
  const result: Record<string, ServiceStatus> = {};

  for (const [name, entry] of store.entries()) {
    if (now - entry.cachedAt > CACHE_TTL_MS) {
      store.delete(name);
      continue;
    }
    result[name] = entry.status;
  }

  return result;
}
