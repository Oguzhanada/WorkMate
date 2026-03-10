import { describe, expect, it } from 'vitest';

/**
 * Integration tests for /api/health endpoint.
 * These test the route handler logic by verifying expected behavior
 * against the actual endpoint when the dev server is running.
 *
 * Run with: npm run test:integration (requires dev server at localhost:3000)
 *
 * If the dev server is not running, these tests will be skipped.
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function isServerRunning(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok || res.status === 503;
  } catch {
    return false;
  }
}

describe('GET /api/health', () => {
  it('returns basic health status without auth', async () => {
    if (!(await isServerRunning())) return; // skip if no server

    const res = await fetch(`${BASE_URL}/api/health`);
    const body = await res.json();

    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('database');
    expect(body).toHaveProperty('uptime');
    expect(body).toHaveProperty('timestamp');
    // Basic mode should NOT expose service details
    expect(body).not.toHaveProperty('services');
  });

  it('rejects detailed mode without auth', async () => {
    if (!(await isServerRunning())) return;

    const res = await fetch(`${BASE_URL}/api/health?detailed=true`);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body).toHaveProperty('error');
    // Should not leak service internals
    expect(body).not.toHaveProperty('services');
  });

  it('basic mode does not expose error details publicly', async () => {
    if (!(await isServerRunning())) return;

    const res = await fetch(`${BASE_URL}/api/health`);
    const body = await res.json();

    // Public response should not include raw error messages
    expect(body).not.toHaveProperty('error');
  });
});
