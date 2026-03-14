/**
 * Idempotency key helpers — migration 083
 *
 * Usage pattern in a route handler:
 *
 *   const iKey = request.headers.get('Idempotency-Key');
 *   if (iKey) {
 *     const cached = await checkIdempotency(iKey, '/api/some/route', user.id);
 *     if (cached) return NextResponse.json(cached.body, { status: cached.status });
 *   }
 *   // ... perform mutation ...
 *   const responseBody = { ... };
 *   if (iKey) {
 *     await saveIdempotencyResponse(iKey, '/api/some/route', user.id, 200, responseBody);
 *   }
 *   return NextResponse.json(responseBody);
 *
 * TTL: 24 hours. Service client required — authenticated users cannot write via RLS.
 */

import { getSupabaseServiceClient } from '@/lib/supabase/service';

export interface IdempotencyRecord {
  status: number;
  body: Record<string, unknown>;
}

/**
 * Returns a cached response if a non-expired idempotency key exists, null otherwise.
 */
export async function checkIdempotency(
  key: string,
  route: string,
  userId: string,
): Promise<IdempotencyRecord | null> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('idempotency_keys')
    .select('response_status, response_body, expires_at')
    .eq('key', key)
    .eq('route', route)
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error || !data) return null;

  return {
    status: data.response_status as number,
    body: data.response_body as Record<string, unknown>,
  };
}

/**
 * Persists a successful response for the given idempotency key.
 * TTL: 24 hours from now.
 * Uses upsert so a retry that arrives before the first write completes is safe.
 */
export async function saveIdempotencyResponse(
  key: string,
  route: string,
  userId: string,
  responseStatus: number,
  responseBody: Record<string, unknown>,
): Promise<void> {
  const supabase = getSupabaseServiceClient();

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await supabase.from('idempotency_keys').upsert(
    {
      key,
      route,
      user_id: userId,
      response_status: responseStatus,
      response_body: responseBody,
      expires_at: expiresAt,
    },
    { onConflict: 'key' },
  );
}
