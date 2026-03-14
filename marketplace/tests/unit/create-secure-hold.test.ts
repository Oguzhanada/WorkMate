import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Module mocks (must be before imports of mocked modules) ─────────────────

const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockServiceFrom = vi.fn();
type MockRouteHandler = (...args: unknown[]) => unknown;

vi.mock('@/lib/supabase/route', () => ({
  getSupabaseRouteClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
    from: (...args: unknown[]) => mockFrom(...args),
  }),
}));

vi.mock('@/lib/supabase/service', () => ({
  getSupabaseServiceClient: vi.fn(() => ({
    from: (...args: unknown[]) => mockServiceFrom(...args),
  })),
}));

vi.mock('@/lib/auth/rbac', () => ({
  getUserRoles: vi.fn().mockResolvedValue(['customer']),
  canPostJob: vi.fn((roles: string[]) => roles.includes('customer')),
}));

const mockStripeCheckoutCreate = vi.fn();
vi.mock('@/lib/stripe/client', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: (...args: unknown[]) => mockStripeCheckoutCreate(...args),
      },
    },
  },
}));

vi.mock('@/lib/pricing/fee-calculator', () => ({
  calculateFees: vi.fn().mockResolvedValue({ transactionFee: 5.0, platformFee: 0.019 }),
}));

vi.mock('@/lib/resilience/service-status', () => ({
  getServiceStatus: vi.fn().mockResolvedValue('operational'),
}));

vi.mock('@/lib/idempotency', () => ({
  checkIdempotency: vi.fn().mockResolvedValue(null),
  saveIdempotencyResponse: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/rate-limit/middleware', () => ({
  withRateLimit: vi.fn((_config: unknown, handler: MockRouteHandler) => handler),
  RATE_LIMITS: { WRITE_ENDPOINT: { windowMs: 60_000, max: 30, keyPrefix: 'write' } },
}));

vi.mock('@/lib/api/error-response', async () => {
  const { NextResponse } = await import('next/server');
  return {
    apiError: (msg: string, status: number) => NextResponse.json({ error: msg }, { status }),
    apiUnauthorized: (msg?: string) => NextResponse.json({ error: msg ?? 'Unauthorized' }, { status: 401 }),
    apiForbidden: (msg?: string) => NextResponse.json({ error: msg ?? 'Forbidden' }, { status: 403 }),
    apiNotFound: (msg?: string) => NextResponse.json({ error: msg ?? 'Not found' }, { status: 404 }),
  };
});

vi.mock('@/lib/validation/api', () => ({
  createSecureHoldSchema: {
    safeParse: vi.fn((data: unknown) => {
      const d = data as Record<string, unknown>;
      if (!d || !d.amount_cents || !d.connected_account_id || !d.quote_id || !d.job_id || !d.customer_id || !d.pro_id) {
        return { success: false, error: { issues: [{ message: 'Missing fields' }] } };
      }
      return { success: true, data: d };
    }),
  },
}));

// ── Import the handler after mocks ──────────────────────────────────────────

import { POST } from '@/app/api/connect/create-secure-hold/route';

// ── Test helpers ────────────────────────────────────────────────────────────

const TEST_USER_ID = 'user-123';
const VALID_BODY = {
  amount_cents: 5000,
  connected_account_id: 'acct_test',
  quote_id: 'quote-1',
  job_id: 'job-1',
  customer_id: TEST_USER_ID,
  pro_id: 'pro-1',
};

function makeRequest(body: unknown, headers?: Record<string, string>): NextRequest {
  return new NextRequest('http://localhost:3000/api/connect/create-secure-hold', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

function mockAuthSuccess() {
  mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
}

function mockAuthFailure() {
  mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } });
}

function mockQuoteAndJob() {
  // quote lookup
  mockFrom.mockImplementation((table: string) => {
    if (table === 'quotes') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: { id: 'quote-1', pro_id: 'pro-1', job_id: 'job-1', quote_amount_cents: 5000 },
                error: null,
              }),
          }),
        }),
      };
    }
    if (table === 'jobs') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: { id: 'job-1', customer_id: TEST_USER_ID, status: 'accepted', accepted_quote_id: 'quote-1' },
                error: null,
              }),
          }),
        }),
      };
    }
    return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }) };
  });

  // service client: no existing payment
  mockServiceFrom.mockImplementation(() => ({
    select: () => ({
      eq: () => ({
        eq: () => ({
          in: () => ({
            limit: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
        }),
      }),
    }),
  }));
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/connect/create-secure-hold', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Auth tests ─────────────────────────────────────────────────────────────

  it('returns 401 when user is not authenticated', async () => {
    mockAuthFailure();
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(401);
  });

  it('returns 403 when user is not a customer', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: TEST_USER_ID } }, error: null });
    const { canPostJob } = await import('@/lib/auth/rbac');
    vi.mocked(canPostJob).mockReturnValueOnce(false);

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(403);
  });

  // ── Validation tests ──────────────────────────────────────────────────────

  it('returns 400 when body is invalid JSON', async () => {
    mockAuthSuccess();
    const req = new NextRequest('http://localhost:3000/api/connect/create-secure-hold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json{{{',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when required fields are missing', async () => {
    mockAuthSuccess();
    const res = await POST(makeRequest({ amount_cents: 5000 }));
    expect(res.status).toBe(400);
  });

  // ── Stripe down (circuit breaker) ─────────────────────────────────────────

  it('returns 503 when Stripe service is down', async () => {
    mockAuthSuccess();
    const { getServiceStatus } = await import('@/lib/resilience/service-status');
    vi.mocked(getServiceStatus).mockResolvedValueOnce('down');

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(503);
  });

  // ── Customer mismatch ─────────────────────────────────────────────────────

  it('returns 403 when customer_id does not match authenticated user', async () => {
    mockAuthSuccess();
    mockQuoteAndJob();
    const res = await POST(makeRequest({ ...VALID_BODY, customer_id: 'other-user' }));
    expect(res.status).toBe(403);
  });

  // ── Happy path ────────────────────────────────────────────────────────────

  it('returns 200 with checkout URL on success', async () => {
    mockAuthSuccess();
    mockQuoteAndJob();
    mockStripeCheckoutCreate.mockResolvedValue({
      url: 'https://checkout.stripe.com/test',
      id: 'cs_test_123',
    });

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.checkout_url).toBe('https://checkout.stripe.com/test');
    expect(body.checkout_session_id).toBe('cs_test_123');
    expect(body.commission_cents).toBe(500); // 5.0 * 100
  });

  // ── Idempotency ───────────────────────────────────────────────────────────

  it('returns cached response when idempotency key matches', async () => {
    mockAuthSuccess();
    const { checkIdempotency } = await import('@/lib/idempotency');
    vi.mocked(checkIdempotency).mockResolvedValueOnce({
      body: { checkout_url: 'cached-url', checkout_session_id: 'cached-id', commission_cents: 100 },
      status: 200,
    });

    const res = await POST(makeRequest(VALID_BODY, { 'Idempotency-Key': 'idem-key-1' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.checkout_url).toBe('cached-url');
  });

  // ── Duplicate payment ─────────────────────────────────────────────────────

  it('returns 400 when payment already exists for this job+quote', async () => {
    mockAuthSuccess();
    mockFrom.mockImplementation((table: string) => {
      if (table === 'quotes') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: { id: 'quote-1', pro_id: 'pro-1', job_id: 'job-1', quote_amount_cents: 5000 },
                  error: null,
                }),
            }),
          }),
        };
      }
      if (table === 'jobs') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: { id: 'job-1', customer_id: TEST_USER_ID, status: 'accepted', accepted_quote_id: 'quote-1' },
                  error: null,
                }),
            }),
          }),
        };
      }
      return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }) };
    });

    // service client: existing payment found
    mockServiceFrom.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            in: () => ({
              limit: () => ({
                maybeSingle: () => Promise.resolve({ data: { id: 'pay-1', status: 'authorized' }, error: null }),
              }),
            }),
          }),
        }),
      }),
    }));

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Payment already exists');
  });
});
