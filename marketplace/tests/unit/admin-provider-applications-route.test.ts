import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const TEST_ADMIN_ID = '11111111-1111-1111-1111-111111111111';
const TEST_PROFILE_ID = '22222222-2222-2222-2222-222222222222';

const mockEnsureAdmin = vi.fn();
const mockServiceFrom = vi.fn();

type MockRouteHandler = (...args: unknown[]) => unknown;

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

vi.mock('@/lib/auth/admin', () => ({
  ensureAdminRoute: () => mockEnsureAdmin(),
}));

vi.mock('@/lib/supabase/service', () => ({
  getSupabaseServiceClient: vi.fn(() => ({
    from: (...args: unknown[]) => mockServiceFrom(...args),
    storage: {
      from: () => ({
        createSignedUrl: () => Promise.resolve({ data: { signedUrl: 'https://signed.url/doc.pdf' }, error: null }),
      }),
    },
  })),
}));

vi.mock('@/lib/admin/audit', () => ({
  logAdminAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/validation/api', () => ({
  adminProviderFiltersSchema: {
    safeParse: vi.fn((data: unknown) => ({ success: true, data: data ?? {} })),
  },
  adminProviderDecisionSchema: {
    safeParse: vi.fn((data: unknown) => {
      const d = data as Record<string, unknown>;
      const issues: { message: string }[] = [];

      if (!d?.profile_id || typeof d.profile_id !== 'string') {
        issues.push({ message: 'profile_id is required' });
      }
      const validDecisions = ['approve', 'reject', 'request_changes'];
      if (!d?.decision || !validDecisions.includes(d.decision as string)) {
        issues.push({ message: 'Invalid decision' });
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
  RATE_LIMITS: {
    ADMIN_READ: { windowMs: 60_000, max: 60, keyPrefix: 'admin-read' },
    WRITE_ENDPOINT: { windowMs: 60_000, max: 30, keyPrefix: 'write' },
  },
}));

vi.mock('@/lib/api/error-response', async () => {
  const { NextResponse: NR } = await import('next/server');
  return {
    apiError: (msg: string, status: number) => NR.json({ error: msg }, { status }),
    apiValidationError: (issues: unknown[]) => NR.json({ error: 'Validation failed', issues }, { status: 400 }),
    apiUnauthorized: (msg?: string) => NR.json({ error: msg ?? 'Unauthorized' }, { status: 401 }),
    apiForbidden: (msg?: string) => NR.json({ error: msg ?? 'Forbidden' }, { status: 403 }),
    apiNotFound: (msg?: string) => NR.json({ error: msg ?? 'Not found' }, { status: 404 }),
  };
});

import { GET, PATCH } from '@/app/api/admin/provider-applications/route';

function makeGetRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/admin/provider-applications');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString(), { method: 'GET' });
}

function makePatchRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/admin/provider-applications', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** Build a mock supabase client that returns chainable queries */
function makeMockSupabase(tableOverrides: Record<string, unknown> = {}) {
  return {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: TEST_ADMIN_ID } }, error: null }) },
    from: (table: string) => {
      if (table in tableOverrides) {
        return tableOverrides[table];
      }
      return chainable({ data: [], error: null });
    },
    storage: {
      from: () => ({
        createSignedUrl: () => Promise.resolve({ data: { signedUrl: 'https://signed.url/doc.pdf' }, error: null }),
      }),
    },
  };
}

function mockAdminAuth(supabaseOverrides: Record<string, unknown> = {}) {
  const mockSupabase = makeMockSupabase(supabaseOverrides);
  mockEnsureAdmin.mockResolvedValue({ supabase: mockSupabase, user: { id: TEST_ADMIN_ID }, error: null });
  return mockSupabase;
}

function mockUnauthenticated() {
  mockEnsureAdmin.mockResolvedValue({
    supabase: makeMockSupabase(),
    user: null,
    error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
  });
}

function mockForbidden() {
  mockEnsureAdmin.mockResolvedValue({
    supabase: makeMockSupabase(),
    user: null,
    error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/admin/provider-applications', () => {
  describe('authorization', () => {
    it('returns 401 when not authenticated', async () => {
      mockUnauthenticated();
      const res = await GET(makeGetRequest());
      expect(res.status).toBe(401);
    });

    it('returns 403 when user is not admin', async () => {
      mockForbidden();
      const res = await GET(makeGetRequest());
      expect(res.status).toBe(403);
    });
  });

  describe('happy path', () => {
    it('returns 200 with applications list', async () => {
      const profiles = [
        {
          id: TEST_PROFILE_ID,
          full_name: 'Test Provider',
          phone: '+353851234567',
          role: 'customer',
          verification_status: 'pending',
          id_verification_status: 'pending',
          created_at: new Date().toISOString(),
          stripe_requirements_due: null,
        },
      ];

      mockAdminAuth({
        profiles: chainable({ data: profiles, error: null }),
        pro_documents: chainable({ data: [], error: null }),
        addresses: chainable({ data: [], error: null }),
        admin_audit_logs: chainable({ data: [], error: null }),
      });

      const res = await GET(makeGetRequest());
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.applications || Array.isArray(body)).toBeTruthy();
    });

    it('accepts filter parameters', async () => {
      mockAdminAuth({
        profiles: chainable({ data: [], error: null }),
        pro_documents: chainable({ data: [], error: null }),
        addresses: chainable({ data: [], error: null }),
        admin_audit_logs: chainable({ data: [], error: null }),
      });

      const res = await GET(makeGetRequest({ status: 'pending', date_range: '7d' }));
      expect(res.status).toBe(200);
    });

    it('returns empty list when no profiles match', async () => {
      mockAdminAuth({
        profiles: chainable({ data: [], error: null }),
        admin_audit_logs: chainable({ data: [], error: null }),
      });

      const res = await GET(makeGetRequest());
      expect(res.status).toBe(200);
    });
  });
});

describe('PATCH /api/admin/provider-applications', () => {
  function setupPatchAdmin() {
    const existingProfile = {
      id: TEST_PROFILE_ID,
      full_name: 'Test Provider',
      role: 'customer',
      verification_status: 'pending',
      id_verification_status: 'pending',
      is_verified: false,
      stripe_requirements_due: { application_status: 'submitted' },
    };

    const docs = [
      { document_type: 'id_verification', verification_status: 'verified' },
      { document_type: 'public_liability_insurance', verification_status: 'verified' },
    ];

    const supabase = mockAdminAuth({
      profiles: chainable({ data: existingProfile, error: null }),
      pro_documents: chainable({ data: docs, error: null }),
    });

    // Service client mocks for mutations
    mockServiceFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return chainable({ data: null, error: null });
      }
      if (table === 'user_roles') {
        return {
          upsert: () => Promise.resolve({ error: null }),
          delete: () => chainable({ error: null }),
        };
      }
      if (table === 'pro_documents') {
        return chainable({ data: [], error: null });
      }
      // notifications, admin_audit_logs
      return {
        insert: () => Promise.resolve({ error: null }),
      };
    });

    return supabase;
  }

  describe('authorization', () => {
    it('returns 401 when not authenticated', async () => {
      mockUnauthenticated();
      const res = await PATCH(makePatchRequest({ profile_id: TEST_PROFILE_ID, decision: 'approve' }));
      expect(res.status).toBe(401);
    });

    it('returns 403 when user is not admin', async () => {
      mockForbidden();
      const res = await PATCH(makePatchRequest({ profile_id: TEST_PROFILE_ID, decision: 'approve' }));
      expect(res.status).toBe(403);
    });
  });

  describe('validation', () => {
    it('rejects missing profile_id', async () => {
      mockAdminAuth();
      const res = await PATCH(makePatchRequest({ decision: 'approve' }));
      expect(res.status).toBe(400);
    });

    it('rejects invalid decision', async () => {
      mockAdminAuth();
      const res = await PATCH(makePatchRequest({ profile_id: TEST_PROFILE_ID, decision: 'invalid' }));
      expect(res.status).toBe(400);
    });
  });

  describe('approve flow', () => {
    it('approves provider application with verified documents — returns 200', async () => {
      setupPatchAdmin();
      const res = await PATCH(makePatchRequest({ profile_id: TEST_PROFILE_ID, decision: 'approve' }));
      expect(res.status).toBe(200);
    });
  });

  describe('reject flow', () => {
    it('rejects provider application with note — returns 200', async () => {
      setupPatchAdmin();
      const res = await PATCH(makePatchRequest({
        profile_id: TEST_PROFILE_ID,
        decision: 'reject',
        note: 'Documents are not valid.',
      }));
      expect(res.status).toBe(200);
    });
  });

  describe('request_changes flow', () => {
    it('requests changes with note — returns 200', async () => {
      setupPatchAdmin();
      const res = await PATCH(makePatchRequest({
        profile_id: TEST_PROFILE_ID,
        decision: 'request_changes',
        note: 'Please re-upload your insurance certificate.',
      }));
      expect(res.status).toBe(200);
    });
  });

  describe('edge cases', () => {
    it('handles malformed JSON body', async () => {
      mockAdminAuth();
      const req = new NextRequest('http://localhost:3000/api/admin/provider-applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: '{{bad',
      });

      const res = await PATCH(req);
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});
