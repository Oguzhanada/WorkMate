/**
 * Service-Role Supabase Client (PRIVILEGED)
 *
 * Use in: Admin operations, cron jobs, webhooks, background tasks
 * Pattern: New instance per call (no caching, no session)
 * Auth: Uses service-role key — BYPASSES ALL RLS POLICIES
 * WARNING: Only use when you need to bypass RLS (admin ops, system tasks)
 *
 * @example
 * import { getSupabaseServiceClient } from '@/lib/supabase/service';
 * const supabase = getSupabaseServiceClient();
 */
import { createClient } from '@supabase/supabase-js';

export function getSupabaseServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
