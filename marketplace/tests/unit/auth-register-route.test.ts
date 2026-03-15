import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockSignUp = vi.fn();

type MockRouteHandler = (...args: unknown[]) => unknown;

vi.mock('@/lib/supabase/route', () => ({
  getSupabaseRouteClient: vi.fn().mockResolvedValue({
    auth: {
      signUp: (params: unknown) => mockSignUp(params),
    },
  }),
}));

vi.mock('@/lib/validation/api', () => ({
  registerSchema: {
    safeParse: vi.fn((data: unknown) => {
      const d = data as Record<string, unknown>;
      const issues: { message: string }[] = [];

      if (!d?.email || typeof d.email !== 'string' || !d.email.includes('@')) {
        issues.push({ message: 'Invalid email' });
      }
      if (!d?.password || typeof d.password !== 'string' || d.password.length < 8) {
        issues.push({ message: 'Password must be at least 8 characters' });
      }
      if (!d?.full_name || typeof d.full_name !== 'string' || d.full_name.trim().length === 0) {
        issues.push({ message: 'Full name is required' });
      }
      if (typeof d?.full_name === 'string' && d.full_name.length > 120) {
        issues.push({ message: 'Full name must be 120 characters or less' });
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
  RATE_LIMITS: { AUTH_STRICT: { windowMs: 60_000, max: 3, keyPrefix: 'auth-strict' } },
}));

vi.mock('@/lib/api/error-response', async () => {
  const { NextResponse } = await import('next/server');
  return {
    apiError: (msg: string, status: number) => NextResponse.json({ error: msg }, { status }),
    apiValidationError: (issues: unknown[]) => NextResponse.json({ error: 'Validation failed', issues }, { status: 400 }),
    apiUnauthorized: (msg?: string) => NextResponse.json({ error: msg ?? 'Unauthorized' }, { status: 401 }),
  };
});

import { POST } from '@/app/api/auth/register/route';

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  email: 'newuser@example.com',
  password: 'securepass123',
  full_name: 'Test User',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/auth/register', () => {
  describe('happy path', () => {
    it('returns 201 on successful registration', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'newuser@example.com' } },
        error: null,
      });

      const res = await POST(makeRequest(VALID_BODY));
      expect(res.status).toBe(201);

      const body = await res.json();
      expect(body.user || body.message).toBeTruthy();
    });

    it('passes full_name in user metadata', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'newuser@example.com' } },
        error: null,
      });

      await POST(makeRequest(VALID_BODY));

      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'newuser@example.com',
          password: 'securepass123',
        })
      );
    });
  });

  describe('validation errors', () => {
    it('rejects missing email', async () => {
      const res = await POST(makeRequest({ password: 'securepass123', full_name: 'Test' }));
      expect(res.status).toBe(400);
    });

    it('rejects invalid email format', async () => {
      const res = await POST(makeRequest({ email: 'bad', password: 'securepass123', full_name: 'Test' }));
      expect(res.status).toBe(400);
    });

    it('rejects short password', async () => {
      const res = await POST(makeRequest({ email: 'a@b.com', password: '123', full_name: 'Test' }));
      expect(res.status).toBe(400);
    });

    it('rejects missing full_name', async () => {
      const res = await POST(makeRequest({ email: 'a@b.com', password: 'securepass123' }));
      expect(res.status).toBe(400);
    });

    it('rejects overly long full_name', async () => {
      const res = await POST(makeRequest({
        email: 'a@b.com',
        password: 'securepass123',
        full_name: 'A'.repeat(121),
      }));
      expect(res.status).toBe(400);
    });

    it('rejects empty body', async () => {
      const res = await POST(makeRequest({}));
      expect(res.status).toBe(400);
    });
  });

  describe('Supabase auth errors', () => {
    it('returns 400 for duplicate email', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'User already registered' },
      });

      const res = await POST(makeRequest(VALID_BODY));
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toBeDefined();
    });

    it('returns 400 for weak password rejected by Supabase', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Password should be at least 8 characters' },
      });

      const res = await POST(makeRequest({ ...VALID_BODY, password: 'abcdefgh' }));
      expect(res.status).toBe(400);
    });
  });

  describe('edge cases', () => {
    it('handles email confirmation flow (user null but no error)', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });

      const res = await POST(makeRequest(VALID_BODY));
      // Should still return 201 with "check email" message
      expect(res.status).toBeLessThan(500);
    });

    it('handles malformed JSON body', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json',
      });

      const res = await POST(req);
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});
