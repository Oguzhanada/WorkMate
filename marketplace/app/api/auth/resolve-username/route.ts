import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { apiError } from '@/lib/api/error-response';

/**
 * GET /api/auth/resolve-username?identifier=<username_or_email>
 *
 * Public endpoint used by the login form to resolve a username → email
 * before calling supabase.auth.signInWithPassword.
 *
 * - If identifier contains '@' it is already an email; return it as-is.
 * - Otherwise look up profiles.username (case-insensitive) and return
 *   the associated auth email.
 *
 * Returns: { email: string }
 * Error:   { error: string }  (404 when username not found)
 */
export async function GET(request: NextRequest) {
  const identifier = request.nextUrl.searchParams.get('identifier')?.trim();

  if (!identifier) {
    return apiError('identifier is required', 400);
  }

  // Already an email — return immediately
  if (identifier.includes('@')) {
    return NextResponse.json({ email: identifier });
  }

  const service = getSupabaseServiceClient();

  // Find the profile with this username (case-insensitive)
  const { data: profile, error: profileError } = await service
    .from('profiles')
    .select('id')
    .ilike('username', identifier)
    .maybeSingle();

  if (profileError) {
    return apiError('Lookup failed', 500);
  }

  if (!profile) {
    return apiError('Username not found', 404);
  }

  // Get the email from auth.users
  const { data: authUser, error: authError } = await service.auth.admin.getUserById(profile.id);

  if (authError || !authUser?.user?.email) {
    return apiError('Account not found', 404);
  }

  return NextResponse.json({ email: authUser.user.email });
}
