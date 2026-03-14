import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const TEST_USER_ID = '11111111-1111-1111-1111-111111111111';
const CATEGORY_ID = '22222222-2222-2222-2222-222222222222';
const PROVIDER_ID = '33333333-3333-3333-3333-333333333333';

const mockGetUser = vi.fn();
const mockRouteFrom = vi.fn();
const mockServiceFrom = vi.fn();
const mockProfileSelect = vi.fn();
const mockCategorySelect = vi.fn();
const mockJobInsert = vi.fn();
const mockAdminRows = vi.fn();
const mockProvidersByCounty = vi.fn();
const mockNotificationsInsert = vi.fn();
const mockNormalizeEircode = vi.fn((value: string) => value.trim().toUpperCase());
const mockFireAutomationEvent = vi.fn();
const mockSendWebhookEvent = vi.fn();

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
  isIdVerified: vi.fn((status?: string | null) => status === 'approved'),
}));

vi.mock('@/lib/ireland/eircode', () => ({
  normalizeEircode: (...args: unknown[]) => mockNormalizeEircode(...args as [string]),
}));

vi.mock('@/lib/automation/engine', () => ({
  fireAutomationEvent: (...args: unknown[]) => mockFireAutomationEvent(...args),
}));

vi.mock('@/lib/webhook/send', () => ({
  sendWebhookEvent: (...args: unknown[]) => mockSendWebhookEvent(...args),
}));

vi.mock('@/lib/validation/api', () => ({
  createJobSchema: {
    safeParse: vi.fn((data: unknown) => {
      const payload = data as Record<string, unknown>;
      if (!payload?.title || !payload?.category_id || !payload?.description) {
        return { success: false, error: { issues: [{ message: 'Missing fields' }] } };
      }

      return { success: true, data: payload };
    }),
  },
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
    apiError: (msg: string, status: number, details?: Record<string, unknown>) =>
      NextResponse.json(details ? { error: msg, ...details } : { error: msg }, { status }),
    apiUnauthorized: (msg?: string) => NextResponse.json({ error: msg ?? 'Unauthorized' }, { status: 401 }),
    apiForbidden: (msg?: string) => NextResponse.json({ error: msg ?? 'Forbidden' }, { status: 403 }),
    apiServerError: (msg?: string) => NextResponse.json({ error: msg ?? 'Server error' }, { status: 500 }),
  };
});

import { POST } from '@/app/api/jobs/route';

function makeRequest(body: unknown, headers?: Record<string, string>): NextRequest {
  return new NextRequest('http://localhost:3000/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

function authSuccess(userId = TEST_USER_ID) {
  mockGetUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });
}

function setupSupabase() {
  mockRouteFrom.mockImplementation((table: string) => {
    if (table === 'profiles') {
      const chain = {
        eq: () => chain,
        maybeSingle: () => mockProfileSelect(),
      };

      return {
        select: () => chain,
      };
    }

    if (table === 'categories') {
      const chain = {
        eq: () => chain,
        maybeSingle: () => mockCategorySelect(),
      };

      return {
        select: () => chain,
      };
    }

    if (table === 'jobs') {
      return {
        insert: (payload: Record<string, unknown>) => ({
          select: () => ({
            single: () => mockJobInsert(payload),
          }),
        }),
      };
    }

    throw new Error(`Unexpected route table: ${table}`);
  });

  mockServiceFrom.mockImplementation((table: string) => {
    if (table === 'user_roles') {
      const chain = {
        eq: () => chain,
        then: (resolve: (value: { data: unknown; error: null }) => unknown) =>
          Promise.resolve({ data: mockAdminRows(), error: null }).then(resolve),
      };

      return {
        select: () => chain,
      };
    }

    if (table === 'pro_service_areas') {
      const chain = {
        eq: () => chain,
        limit: () => chain,
        then: (resolve: (value: { data: unknown; error: null }) => unknown) =>
          Promise.resolve({ data: mockProvidersByCounty(), error: null }).then(resolve),
      };

      return {
        select: () => chain,
      };
    }

    if (table === 'notifications') {
      return {
        insert: (...args: unknown[]) => mockNotificationsInsert(...args),
      };
    }

    throw new Error(`Unexpected service table: ${table}`);
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  setupSupabase();
  authSuccess();
  mockProfileSelect.mockResolvedValue({
    data: { id: TEST_USER_ID, id_verification_status: 'approved' },
    error: null,
  });
  mockCategorySelect.mockResolvedValue({
    data: { id: CATEGORY_ID, name: 'Plumbing' },
    error: null,
  });
  mockJobInsert.mockImplementation(async (payload: Record<string, unknown>) => ({
    data: {
      id: 'job-1',
      created_at: '2026-03-14T12:00:00.000Z',
      status: 'open',
      ...payload,
    },
    error: null,
  }));
  mockAdminRows.mockReturnValue([{ user_id: 'admin-1' }, { user_id: 'admin-2' }]);
  mockProvidersByCounty.mockReturnValue([]);
  mockNotificationsInsert.mockResolvedValue({ error: null });
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.TASK_ALERT_SECRET;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('POST /api/jobs', () => {
  const validBody = {
    title: 'Fix kitchen tap',
    category_id: CATEGORY_ID,
    description: 'Kitchen tap is leaking and needs urgent repair.',
    eircode: ' d02xy76 ',
    county: 'Dublin',
    locality: 'Rathmines',
    budget_range: '50-100',
    task_type: 'in_person',
    job_mode: 'direct_request',
    target_provider_id: PROVIDER_ID,
    photo_urls: ['https://example.com/photo.jpg'],
  };

  it('returns 401 when the user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } });

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(401);
  });

  it('returns cached response when idempotency key matches', async () => {
    const { checkIdempotency } = await import('@/lib/idempotency');
    vi.mocked(checkIdempotency).mockResolvedValueOnce({
      body: { job: { id: 'job-cached' }, customer_verification_status: 'approved', upgrade_message: null },
      status: 201,
    });

    const res = await POST(makeRequest(validBody, { 'Idempotency-Key': 'idem-job-1' }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.job.id).toBe('job-cached');
    expect(mockJobInsert).not.toHaveBeenCalled();
  });

  it('returns 400 when direct request has no target provider', async () => {
    const res = await POST(
      makeRequest({
        ...validBody,
        target_provider_id: null,
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Direct request requires a target provider');
    expect(mockJobInsert).not.toHaveBeenCalled();
  });

  it('creates a direct-request job, fans out notifications, and saves the idempotent response', async () => {
    const { saveIdempotencyResponse } = await import('@/lib/idempotency');

    const res = await POST(makeRequest(validBody, { 'Idempotency-Key': 'idem-job-2' }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(mockNormalizeEircode).toHaveBeenCalledWith(' d02xy76 ');
    expect(mockJobInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_id: TEST_USER_ID,
        category: 'Plumbing',
        category_id: CATEGORY_ID,
        eircode: 'D02XY76',
        job_mode: 'direct_request',
        target_provider_id: PROVIDER_ID,
        requires_verified_id: true,
        created_by_verified_id: true,
        job_visibility_tier: 'verified_tier',
        review_status: 'pending_review',
        auto_close_on_accept: true,
      })
    );
    expect(mockNotificationsInsert).toHaveBeenNthCalledWith(
      1,
      expect.arrayContaining([
        expect.objectContaining({ user_id: 'admin-1', type: 'job_pending_review' }),
        expect.objectContaining({ user_id: 'admin-2', type: 'job_pending_review' }),
      ])
    );
    expect(mockNotificationsInsert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        user_id: PROVIDER_ID,
        type: 'direct_request',
        payload: expect.objectContaining({ job_id: 'job-1', customer_id: TEST_USER_ID }),
      })
    );
    expect(mockFireAutomationEvent).toHaveBeenCalledWith(
      'job_created',
      expect.objectContaining({
        jobId: 'job-1',
        customerId: TEST_USER_ID,
        category: 'Plumbing',
        county: 'Dublin',
        jobMode: 'direct_request',
      })
    );
    expect(mockSendWebhookEvent).toHaveBeenCalledWith(
      'job.created',
      expect.objectContaining({
        job_id: 'job-1',
        customer_id: TEST_USER_ID,
        title: 'Fix kitchen tap',
      })
    );
    expect(vi.mocked(saveIdempotencyResponse)).toHaveBeenCalledWith(
      'idem-job-2',
      'jobs/create',
      TEST_USER_ID,
      201,
      expect.objectContaining({
        job: expect.objectContaining({ id: 'job-1' }),
        customer_verification_status: 'approved',
        upgrade_message: null,
      })
    );
    expect(body).toEqual(
      expect.objectContaining({
        job: expect.objectContaining({ id: 'job-1' }),
        customer_verification_status: 'approved',
        upgrade_message: null,
      })
    );
  });
});
