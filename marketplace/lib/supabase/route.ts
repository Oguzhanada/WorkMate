/**
 * API Route Handler Supabase Client
 *
 * Use in: API route handlers (app/api/.../route.ts)
 * Pattern: New instance per request (async, uses cookies read/write)
 * Auth: Uses anon key — respects RLS policies, reads user session from cookies
 * Note: Can mutate cookies (set/delete) — required for auth operations
 *
 * @example
 * import { getSupabaseRouteClient } from '@/lib/supabase/route';
 * const supabase = await getSupabaseRouteClient();
 */
import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';

export async function getSupabaseRouteClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({name, value, options}) => {
            cookieStore.set(name, value, options);
          });
        }
      }
    }
  );
}
