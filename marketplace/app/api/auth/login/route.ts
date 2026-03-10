import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { loginSchema } from '@/lib/validation/api';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiValidationError, apiUnauthorized } from '@/lib/api/error-response';

async function handler(request: NextRequest): Promise<NextResponse> {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = loginSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues);
  }

  const { email, password } = parsed.data;
  const supabase = await getSupabaseRouteClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return apiUnauthorized(error.message);
  }

  return NextResponse.json({
    user: { id: data.user.id, email: data.user.email },
  });
}

export const POST = withRateLimit(RATE_LIMITS.AUTH_LOGIN, handler);
