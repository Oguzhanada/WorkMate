import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const TEST_USER_ID = '11111111-1111-1111-1111-111111111111';
const PAYMENT_INTENT_ID = 'pi_test_123';

const mockGetUser = vi.fn();
const mockRouteFrom = vi.fn();
const mockServiceFrom = vi.fn();
const mockStripeCapture = vi.fn();
const mockPaymentSelect = vi.fn();
const mockJobSelect = vi.fn();
const mockPaymentUpdate = vi.fn();
const mockJobUpdate = vi.fn();

type MockRouteHandler = (...args: unknown[]) => unknown;

vi.mock('@/lib/supabase/route', () => ({
  getSupabaseRouteClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
    from: (...args: unknown[]) => mockRouteFrom(...args),
  }),
}));

vi.mock('@/lib/supabase/service', () => ({
  getSupabaseServiceClient: vi.fn(() => ({
    from: (...args: unknown[]) => mockServiceFrom(...args),
  })),
}));

vi.mock('@/lib/auth/rbac', () => ({
  getUserRoles: vi.fn().mockResolvedValue(['customer']),
  canPostJob: vi.fn((roles: string[]) => roles.includes('customer') || roles.includes('admin')),
  canAccessAdmin: vi.fn((roles: string[]) => roles.includes('admin')),
}));

vi.mock('@/lib/validation/api', () => ({
  capturePaymentSchema: {
    safeParse: vi.fn((data: unknown) => {
      const payload = data as Record<string, unknown>;
      if (!payload?.payment_intent_id) {
        return { success: false, error: { issues: [{ message: 'payment_intent_id is required' }] } };
      }
      return { success: true, data: payload };
    }),
  },
}));

vi.mock('@/lib/stripe/client', () => ({
  stripe: {
    paymentIntents: {
      capture: (...args: unknown[]) => mockStripeCapture(...args),
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
    apiNotFound: (msg?: string) => NextResponse.json({ error: msg ?? 'Not found' }, { status: 404 }),
  };
});

import { POST } from '@/app/api/connect/capture-payment/route';

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/connect/capture-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function mockAuthSuccess(userId = TEST_USER_ID) {
  mockGetUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });
}

function setupSupabase() {
  mockRouteFrom.mockImplementation((table: string) => {
    if (table === 'jobs') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () => mockJobSelect(),
          }),
        }),
      };
    }

    return {
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    };
  });

  mockServiceFrom.mockImplementation((table: string) => {
    if (table === 'payments') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () => mockPaymentSelect(),
          }),
        }),
        update: (payload: Record<string, unknown>) => ({
          eq: (column: string, value: string) => mockPaymentUpdate(payload, column, value),
        }),
      };
    }

    if (table === 'jobs') {
      return {
        update: (payload: Record<string, unknown>) => ({
          eq: (column: string, value: string) => mockJobUpdate(payload, column, value),
        }),
      };
    }

    return {
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    };
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  setupSupabase();
  mockPaymentSelect.mockResolvedValue({
    data: {
      id: 'payment-1',
      job_id: 'job-1',
      customer_id: TEST_USER_ID,
      status: 'authorized',
      stripe_payment_intent_id: PAYMENT_INTENT_ID,
    },
    error: null,
  });
  mockJobSelect.mockResolvedValue({
    data: { id: 'job-1', status: 'completed', customer_id: TEST_USER_ID },
    error: null,
  });
  mockPaymentUpdate.mockResolvedValue({ error: null });
  mockJobUpdate.mockResolvedValue({ error: null });
  mockStripeCapture.mockResolvedValue({ id: PAYMENT_INTENT_ID, status: 'succeeded' });
});

describe('POST /api/connect/capture-payment', () => {
  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } });

    const res = await POST(makeRequest({ payment_intent_id: PAYMENT_INTENT_ID }));

    expect(res.status).toBe(401);
  });

  it('returns 403 when user cannot post jobs', async () => {
    mockAuthSuccess();
    const { canPostJob } = await import('@/lib/auth/rbac');
    vi.mocked(canPostJob).mockReturnValueOnce(false);

    const res = await POST(makeRequest({ payment_intent_id: PAYMENT_INTENT_ID }));

    expect(res.status).toBe(403);
  });

  it('returns 503 when Stripe service is down', async () => {
    mockAuthSuccess();
    const { getServiceStatus } = await import('@/lib/resilience/service-status');
    vi.mocked(getServiceStatus).mockResolvedValueOnce('down');

    const res = await POST(makeRequest({ payment_intent_id: PAYMENT_INTENT_ID }));
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error).toContain('temporarily unavailable');
  });

  it('returns 400 for invalid JSON body', async () => {
    mockAuthSuccess();

    const req = new NextRequest('http://localhost:3000/api/connect/capture-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json{{{',
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 404 when payment record is missing', async () => {
    mockAuthSuccess();
    mockPaymentSelect.mockResolvedValueOnce({ data: null, error: null });

    const res = await POST(makeRequest({ payment_intent_id: PAYMENT_INTENT_ID }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Payment record not found');
  });

  it('returns 400 when payment is not authorized', async () => {
    mockAuthSuccess();
    mockPaymentSelect.mockResolvedValueOnce({
      data: {
        id: 'payment-1',
        job_id: 'job-1',
        customer_id: TEST_USER_ID,
        status: 'captured',
        stripe_payment_intent_id: PAYMENT_INTENT_ID,
      },
      error: null,
    });

    const res = await POST(makeRequest({ payment_intent_id: PAYMENT_INTENT_ID }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('cannot be captured');
  });

  it('returns 400 when job is not completed', async () => {
    mockAuthSuccess();
    mockJobSelect.mockResolvedValueOnce({
      data: { id: 'job-1', status: 'in_progress', customer_id: TEST_USER_ID },
      error: null,
    });

    const res = await POST(makeRequest({ payment_intent_id: PAYMENT_INTENT_ID }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Mark job as completed');
  });

  it('captures payment and updates payment/job state on success', async () => {
    mockAuthSuccess();

    const res = await POST(makeRequest({ payment_intent_id: PAYMENT_INTENT_ID }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockStripeCapture).toHaveBeenCalledWith(PAYMENT_INTENT_ID);
    expect(mockPaymentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'captured',
        auto_release_processed_at: expect.any(String),
      }),
      'stripe_payment_intent_id',
      PAYMENT_INTENT_ID
    );
    expect(mockJobUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_released_at: expect.any(String),
        payment_on_hold: false,
      }),
      'id',
      'job-1'
    );
    expect(body).toEqual({
      status: 'succeeded',
      payment_intent_id: PAYMENT_INTENT_ID,
    });
  });
});
