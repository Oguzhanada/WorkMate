import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { rateLimit, RATE_LIMITS, type RateLimitConfig } from '@/lib/rate-limit';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Create a limiter with a short window for testing */
function testConfig(overrides: Partial<RateLimitConfig> = {}): RateLimitConfig {
  return {
    windowMs: 60_000,
    max: 5,
    keyPrefix: `test-${Math.random().toString(36).slice(2, 8)}`,
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // 1. First request — always allowed, remaining = max - 1
  it('allows the first request and returns remaining = max - 1', async () => {
    const config = testConfig({ max: 5 });
    const check = rateLimit(config);

    const result = await check('user-1');

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  // 2. Requests within window — allowed up to max, remaining decreases
  it('allows requests up to max and decreases remaining correctly', async () => {
    const config = testConfig({ max: 3 });
    const check = rateLimit(config);

    const r1 = await check('user-2');
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = await check('user-2');
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = await check('user-2');
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  // 3. Exceeding max — returns allowed: false, remaining: 0
  it('blocks requests after max is reached', async () => {
    const config = testConfig({ max: 2 });
    const check = rateLimit(config);

    await check('user-3');
    await check('user-3');

    const blocked = await check('user-3');
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('keeps blocking on repeated requests after max', async () => {
    const config = testConfig({ max: 1 });
    const check = rateLimit(config);

    await check('user-repeat');

    const b1 = await check('user-repeat');
    const b2 = await check('user-repeat');

    expect(b1.allowed).toBe(false);
    expect(b2.allowed).toBe(false);
    expect(b1.remaining).toBe(0);
    expect(b2.remaining).toBe(0);
  });

  // 4. Window expiry — after windowMs passes, counter resets
  it('resets the counter after the window expires', async () => {
    const config = testConfig({ max: 2, windowMs: 10_000 });
    const check = rateLimit(config);

    await check('user-4');
    await check('user-4');

    const blocked = await check('user-4');
    expect(blocked.allowed).toBe(false);

    // Advance past the window
    vi.advanceTimersByTime(10_001);

    const afterReset = await check('user-4');
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(1); // max - 1
  });

  it('starts a fresh window with new resetAt after expiry', async () => {
    const config = testConfig({ max: 1, windowMs: 5_000 });
    const check = rateLimit(config);

    const first = await check('user-expiry');
    const firstResetAt = first.resetAt;

    // Advance past the window
    vi.advanceTimersByTime(5_001);

    const afterExpiry = await check('user-expiry');
    expect(afterExpiry.allowed).toBe(true);
    expect(afterExpiry.resetAt).toBeGreaterThan(firstResetAt);
  });

  // 5. Key prefixing — different configs with different prefixes don't collide
  it('isolates counters by key prefix', async () => {
    const configA = testConfig({ max: 1, keyPrefix: 'prefix-a' });
    const configB = testConfig({ max: 1, keyPrefix: 'prefix-b' });
    const checkA = rateLimit(configA);
    const checkB = rateLimit(configB);

    // Exhaust limiter A
    await checkA('same-user');
    const blockedA = await checkA('same-user');
    expect(blockedA.allowed).toBe(false);

    // Limiter B should still allow the same identifier
    const allowedB = await checkB('same-user');
    expect(allowedB.allowed).toBe(true);
  });

  // 7. Multiple identifiers — different identifiers have independent counters
  it('tracks different identifiers independently', async () => {
    const config = testConfig({ max: 1 });
    const check = rateLimit(config);

    await check('alice');
    const blockedAlice = await check('alice');
    expect(blockedAlice.allowed).toBe(false);

    // Bob should still be allowed
    const allowedBob = await check('bob');
    expect(allowedBob.allowed).toBe(true);
  });

  // 8. Edge case — max: 1 blocks on second request
  it('blocks on the second request when max is 1', async () => {
    const config = testConfig({ max: 1 });
    const check = rateLimit(config);

    const first = await check('strict-user');
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(0);

    const second = await check('strict-user');
    expect(second.allowed).toBe(false);
    expect(second.remaining).toBe(0);
  });

  // 9. resetAt — verify resetAt is correctly calculated (now + windowMs on fresh window)
  it('sets resetAt to now + windowMs on first request', async () => {
    const now = Date.now();
    const windowMs = 30_000;
    const config = testConfig({ windowMs });
    const check = rateLimit(config);

    const result = await check('reset-user');

    expect(result.resetAt).toBe(now + windowMs);
  });

  it('preserves the original resetAt for subsequent requests within the window', async () => {
    const config = testConfig({ max: 5, windowMs: 60_000 });
    const check = rateLimit(config);

    const first = await check('preserve-user');
    const firstResetAt = first.resetAt;

    // Advance a bit but stay within the window
    vi.advanceTimersByTime(10_000);

    const second = await check('preserve-user');
    expect(second.resetAt).toBe(firstResetAt);

    vi.advanceTimersByTime(10_000);

    const third = await check('preserve-user');
    expect(third.resetAt).toBe(firstResetAt);
  });

  it('returns the original resetAt when request is blocked', async () => {
    const config = testConfig({ max: 1, windowMs: 60_000 });
    const check = rateLimit(config);

    const first = await check('blocked-reset');
    const blocked = await check('blocked-reset');

    expect(blocked.resetAt).toBe(first.resetAt);
  });
});

// 6. RATE_LIMITS configs — verify all predefined configs have correct values
describe('RATE_LIMITS', () => {
  it('defines all expected limit keys', () => {
    const expectedKeys = [
      'AI_ENDPOINT',
      'AUTH_ENDPOINT',
      'AUTH_LOGIN',
      'AUTH_STRICT',
      'WRITE_ENDPOINT',
      'READ_ENDPOINT',
      'PUBLIC_API',
      'ADMIN_READ',
    ];

    expect(Object.keys(RATE_LIMITS).sort()).toEqual(expectedKeys.sort());
  });

  it('AI_ENDPOINT: 5 req / 60s', () => {
    expect(RATE_LIMITS.AI_ENDPOINT).toEqual({
      windowMs: 60_000,
      max: 5,
      keyPrefix: 'ai',
    });
  });

  it('AUTH_ENDPOINT: 10 req / 15min', () => {
    expect(RATE_LIMITS.AUTH_ENDPOINT).toEqual({
      windowMs: 900_000,
      max: 10,
      keyPrefix: 'auth',
    });
  });

  it('AUTH_LOGIN: 10 req / 60s', () => {
    expect(RATE_LIMITS.AUTH_LOGIN).toEqual({
      windowMs: 60_000,
      max: 10,
      keyPrefix: 'auth-login',
    });
  });

  it('AUTH_STRICT: 5 req / 60s', () => {
    expect(RATE_LIMITS.AUTH_STRICT).toEqual({
      windowMs: 60_000,
      max: 5,
      keyPrefix: 'auth-strict',
    });
  });

  it('WRITE_ENDPOINT: 30 req / 60s', () => {
    expect(RATE_LIMITS.WRITE_ENDPOINT).toEqual({
      windowMs: 60_000,
      max: 30,
      keyPrefix: 'write',
    });
  });

  it('READ_ENDPOINT: 100 req / 60s', () => {
    expect(RATE_LIMITS.READ_ENDPOINT).toEqual({
      windowMs: 60_000,
      max: 100,
      keyPrefix: 'read',
    });
  });

  it('PUBLIC_API: 20 req / 60s', () => {
    expect(RATE_LIMITS.PUBLIC_API).toEqual({
      windowMs: 60_000,
      max: 20,
      keyPrefix: 'pub',
    });
  });

  it('ADMIN_READ: 60 req / 60s', () => {
    expect(RATE_LIMITS.ADMIN_READ).toEqual({
      windowMs: 60_000,
      max: 60,
      keyPrefix: 'admin-read',
    });
  });

  it('every config has positive windowMs and max', () => {
    for (const [name, config] of Object.entries(RATE_LIMITS)) {
      expect(config.windowMs, `${name}.windowMs`).toBeGreaterThan(0);
      expect(config.max, `${name}.max`).toBeGreaterThan(0);
      expect(config.keyPrefix, `${name}.keyPrefix`).toBeTruthy();
    }
  });

  it('every config has a unique keyPrefix', () => {
    const prefixes = Object.values(RATE_LIMITS).map((c) => c.keyPrefix);
    expect(new Set(prefixes).size).toBe(prefixes.length);
  });
});
