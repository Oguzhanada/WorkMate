import { NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiUnauthorized, apiServerError } from '@/lib/api/error-response';

async function postHandler() {
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return apiServerError('Server configuration error');
  }

  const serviceClient = getSupabaseServiceClient();
  const { error: deleteError } = await serviceClient.auth.admin.deleteUser(user.id);

  if (deleteError) {
    console.error('Account deletion failed:', deleteError.message);
    return apiServerError();
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete('sb-access-token');
  response.cookies.delete('sb-refresh-token');
  response.cookies.delete('cookie_consent');
  return response;
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
