import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const TEST_USER_ID = '11111111-1111-1111-1111-111111111111';
const CHECKOUT_SESSION_ID = 'cs_test_123';
const PAYMENT_INTENT_ID = 'pi_test_123';

const mockGetUser = vi.fn();
const mockPaymentsUpsert = vi.fn();
const mockJobsUpdate = vi.fn();
const mockCheckoutRetrieve = vi.fn();
const mockPaymentIntentRetrieve = vi.fn();

type MockRouteHandler = (...args: unknown[]) => unknown;

vi.mock('@/lib/supabase/route', () => ({
  getSupabaseRouteClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
  }),
}));

vi.mock('@/lib/supabase/service', () => ({
  getSupabaseServiceClient: vi.fn(() => ({
    from: (table: string) => {
      if (table === 'payments') {
        return {
          upsert: (...args: unknown[]) => mockPaymentsUpsert(...args),
        };
      }

      if (table === 'jobs') {
        const chain: {
          eq: (column: string, value: string) => typeof chain;
          then?: <TResult1 = { error: unknown }, TResult2 = never>(
            onfulfilled?: ((value: { error: unknown }) => TResult1 | PromiseLike<TResult1>) | null,
            onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
          ) => Promise<TResult1 | TResult2>;
        } = {
          eq: () => chain,
        };
        chain.then = (onfulfilled, onrejected) => mockJobsUpdate().then(onfulfilled, onrejected);
        return {
          update: () => chain,
        };
      }

      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      };
    },
  })),
}));

vi.mock('@/lib/auth/rbac', () => ({
  getUserRoles: vi.fn().mockResolvedValue(['customer']),
  canPostJob: vi.fn((roles: string[]) => roles.includes('customer') || roles.includes('admin')),
}));

vi.mock('@/lib/validation/api', () => ({
  finalizeHoldSchema: {
    safeParse: vi.fn((data: unknown) => {
      const payload = data as Record<string, unknown>;
      if (!payload?.checkout_session_id) {
        return { success: false, error: { issues: [{ message: 'checkout_session_id is required' }] } };
      }
      return { success: true, data: payload };
    }),
  },
}));

vi.mock('@/lib/stripe/client', () => ({
  stripe: {
    checkout: {
      sessions: {
        retrieve: (...args: unknown[]) => mockCheckoutRetrieve(...args),
      },
    },
    paymentIntents: {
      retrieve: (...args: unknown[]) => mockPaymentIntentRetrieve(...args),
    },
  },
}));

vi.mock('@/lib/resilience/service-status', () => ({
  getServiceStatus: vi.fn().mockResolvedValue('operational'),
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
  };
});

import { POST } from '@/app/api/connect/finalize-hold/route';

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/connect/finalize-hold', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function mockAuthSuccess(userId = TEST_USER_ID) {
  mockGetUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockPaymentsUpsert.mockResolvedValue({ error: null });
  mockJobsUpdate.mockResolvedValue({ error: null });
  mockCheckoutRetrieve.mockResolvedValue({
    id: CHECKOUT_SESSION_ID,
    payment_status: 'paid',
    metadata: {
      customer_id: TEST_USER_ID,
      quote_id: 'quote-1',
      job_id: 'job-1',
      pro_id: 'pro-1',
    },
    payment_intent: PAYMENT_INTENT_ID,
  });
  mockPaymentIntentRetrieve.mockResolvedValue({
    id: PAYMENT_INTENT_ID,
    status: 'requires_capture',
    amount: 5000,
    metadata: { commission: '500' },
  });
});

describe('POST /api/connect/finalize-hold', () => {
  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } });

    const res = await POST(makeRequest({ checkout_session_id: CHECKOUT_SESSION_ID }));

    expect(res.status).toBe(401);
  });

  it('returns 403 when user cannot post jobs', async () => {
    mockAuthSuccess();
    const { canPostJob } = await import('@/lib/auth/rbac');
    vi.mocked(canPostJob).mockReturnValueOnce(false);

    const res = await POST(makeRequest({ checkout_session_id: CHECKOUT_SESSION_ID }));

    expect(res.status).toBe(403);
  });

  it('returns 503 when Stripe service is down', async () => {
    mockAuthSuccess();
    const { getServiceStatus } = await import('@/lib/resilience/service-status');
    vi.mocked(getServiceStatus).mockResolvedValueOnce('down');

    const res = await POST(makeRequest({ checkout_session_id: CHECKOUT_SESSION_ID }));
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error).toContain('temporarily unavailable');
  });

  it('returns 400 for invalid JSON body', async () => {
    mockAuthSuccess();
    const req = new NextRequest('http://localhost:3000/api/connect/finalize-hold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json{{{',
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 when checkout metadata is incomplete', async () => {
    mockAuthSuccess();
    mockCheckoutRetrieve.mockResolvedValueOnce({
      id: CHECKOUT_SESSION_ID,
      payment_status: 'paid',
      metadata: { customer_id: TEST_USER_ID, quote_id: 'quote-1' },
      payment_intent: PAYMENT_INTENT_ID,
    });

    const res = await POST(makeRequest({ checkout_session_id: CHECKOUT_SESSION_ID }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('metadata is incomplete');
  });

  it('returns 403 when checkout customer does not match user', async () => {
    mockAuthSuccess();
    mockCheckoutRetrieve.mockResolvedValueOnce({
      id: CHECKOUT_SESSION_ID,
      payment_status: 'paid',
      metadata: {
        customer_id: 'other-user',
        quote_id: 'quote-1',
        job_id: 'job-1',
        pro_id: 'pro-1',
      },
      payment_intent: PAYMENT_INTENT_ID,
    });

    const res = await POST(makeRequest({ checkout_session_id: CHECKOUT_SESSION_ID }));

    expect(res.status).toBe(403);
  });

  it('returns 400 when payment intent is not in hold state', async () => {
    mockAuthSuccess();
    mockPaymentIntentRetrieve.mockResolvedValueOnce({
      id: PAYMENT_INTENT_ID,
      status: 'succeeded',
      amount: 5000,
      metadata: { commission: '500' },
    });

    const res = await POST(makeRequest({ checkout_session_id: CHECKOUT_SESSION_ID }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('not in hold state');
  });

  it('returns 400 when payment upsert fails', async () => {
    mockAuthSuccess();
    mockPaymentsUpsert.mockResolvedValueOnce({ error: { message: 'upsert failed' } });

    const res = await POST(makeRequest({ checkout_session_id: CHECKOUT_SESSION_ID }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('upsert failed');
  });

  it('authorizes hold and updates job status on success', async () => {
    mockAuthSuccess();

    const res = await POST(makeRequest({ checkout_session_id: CHECKOUT_SESSION_ID }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockCheckoutRetrieve).toHaveBeenCalledWith(CHECKOUT_SESSION_ID, {
      expand: ['payment_intent'],
    });
    expect(mockPaymentsUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        job_id: 'job-1',
        quote_id: 'quote-1',
        customer_id: TEST_USER_ID,
        pro_id: 'pro-1',
        stripe_payment_intent_id: PAYMENT_INTENT_ID,
        amount_cents: 5000,
        commission_cents: 500,
        status: 'authorized',
        auto_release_eligible: true,
      }),
      { onConflict: 'stripe_payment_intent_id' }
    );
    expect(body).toEqual({
      status: 'authorized',
      payment_intent_id: PAYMENT_INTENT_ID,
      amount_cents: 5000,
    });
  });
});
