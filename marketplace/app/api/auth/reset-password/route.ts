import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { resetPasswordSchema } from '@/lib/validation/api';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiValidationError } from '@/lib/api/error-response';

async function handler(request: NextRequest): Promise<NextResponse> {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = resetPasswordSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues);
  }

  const { email } = parsed.data;
  const supabase = await getSupabaseRouteClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback?next=/reset-password`,
  });

  if (error) {
    // Do not reveal whether the email exists — always return success
    console.error('[reset-password] Supabase error:', error.message);
  }

  // Always return 200 to prevent email enumeration
  return NextResponse.json({
    message: 'If an account exists with that email, a reset link has been sent.',
  });
}

export const POST = withRateLimit(RATE_LIMITS.AUTH_STRICT, handler);
