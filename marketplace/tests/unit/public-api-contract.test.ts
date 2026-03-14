import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Mocks ──────────────────────────────────────────────────────────────────────

// Mock Supabase service client
vi.mock('@/lib/supabase/service', () => ({
  getSupabaseServiceClient: vi.fn(),
}));

// Mock public-auth to bypass API key validation
vi.mock('@/lib/api/public-auth', () => ({
  authenticatePublicRequest: vi.fn(),
}));

// Mock rate-limit middleware to passthrough
vi.mock('@/lib/rate-limit/middleware', () => ({
  withRateLimit: (_config: unknown, handler: unknown) => handler,
  RATE_LIMITS: { WRITE_ENDPOINT: { windowMs: 60000, max: 10, keyPrefix: 'test' } },
}));

// Mock request-id middleware to passthrough
vi.mock('@/lib/request-id/middleware', () => ({
  withRequestId: (handler: unknown) => handler,
}));

import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { authenticatePublicRequest, type PublicAuthResult } from '@/lib/api/public-auth';

// ── Helpers ────────────────────────────────────────────────────────────────────

const PROFILE_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

function authSuccess(): PublicAuthResult {
  return { profileId: PROFILE_ID, error: null };
}

/**
 * Build a mock Supabase client supporting chaining methods used by the routes.
 * `tableData` maps table names to their resolved data.
 * `tableErrors` maps table names to error messages (optional).
 */
function makeMockClient(
  tableData: Record<string, unknown> = {},
  tableErrors: Record<string, string> = {},
) {
  const makeChain = (table: string) => {
    const value = tableData[table] ?? null;
    const err = tableErrors[table] ? { message: tableErrors[table] } : null;
    const terminal = () => Promise.resolve({ data: value, error: err });
    const chain: Record<string, unknown> = {};
    chain.select = () => chain;
    chain.eq = () => chain;
    chain.or = () => chain;
    chain.not = () => chain;
    chain.in = () => chain;
    chain.ilike = () => chain;
    chain.order = () => chain;
    chain.range = () => chain;
    chain.limit = () => chain;
    chain.insert = () => chain;
    chain.delete = () => chain;
    chain.single = terminal;
    chain.maybeSingle = terminal;
    // Default: resolve as array
    chain.then = (resolve: (v: { data: unknown; error: unknown }) => void) =>
      Promise.resolve({ data: value, error: err }).then(resolve);
    return chain;
  };
  return {
    from: (table: string) => makeChain(table),
    rpc: () => Promise.resolve({ data: null, error: null }),
  };
}

function makeRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

function setAuth(result: PublicAuthResult) {
  vi.mocked(authenticatePublicRequest).mockResolvedValue(result);
}

function setClient(
  tableData: Record<string, unknown> = {},
  tableErrors: Record<string, string> = {},
) {
  vi.mocked(getSupabaseServiceClient).mockReturnValue(
    makeMockClient(tableData, tableErrors) as unknown as ReturnType<typeof getSupabaseServiceClient>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── 1. GET /api/public/v1/jobs ─────────────────────────────────────────────────

describe('GET /api/public/v1/jobs — list jobs', () => {
  async function callListJobs(params: Record<string, string> = {}) {
    const { GET } = await import('@/app/api/public/v1/jobs/route');
    const url = new URL('http://localhost:3000/api/public/v1/jobs');
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const req = new NextRequest(url);
    return GET(req);
  }

  it('returns jobs array and pagination object on success', async () => {
    setAuth(authSuccess());
    const mockJobs = [
      {
        id: '1',
        title: 'Fix tap',
        category: 'Plumbing',
        description: 'Leaky tap',
        county: 'Dublin',
        locality: 'Drumcondra',
        budget_range: '50-100',
        status: 'open',
        created_at: '2026-01-01T00:00:00Z',
        expires_at: null,
      },
    ];
    setClient({ jobs: mockJobs });

    const res = await callListJobs();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty('jobs');
    expect(body).toHaveProperty('pagination');
    expect(Array.isArray(body.jobs)).toBe(true);
    expect(body.pagination).toEqual(
      expect.objectContaining({
        limit: expect.any(Number),
        offset: expect.any(Number),
        count: expect.any(Number),
      }),
    );
  });

  it('job objects contain all required fields', async () => {
    setAuth(authSuccess());
    const mockJob = {
      id: '2',
      title: 'Paint wall',
      category: 'Painting',
      description: 'Hallway wall',
      county: 'Cork',
      locality: 'Ballincollig',
      budget_range: '100-200',
      status: 'open',
      created_at: '2026-01-15T00:00:00Z',
      expires_at: '2026-03-15T00:00:00Z',
    };
    setClient({ jobs: [mockJob] });

    const res = await callListJobs();
    const body = await res.json();
    const job = body.jobs[0];

    const requiredFields = [
      'id', 'title', 'category', 'description', 'county',
      'locality', 'budget_range', 'status', 'created_at', 'expires_at',
    ];
    for (const field of requiredFields) {
      expect(job).toHaveProperty(field);
    }
  });

  it('returns empty jobs array when no results', async () => {
    setAuth(authSuccess());
    setClient({ jobs: [] });

    const res = await callListJobs();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.jobs).toEqual([]);
    expect(body.pagination.count).toBe(0);
  });

  it('returns 400 with error shape for invalid limit param', async () => {
    setAuth(authSuccess());
    setClient();

    const res = await callListJobs({ limit: 'abc' });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toHaveProperty('error');
    expect(typeof body.error).toBe('string');
  });

  it('defaults to limit=20, offset=0 when no params', async () => {
    setAuth(authSuccess());
    setClient({ jobs: [] });

    const res = await callListJobs();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.pagination.limit).toBe(20);
    expect(body.pagination.offset).toBe(0);
  });
});

// ── 2. GET /api/public/v1/jobs/[id] ────────────────────────────────────────────

describe('GET /api/public/v1/jobs/[id] — single job', () => {
  async function callGetJob(id: string) {
    const { GET } = await import('@/app/api/public/v1/jobs/[id]/route');
    const req = makeRequest(`/api/public/v1/jobs/${id}`);
    return GET(req, { params: Promise.resolve({ id }) });
  }

  it('returns a job object wrapped in { job } on success', async () => {
    setAuth(authSuccess());
    const mockJob = {
      id: '123',
      title: 'Clean gutters',
      category: 'Maintenance',
      description: 'Roof gutters',
      county: 'Galway',
      locality: 'Salthill',
      budget_range: '80-120',
      status: 'open',
      created_at: '2026-02-01T00:00:00Z',
    };
    setClient({ jobs: mockJob });

    const res = await callGetJob('123');
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty('job');
    expect(body.job).toEqual(mockJob);
  });

  it('job object contains all required fields', async () => {
    setAuth(authSuccess());
    const mockJob = {
      id: '456',
      title: 'Tile bathroom',
      category: 'Tiling',
      description: 'Full retile',
      county: 'Limerick',
      locality: 'Castletroy',
      budget_range: '200-400',
      status: 'open',
      created_at: '2026-02-10T00:00:00Z',
    };
    setClient({ jobs: mockJob });

    const res = await callGetJob('456');
    const body = await res.json();

    const requiredFields = [
      'id', 'title', 'category', 'description', 'county',
      'locality', 'budget_range', 'status', 'created_at',
    ];
    for (const field of requiredFields) {
      expect(body.job).toHaveProperty(field);
    }
  });

  it('returns 404 with { error } when job not found', async () => {
    setAuth(authSuccess());
    setClient({ jobs: null });

    const res = await callGetJob('nonexistent');
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toHaveProperty('error');
    expect(typeof body.error).toBe('string');
    expect(body.error).toBe('Job not found');
  });

  it('returns 500 with { error } on database error', async () => {
    setAuth(authSuccess());
    setClient({}, { jobs: 'connection failed' });

    const res = await callGetJob('123');
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toHaveProperty('error');
    expect(typeof body.error).toBe('string');
  });
});

// ── 3. GET /api/public/v1/providers ────────────────────────────────────────────

describe('GET /api/public/v1/providers — list providers', () => {
  async function callListProviders(params: Record<string, string> = {}) {
    const { GET } = await import('@/app/api/public/v1/providers/route');
    const url = new URL('http://localhost:3000/api/public/v1/providers');
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const req = new NextRequest(url);
    return GET(req);
  }

  it('returns providers array and pagination on success', async () => {
    setAuth(authSuccess());
    const mockProviders = [
      {
        id: 'p1',
        full_name: 'Jane Murphy',
        avatar_url: null,
        verification_status: 'verified',
        created_at: '2026-01-01T00:00:00Z',
      },
    ];
    setClient({
      user_roles: [],
      profiles: mockProviders,
      pro_services: [{ profile_id: 'p1', category_id: 'cat1' }],
      pro_service_areas: [{ profile_id: 'p1', county: 'Dublin' }],
      categories: [{ id: 'cat1', name: 'Plumbing' }],
    });

    const res = await callListProviders();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty('providers');
    expect(Array.isArray(body.providers)).toBe(true);
    expect(body).toHaveProperty('pagination');
    expect(body.pagination).toEqual(
      expect.objectContaining({
        limit: expect.any(Number),
        offset: expect.any(Number),
        count: expect.any(Number),
      }),
    );
  });

  it('provider objects include enriched services and counties arrays', async () => {
    setAuth(authSuccess());
    const mockProviders = [
      {
        id: 'p2',
        full_name: 'Sean Kelly',
        avatar_url: 'https://example.com/avatar.jpg',
        verification_status: 'verified',
        created_at: '2026-01-05T00:00:00Z',
      },
    ];
    setClient({
      user_roles: [],
      profiles: mockProviders,
      pro_services: [{ profile_id: 'p2', category_id: 'cat2' }],
      pro_service_areas: [{ profile_id: 'p2', county: 'Cork' }],
      categories: [{ id: 'cat2', name: 'Electrical' }],
    });

    const res = await callListProviders();
    const body = await res.json();
    const provider = body.providers[0];

    expect(provider).toHaveProperty('id');
    expect(provider).toHaveProperty('full_name');
    expect(provider).toHaveProperty('verification_status');
    expect(provider).toHaveProperty('created_at');
    expect(provider).toHaveProperty('services');
    expect(provider).toHaveProperty('counties');
    expect(Array.isArray(provider.services)).toBe(true);
    expect(Array.isArray(provider.counties)).toBe(true);
  });

  it('returns empty providers array when no results', async () => {
    setAuth(authSuccess());
    setClient({ user_roles: [], profiles: [] });

    const res = await callListProviders();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.providers).toEqual([]);
  });

  it('defaults to limit=20 and offset=0', async () => {
    setAuth(authSuccess());
    const mockProviders = [
      {
        id: 'p3',
        full_name: 'Mary Byrne',
        avatar_url: null,
        verification_status: 'verified',
        created_at: '2026-02-01T00:00:00Z',
      },
    ];
    setClient({
      user_roles: [],
      profiles: mockProviders,
      pro_services: [],
      pro_service_areas: [],
      categories: [],
    });

    const res = await callListProviders();
    const body = await res.json();

    expect(body.pagination.limit).toBe(20);
    expect(body.pagination.offset).toBe(0);
  });
});

// ── 4. POST /api/public/v1/webhooks/subscribe ──────────────────────────────────

describe('POST /api/public/v1/webhooks/subscribe — create subscription', () => {
  async function callSubscribe(body: unknown) {
    const { POST } = await import('@/app/api/public/v1/webhooks/subscribe/route');
    const req = makeRequest('/api/public/v1/webhooks/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return POST(req);
  }

  it('returns 201 with subscription, signing_secret, and note on success', async () => {
    setAuth(authSuccess());
    const mockSubscription = {
      id: 'sub-1',
      url: 'https://example.com/webhook',
      events: ['job.created'],
      enabled: true,
      created_at: '2026-03-01T00:00:00Z',
    };
    setClient({ webhook_subscriptions: mockSubscription });

    const res = await callSubscribe({
      url: 'https://example.com/webhook',
      events: ['job.created'],
    });
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body).toHaveProperty('subscription');
    expect(body).toHaveProperty('signing_secret');
    expect(body).toHaveProperty('note');
    expect(typeof body.signing_secret).toBe('string');
    expect(body.signing_secret.length).toBe(64); // 32 bytes hex
  });

  it('subscription object contains expected fields', async () => {
    setAuth(authSuccess());
    const mockSubscription = {
      id: 'sub-2',
      url: 'https://hooks.example.com/wm',
      events: ['quote.accepted', 'payment.completed'],
      enabled: true,
      created_at: '2026-03-02T00:00:00Z',
    };
    setClient({ webhook_subscriptions: mockSubscription });

    const res = await callSubscribe({
      url: 'https://hooks.example.com/wm',
      events: ['quote.accepted', 'payment.completed'],
    });
    const body = await res.json();
    const sub = body.subscription;

    expect(sub).toHaveProperty('id');
    expect(sub).toHaveProperty('url');
    expect(sub).toHaveProperty('events');
    expect(sub).toHaveProperty('enabled');
    expect(sub).toHaveProperty('created_at');
  });

  it('returns 400 with { error } for invalid JSON body', async () => {
    setAuth(authSuccess());
    const { POST } = await import('@/app/api/public/v1/webhooks/subscribe/route');
    const req = makeRequest('/api/public/v1/webhooks/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toHaveProperty('error');
    expect(typeof body.error).toBe('string');
  });

  it('returns 400 with { error } for missing url field', async () => {
    setAuth(authSuccess());

    const res = await callSubscribe({ events: ['job.created'] });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toHaveProperty('error');
    expect(body.error).toBe('Validation failed');
  });

  it('returns 400 with { error } for non-HTTPS url', async () => {
    setAuth(authSuccess());

    const res = await callSubscribe({
      url: 'http://insecure.example.com/hook',
      events: ['job.created'],
    });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toHaveProperty('error');
  });
});

// ── 5. DELETE /api/public/v1/webhooks/subscribe/[id] ───────────────────────────

describe('DELETE /api/public/v1/webhooks/subscribe/[id] — unsubscribe', () => {
  async function callUnsubscribe(id: string) {
    const { DELETE } = await import(
      '@/app/api/public/v1/webhooks/subscribe/[id]/route'
    );
    const req = makeRequest(`/api/public/v1/webhooks/subscribe/${id}`, {
      method: 'DELETE',
    });
    return DELETE(req, { params: Promise.resolve({ id }) });
  }

  it('returns { success: true, id } on successful delete', async () => {
    setAuth(authSuccess());
    setClient({ webhook_subscriptions: { id: 'sub-99' } });

    const res = await callUnsubscribe('sub-99');
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('id');
    expect(typeof body.id).toBe('string');
  });

  it('returns 404 with { error } when subscription not found', async () => {
    setAuth(authSuccess());
    setClient({ webhook_subscriptions: null });

    const res = await callUnsubscribe('nonexistent');
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toHaveProperty('error');
    expect(body.error).toBe('Subscription not found');
  });

  it('returns error shape on database error', async () => {
    setAuth(authSuccess());
    setClient({}, { webhook_subscriptions: 'delete failed' });

    const res = await callUnsubscribe('sub-99');
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toHaveProperty('error');
    expect(typeof body.error).toBe('string');
  });
});

// ── 6. Auth error response consistency ─────────────────────────────────────────

describe('Auth error responses are consistent across endpoints', () => {
  it('returns 401 { error } when auth fails on list jobs', async () => {
    const authError = {
      profileId: null,
      error: new (await import('next/server')).NextResponse(
        JSON.stringify({ error: 'Missing x-api-key header.' }),
        { status: 401, headers: { 'content-type': 'application/json' } },
      ),
    } as PublicAuthResult;
    setAuth(authError);

    const { GET } = await import('@/app/api/public/v1/jobs/route');
    const req = makeRequest('/api/public/v1/jobs');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toHaveProperty('error');
    expect(typeof body.error).toBe('string');
  });

  it('returns 401 { error } when auth fails on single job', async () => {
    const { NextResponse: NR } = await import('next/server');
    const authError = {
      profileId: null,
      error: new NR(
        JSON.stringify({ error: 'Invalid API key.' }),
        { status: 401, headers: { 'content-type': 'application/json' } },
      ),
    } as PublicAuthResult;
    setAuth(authError);

    const { GET } = await import('@/app/api/public/v1/jobs/[id]/route');
    const req = makeRequest('/api/public/v1/jobs/123');
    const res = await GET(req, { params: Promise.resolve({ id: '123' }) });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toHaveProperty('error');
  });
});
