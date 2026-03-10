import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { registerSchema } from '@/lib/validation/api';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiValidationError } from '@/lib/api/error-response';

async function handler(request: NextRequest): Promise<NextResponse> {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = registerSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues);
  }

  const { email, password, full_name } = parsed.data;
  const supabase = await getSupabaseRouteClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name },
    },
  });

  if (error) {
    return apiError(error.message, 400);
  }

  return NextResponse.json(
    {
      user: data.user ? { id: data.user.id, email: data.user.email } : null,
      message: 'Check your email to confirm your account.',
    },
    { status: 201 }
  );
}

export const POST = withRateLimit(RATE_LIMITS.AUTH_STRICT, handler);
