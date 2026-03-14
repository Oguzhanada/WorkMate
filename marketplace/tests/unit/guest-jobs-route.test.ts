import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const CATEGORY_ID = '22222222-2222-2222-2222-222222222222';

const mockServiceFrom = vi.fn();
const mockCategorySelect = vi.fn();
const mockExistingIntentSelect = vi.fn();
const mockIntentInsert = vi.fn();
const mockVerifyTurnstileToken = vi.fn();
const mockNormalizeEircode = vi.fn((value: string) => value.trim().toUpperCase());

type MockRouteHandler = (...args: unknown[]) => unknown;

vi.mock('@/lib/supabase/service', () => ({
  getSupabaseServiceClient: vi.fn(() => ({
    from: (...args: unknown[]) => mockServiceFrom(...args),
  })),
}));

vi.mock('@/lib/validation/api', () => ({
  createGuestJobIntentSchema: {
    safeParse: vi.fn((data: unknown) => {
      const payload = data as Record<string, unknown>;
      if (!payload?.email || !payload?.title || !payload?.category_id || !payload?.cf_turnstile_token) {
        return { success: false, error: { issues: [{ message: 'Missing fields' }] } };
      }

      return { success: true, data: payload };
    }),
  },
}));

vi.mock('@/lib/ireland/eircode', () => ({
  normalizeEircode: (...args: unknown[]) => mockNormalizeEircode(...args as [string]),
}));

vi.mock('@/lib/cloudflare/turnstile', () => ({
  verifyTurnstileToken: (...args: unknown[]) => mockVerifyTurnstileToken(...args),
}));

vi.mock('@/lib/idempotency', () => ({
  checkIdempotency: vi.fn().mockResolvedValue(null),
  saveIdempotencyResponse: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/rate-limit/middleware', () => ({
  withRateLimit: vi.fn((_config: unknown, handler: MockRouteHandler) => handler),
  RATE_LIMITS: { AUTH_STRICT: { windowMs: 60_000, max: 10, keyPrefix: 'auth' } },
}));

vi.mock('@/lib/api/error-response', async () => {
  const { NextResponse } = await import('next/server');
  return {
    apiError: (msg: string, status: number, details?: Record<string, unknown>) =>
      NextResponse.json(details ? { error: msg, ...details } : { error: msg }, { status }),
    apiForbidden: (msg?: string) => NextResponse.json({ error: msg ?? 'Forbidden' }, { status: 403 }),
  };
});

import { POST } from '@/app/api/guest-jobs/route';

function makeRequest(body: unknown, headers?: Record<string, string>): NextRequest {
  return new NextRequest('http://localhost:3000/api/guest-jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

function setupSupabase() {
  mockServiceFrom.mockImplementation((table: string) => {
    if (table === 'categories') {
      const chain = {
        eq: () => chain,
        maybeSingle: () => mockCategorySelect(),
      };

      return {
        select: () => chain,
      };
    }

    if (table === 'job_intents') {
      return {
        select: () => ({
          eq: () => ({
            neq: () => ({
              maybeSingle: () => mockExistingIntentSelect(),
            }),
          }),
        }),
        insert: (payload: Record<string, unknown>) => ({
          select: () => ({
            single: () => mockIntentInsert(payload),
          }),
        }),
      };
    }

    throw new Error(`Unexpected service table: ${table}`);
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  setupSupabase();
  mockVerifyTurnstileToken.mockResolvedValue({ success: true });
  mockCategorySelect.mockResolvedValue({
    data: { id: CATEGORY_ID, name: 'Plumbing' },
    error: null,
  });
  mockExistingIntentSelect.mockResolvedValue({ data: null, error: null });
  mockIntentInsert.mockResolvedValue({
    data: { id: 'intent-1', status: 'ready_to_publish' },
    error: null,
  });
});

afterEach(() => {
  delete process.env.REQUIRE_GUEST_EMAIL_VERIFICATION;
  vi.restoreAllMocks();
});

describe('POST /api/guest-jobs', () => {
  const validBody = {
    email: 'Guest@Example.COM',
    title: 'Fix driveway gate',
    category_id: CATEGORY_ID,
    description: 'Gate is jammed and needs repair this week.',
    eircode: ' d01abc1 ',
    county: 'Dublin',
    locality: 'Clontarf',
    budget_range: '100-200',
    task_type: 'in_person',
    job_mode: 'get_quotes',
    photo_urls: [],
    cf_turnstile_token: 'cf-token',
  };

  it('returns 403 when Turnstile verification fails', async () => {
    mockVerifyTurnstileToken.mockResolvedValueOnce({
      success: false,
      reason: 'Turnstile challenge failed',
    });

    const res = await POST(makeRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toContain('Bot protection check failed');
  });

  it('returns cached response when idempotency key matches', async () => {
    const { checkIdempotency } = await import('@/lib/idempotency');
    vi.mocked(checkIdempotency).mockResolvedValueOnce({
      body: { intent_id: 'intent-cached', status: 'ready_to_publish', verification_required: false },
      status: 201,
    });

    const res = await POST(makeRequest(validBody, { 'Idempotency-Key': 'idem-guest-1' }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.intent_id).toBe('intent-cached');
    expect(mockIntentInsert).not.toHaveBeenCalled();
  });

  it('returns 409 when the guest already has an active intent', async () => {
    mockExistingIntentSelect.mockResolvedValueOnce({
      data: { id: 'intent-existing', status: 'email_pending' },
      error: null,
    });

    const res = await POST(makeRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toBe('one_intent_per_email');
    expect(body.redirect_hint).toBe('/register');
  });

  it('creates a ready-to-publish guest intent and saves the idempotent response', async () => {
    const { saveIdempotencyResponse } = await import('@/lib/idempotency');

    const res = await POST(makeRequest(validBody, { 'Idempotency-Key': 'idem-guest-2', 'x-forwarded-for': '203.0.113.10' }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(mockNormalizeEircode).toHaveBeenCalledWith(' d01abc1 ');
    expect(mockVerifyTurnstileToken).toHaveBeenCalledWith('cf-token', '203.0.113.10');
    expect(mockIntentInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'guest@example.com',
        category_id: CATEGORY_ID,
        eircode: 'D01ABC1',
        status: 'ready_to_publish',
        verification_token: expect.stringMatching(/^[a-f0-9]{32}$/i),
      })
    );
    expect(vi.mocked(saveIdempotencyResponse)).toHaveBeenCalledWith(
      'idem-guest-2',
      'guest-jobs/create',
      '203.0.113.10',
      201,
      {
        intent_id: 'intent-1',
        status: 'ready_to_publish',
        verification_required: false,
      }
    );
    expect(body).toEqual({
      intent_id: 'intent-1',
      status: 'ready_to_publish',
      verification_required: false,
    });
  });
});
