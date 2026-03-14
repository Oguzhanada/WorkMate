import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const TEST_USER_ID = '11111111-1111-1111-1111-111111111111';
const JOB_ID = 'job-123';
const QUOTE_ID = '44444444-4444-4444-4444-444444444444';
const PROVIDER_ID = '55555555-5555-5555-5555-555555555555';

const mockGetUser = vi.fn();
const mockServiceFrom = vi.fn();
const mockJobSelect = vi.fn();
const mockPaymentSelect = vi.fn();
const mockQuoteSelect = vi.fn();
const mockQuoteUpdate = vi.fn();
const mockJobUpdate = vi.fn();
const mockProfileLookup = vi.fn();
const mockSendWebhookEvent = vi.fn();
const mockSendTransactionalEmail = vi.fn();
const mockSendNotification = vi.fn();

type MockRouteHandler = (...args: unknown[]) => unknown;

vi.mock('@/lib/supabase/route', () => ({
  getSupabaseRouteClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
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
  acceptQuoteSchema: {
    safeParse: vi.fn((data: unknown) => {
      const payload = data as Record<string, unknown>;
      if (!payload?.quote_id) {
        return { success: false, error: { issues: [{ message: 'quote_id is required' }] } };
      }

      return { success: true, data: payload };
    }),
  },
}));

vi.mock('@/lib/webhook/send', () => ({
  sendWebhookEvent: (...args: unknown[]) => mockSendWebhookEvent(...args),
}));

vi.mock('@/lib/email/send', () => ({
  sendTransactionalEmail: (...args: unknown[]) => mockSendTransactionalEmail(...args),
}));

vi.mock('@/lib/notifications/send', () => ({
  sendNotification: (...args: unknown[]) => mockSendNotification(...args),
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
    apiValidationError: () => NextResponse.json({ error: 'Validation failed' }, { status: 400 }),
    apiUnauthorized: (msg?: string) => NextResponse.json({ error: msg ?? 'Unauthorized' }, { status: 401 }),
    apiForbidden: (msg?: string) => NextResponse.json({ error: msg ?? 'Forbidden' }, { status: 403 }),
    apiNotFound: (msg?: string) => NextResponse.json({ error: msg ?? 'Not found' }, { status: 404 }),
  };
});

import { PATCH } from '@/app/api/jobs/[jobId]/accept-quote/route';

function makeRequest(body: unknown, headers?: Record<string, string>): NextRequest {
  return new NextRequest(`http://localhost:3000/api/jobs/${JOB_ID}/accept-quote`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

function authSuccess(userId = TEST_USER_ID) {
  mockGetUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });
}

function createAwaitableUpdate(
  payload: Record<string, unknown>,
  sink: typeof mockQuoteUpdate,
) {
  const eqCalls: Array<[string, string]> = [];
  const chain = {
    eq: (column: string, value: string) => {
      eqCalls.push([column, value]);
      return chain;
    },
    then: (
      onfulfilled?: ((value: { error: unknown }) => unknown) | null,
      onrejected?: ((reason: unknown) => unknown) | null,
    ) => Promise.resolve(sink(payload, eqCalls)).then(onfulfilled, onrejected),
  };

  return chain;
}

function setupSupabase() {
  mockServiceFrom.mockImplementation((table: string) => {
    if (table === 'jobs') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () => mockJobSelect(),
          }),
        }),
        update: (payload: Record<string, unknown>) => {
          const eqCalls: Array<[string, string]> = [];
          const chain = {
            eq: (column: string, value: string) => {
              eqCalls.push([column, value]);
              return chain;
            },
            select: () => ({
              single: () => mockJobUpdate(payload, eqCalls),
            }),
          };

          return chain;
        },
      };
    }

    if (table === 'payments') {
      return {
        select: () => ({
          eq: () => ({
            in: () => ({
              limit: () => ({
                maybeSingle: () => mockPaymentSelect(),
              }),
            }),
          }),
        }),
      };
    }

    if (table === 'quotes') {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: () => mockQuoteSelect(),
            }),
          }),
        }),
        update: (payload: Record<string, unknown>) => createAwaitableUpdate(payload, mockQuoteUpdate),
      };
    }

    if (table === 'profiles') {
      return {
        select: () => ({
          eq: (_column: string, value: string) => ({
            maybeSingle: () => mockProfileLookup(value),
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
  authSuccess();
  mockJobSelect.mockResolvedValue({
    data: { id: JOB_ID, title: 'Fix sink', customer_id: TEST_USER_ID, accepted_quote_id: null },
    error: null,
  });
  mockPaymentSelect.mockResolvedValue({ data: null, error: null });
  mockQuoteSelect.mockResolvedValue({
    data: { id: QUOTE_ID, job_id: JOB_ID, pro_id: PROVIDER_ID, quote_amount_cents: 12500 },
    error: null,
  });
  mockQuoteUpdate.mockResolvedValue({ error: null });
  mockJobUpdate.mockResolvedValue({
    data: { id: JOB_ID, status: 'accepted', accepted_quote_id: QUOTE_ID },
    error: null,
  });
  mockProfileLookup.mockImplementation(async (profileId: string) => {
    if (profileId === PROVIDER_ID) {
      return {
        data: { email: 'pro@example.com', full_name: 'Pat Provider' },
        error: null,
      };
    }

    return {
      data: { full_name: 'Casey Customer' },
      error: null,
    };
  });
});

describe('PATCH /api/jobs/[jobId]/accept-quote', () => {
  it('returns 401 when the user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } });

    const res = await PATCH(makeRequest({ quote_id: QUOTE_ID }), {
      params: Promise.resolve({ jobId: JOB_ID }),
    });

    expect(res.status).toBe(401);
  });

  it('returns cached response when idempotency key matches', async () => {
    const { checkIdempotency } = await import('@/lib/idempotency');
    vi.mocked(checkIdempotency).mockResolvedValueOnce({
      body: { job: { id: JOB_ID, accepted_quote_id: QUOTE_ID } },
      status: 200,
    });

    const res = await PATCH(makeRequest({ quote_id: QUOTE_ID }, { 'Idempotency-Key': 'idem-accept-1' }), {
      params: Promise.resolve({ jobId: JOB_ID }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.job.accepted_quote_id).toBe(QUOTE_ID);
    expect(mockQuoteUpdate).not.toHaveBeenCalled();
  });

  it('returns 400 when an authorized payment already exists', async () => {
    mockPaymentSelect.mockResolvedValueOnce({
      data: { id: 'payment-1' },
      error: null,
    });

    const res = await PATCH(makeRequest({ quote_id: QUOTE_ID }), {
      params: Promise.resolve({ jobId: JOB_ID }),
    });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Cannot change accepted quote after payment authorization');
  });

  it('accepts the quote, updates job state, and persists the idempotent response', async () => {
    const { saveIdempotencyResponse } = await import('@/lib/idempotency');

    const res = await PATCH(makeRequest({ quote_id: QUOTE_ID }, { 'Idempotency-Key': 'idem-accept-2' }), {
      params: Promise.resolve({ jobId: JOB_ID }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockQuoteUpdate).toHaveBeenNthCalledWith(
      1,
      { status: 'rejected' },
      [['job_id', JOB_ID]]
    );
    expect(mockQuoteUpdate).toHaveBeenNthCalledWith(
      2,
      { status: 'accepted' },
      [['id', QUOTE_ID], ['job_id', JOB_ID]]
    );
    expect(mockJobUpdate).toHaveBeenCalledWith(
      { accepted_quote_id: QUOTE_ID, status: 'accepted' },
      [['id', JOB_ID], ['customer_id', TEST_USER_ID]]
    );
    expect(mockSendWebhookEvent).toHaveBeenCalledWith(
      'quote.accepted',
      expect.objectContaining({
        job_id: JOB_ID,
        quote_id: QUOTE_ID,
        accepted_by: TEST_USER_ID,
      })
    );
    expect(mockSendNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: PROVIDER_ID,
        type: 'job_offer',
        title: 'Your Offer Was Accepted!',
      })
    );
    await Promise.resolve();
    await Promise.resolve();
    expect(mockSendTransactionalEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'quote_accepted',
        to: 'pro@example.com',
        jobTitle: 'Fix sink',
        customerName: 'Casey Customer',
        amountEur: '125.00',
        jobId: JOB_ID,
      })
    );
    expect(vi.mocked(saveIdempotencyResponse)).toHaveBeenCalledWith(
      'idem-accept-2',
      '/api/jobs/[jobId]/accept-quote',
      TEST_USER_ID,
      200,
      { job: { id: JOB_ID, status: 'accepted', accepted_quote_id: QUOTE_ID } }
    );
    expect(body).toEqual({
      job: { id: JOB_ID, status: 'accepted', accepted_quote_id: QUOTE_ID },
    });
  });
});
