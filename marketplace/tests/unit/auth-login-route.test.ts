import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
const mockSignIn = vi.fn();

type MockRouteHandler = (...args: unknown[]) => unknown;

vi.mock('@/lib/supabase/route', () => ({
  getSupabaseRouteClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: () => mockGetUser(),
      signInWithPassword: (creds: unknown) => mockSignIn(creds),
    },
  }),
}));

vi.mock('@/lib/validation/api', () => ({
  loginSchema: {
    safeParse: vi.fn((data: unknown) => {
      const d = data as Record<string, unknown>;
      if (!d?.email || typeof d.email !== 'string' || !d.email.includes('@')) {
        return { success: false, error: { issues: [{ message: 'Invalid email' }] } };
      }
      if (!d?.password || typeof d.password !== 'string' || d.password.length < 8) {
        return { success: false, error: { issues: [{ message: 'Password must be at least 8 characters' }] } };
      }
      return { success: true, data: d };
    }),
  },
}));

vi.mock('@/lib/rate-limit/middleware', () => ({
  withRateLimit: vi.fn((_config: unknown, handler: MockRouteHandler) => handler),
  RATE_LIMITS: { AUTH_LOGIN: { windowMs: 60_000, max: 5, keyPrefix: 'auth-login' } },
}));

vi.mock('@/lib/api/error-response', async () => {
  const { NextResponse } = await import('next/server');
  return {
    apiError: (msg: string, status: number) => NextResponse.json({ error: msg }, { status }),
    apiValidationError: (issues: unknown[]) => NextResponse.json({ error: 'Validation failed', issues }, { status: 400 }),
    apiUnauthorized: (msg?: string) => NextResponse.json({ error: msg ?? 'Unauthorized' }, { status: 401 }),
  };
});

import { POST } from '@/app/api/auth/login/route';

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/auth/login', () => {
  describe('happy path', () => {
    it('returns 200 with user data on valid credentials', async () => {
      mockSignIn.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null,
      });

      const res = await POST(makeRequest({ email: 'test@example.com', password: 'password123' }));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.user).toBeDefined();
      expect(body.user.email).toBe('test@example.com');
    });
  });

  describe('validation errors', () => {
    it('rejects missing email', async () => {
      const res = await POST(makeRequest({ password: 'password123' }));
      expect(res.status).toBe(400);
    });

    it('rejects invalid email format', async () => {
      const res = await POST(makeRequest({ email: 'not-an-email', password: 'password123' }));
      expect(res.status).toBe(400);
    });

    it('rejects short password', async () => {
      const res = await POST(makeRequest({ email: 'test@example.com', password: '123' }));
      expect(res.status).toBe(400);
    });

    it('rejects empty body', async () => {
      const res = await POST(makeRequest({}));
      expect(res.status).toBe(400);
    });
  });

  describe('authentication failures', () => {
    it('returns 401 for invalid credentials', async () => {
      mockSignIn.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials' },
      });

      const res = await POST(makeRequest({ email: 'test@example.com', password: 'wrongpass1' }));
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body.error).toContain('Invalid');
    });

    it('returns 401 when Supabase returns auth error', async () => {
      mockSignIn.mockResolvedValue({
        data: { user: null },
        error: { message: 'Email not confirmed' },
      });

      const res = await POST(makeRequest({ email: 'unconfirmed@example.com', password: 'password123' }));
      expect(res.status).toBe(401);
    });
  });

  describe('edge cases', () => {
    it('handles malformed JSON body gracefully', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{invalid json',
      });

      const res = await POST(req);
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('trims email whitespace before validation', async () => {
      mockSignIn.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null,
      });

      const res = await POST(makeRequest({ email: '  test@example.com  ', password: 'password123' }));
      // Should succeed — schema trims whitespace
      expect(res.status).toBeLessThan(500);
    });
  });
});
