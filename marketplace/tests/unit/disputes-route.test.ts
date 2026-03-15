import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const TEST_USER_ID = '11111111-1111-1111-1111-111111111111';
const TEST_PROVIDER_ID = '22222222-2222-2222-2222-222222222222';
const TEST_JOB_ID = '33333333-3333-3333-3333-333333333333';

const mockGetUser = vi.fn();
const mockRouteFrom = vi.fn();
const mockServiceFrom = vi.fn();
const mockGetDisputeContext = vi.fn();
const mockIsParticipant = vi.fn();

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
  canAccessAdmin: vi.fn((roles: string[]) => roles.includes('admin')),
}));

vi.mock('@/lib/validation/api', () => ({
  createDisputeSchema: {
    safeParse: vi.fn((data: unknown) => {
      const d = data as Record<string, unknown>;
      const issues: { message: string }[] = [];

      if (!d?.job_id || typeof d.job_id !== 'string') {
        issues.push({ message: 'job_id is required' });
      }
      const validTypes = ['quality_issue', 'non_completion', 'damage', 'no_show', 'no_show_provider', 'no_show_customer', 'pricing_dispute', 'offline_payment', 'other'];
      if (!d?.dispute_type || !validTypes.includes(d.dispute_type as string)) {
        issues.push({ message: 'Invalid dispute_type' });
      }
      if (!d?.customer_claim || typeof d.customer_claim !== 'string' || d.customer_claim.length < 10) {
        issues.push({ message: 'customer_claim must be at least 10 characters' });
      }

      if (issues.length > 0) {
        return { success: false, error: { issues } };
      }
      return { success: true, data: d };
    }),
  },
}));

vi.mock('@/lib/rate-limit/middleware', () => ({
  withRateLimit: vi.fn((_config: unknown, handler: MockRouteHandler) => handler),
  RATE_LIMITS: { WRITE_ENDPOINT: { windowMs: 60_000, max: 30, keyPrefix: 'write' } },
}));

vi.mock('@/lib/api/error-response', async () => {
  const { NextResponse } = await import('next/server');
  return {
    apiError: (msg: string, status: number) => NextResponse.json({ error: msg }, { status }),
    apiValidationError: (issues: unknown[]) => NextResponse.json({ error: 'Validation failed', issues }, { status: 400 }),
    apiUnauthorized: (msg?: string) => NextResponse.json({ error: msg ?? 'Unauthorized' }, { status: 401 }),
    apiForbidden: (msg?: string) => NextResponse.json({ error: msg ?? 'Forbidden' }, { status: 403 }),
    apiNotFound: (msg?: string) => NextResponse.json({ error: msg ?? 'Not found' }, { status: 404 }),
  };
});

vi.mock('@/lib/disputes', () => ({
  getDisputeParticipantContext: (...args: unknown[]) => mockGetDisputeContext(...args),
  isDisputeParticipant: (...args: unknown[]) => mockIsParticipant(...args),
}));

import { POST } from '@/app/api/disputes/route';

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/disputes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  job_id: TEST_JOB_ID,
  dispute_type: 'quality_issue',
  customer_claim: 'The work was not completed to the agreed standard and needs to be redone.',
};

function mockAuthSuccess(userId = TEST_USER_ID) {
  mockGetUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });
}

function mockAuthFailure() {
  mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'Not authenticated' } });
}

const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

/** Helper to build a chainable Supabase-like query mock that resolves when awaited */
function chainable(resolvedValue: unknown) {
  const proxy: unknown = new Proxy({} as Record<string, unknown>, {
    get: (_target, prop) => {
      // Make proxy thenable — resolves to resolvedValue when awaited
      if (prop === 'then') {
        return (resolve: (v: unknown) => void) => resolve(resolvedValue);
      }
      return (..._args: unknown[]) => {
        if (prop === 'maybeSingle' || prop === 'single') return Promise.resolve(resolvedValue);
        return proxy;
      };
    },
  });
  return proxy;
}

function setupMocks(overrides: { jobData?: Record<string, unknown> | null; existingDispute?: unknown } = {}) {
  const jobData = overrides.jobData !== undefined
    ? overrides.jobData
    : {
        id: TEST_JOB_ID,
        status: 'completed',
        dispute_deadline: sevenDaysFromNow,
      };

  const existingDispute = overrides.existingDispute ?? null;

  mockRouteFrom.mockImplementation((table: string) => {
    if (table === 'jobs') {
      return chainable({ data: jobData, error: null });
    }
    if (table === 'disputes') {
      return chainable({ data: existingDispute, error: null });
    }
    return chainable({ data: null, error: null });
  });

  const insertedDispute = {
    id: 'dispute-1',
    job_id: TEST_JOB_ID,
    status: 'open',
    dispute_type: 'quality_issue',
  };

  mockServiceFrom.mockImplementation((table: string) => {
    if (table === 'disputes') {
      return chainable({ data: insertedDispute, error: null });
    }
    if (table === 'payments') {
      return chainable({ data: { stripe_payment_intent_id: 'pi_test_123' }, error: null });
    }
    if (table === 'jobs') {
      return chainable({ error: null });
    }
    if (table === 'user_roles') {
      return chainable({ data: [{ user_id: 'admin-1' }], error: null });
    }
    // dispute_logs, notifications
    return {
      insert: () => Promise.resolve({ error: null }),
    };
  });

  mockGetDisputeContext.mockResolvedValue({
    jobId: TEST_JOB_ID,
    customerId: TEST_USER_ID,
    providerId: TEST_PROVIDER_ID,
  });

  mockIsParticipant.mockImplementation(
    (userId: string, ctx: { customerId: string; providerId: string | null }) =>
      userId === ctx.customerId || userId === ctx.providerId
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthSuccess();
  setupMocks();
});

describe('POST /api/disputes', () => {
  describe('happy path', () => {
    it('creates a dispute and returns 201', async () => {
      const res = await POST(makeRequest(VALID_BODY));
      expect(res.status).toBe(201);

      const body = await res.json();
      expect(body.id || body.dispute).toBeTruthy();
    });
  });

  describe('authentication', () => {
    it('returns 401 when not authenticated', async () => {
      mockAuthFailure();

      const res = await POST(makeRequest(VALID_BODY));
      expect(res.status).toBe(401);
    });
  });

  describe('validation errors', () => {
    it('rejects missing job_id', async () => {
      const res = await POST(makeRequest({
        dispute_type: 'quality_issue',
        customer_claim: 'This is a valid claim with enough characters.',
      }));
      expect(res.status).toBe(400);
    });

    it('rejects invalid dispute_type', async () => {
      const res = await POST(makeRequest({
        job_id: TEST_JOB_ID,
        dispute_type: 'invalid_type',
        customer_claim: 'This is a valid claim with enough characters.',
      }));
      expect(res.status).toBe(400);
    });

    it('rejects customer_claim too short', async () => {
      const res = await POST(makeRequest({
        job_id: TEST_JOB_ID,
        dispute_type: 'quality_issue',
        customer_claim: 'Too short',
      }));
      expect(res.status).toBe(400);
    });

    it('rejects empty body', async () => {
      const res = await POST(makeRequest({}));
      expect(res.status).toBe(400);
    });
  });

  describe('business rule violations', () => {
    it('returns 404 when job does not exist', async () => {
      setupMocks({ jobData: null });

      const res = await POST(makeRequest(VALID_BODY));
      expect(res.status).toBe(404);
    });

    it('rejects dispute for non-completed job', async () => {
      setupMocks({ jobData: { id: TEST_JOB_ID, status: 'in_progress', dispute_deadline: sevenDaysFromNow } });

      const res = await POST(makeRequest(VALID_BODY));
      expect(res.status).toBe(400);
    });

    it('rejects dispute after deadline has passed', async () => {
      const pastDeadline = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      setupMocks({ jobData: { id: TEST_JOB_ID, status: 'completed', dispute_deadline: pastDeadline } });

      const res = await POST(makeRequest(VALID_BODY));
      expect(res.status).toBe(400);
    });

    it('returns 403 when user is not a dispute participant', async () => {
      mockAuthSuccess('99999999-9999-9999-9999-999999999999');

      const res = await POST(makeRequest(VALID_BODY));
      expect(res.status).toBe(403);
    });

    it('rejects if active dispute already exists', async () => {
      setupMocks({ existingDispute: { id: 'existing-dispute', status: 'open' } });

      const res = await POST(makeRequest(VALID_BODY));
      expect(res.status).toBe(400);
    });
  });

  describe('edge cases', () => {
    it('handles malformed JSON body', async () => {
      const req = new NextRequest('http://localhost:3000/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{{bad json',
      });

      const res = await POST(req);
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});
