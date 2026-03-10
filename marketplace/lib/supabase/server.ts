/**
 * Server Component Supabase Client
 *
 * Use in: Server Components, server-side data fetching (page.tsx, layout.tsx)
 * Pattern: New instance per request (async, uses cookies read-only)
 * Auth: Uses anon key — respects RLS policies, reads user session from cookies
 * Note: Cannot mutate cookies (read-only in Server Components)
 *
 * @example
 * import { getSupabaseServerClient } from '@/lib/supabase/server';
 * const supabase = await getSupabaseServerClient();
 */
import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';

export async function getSupabaseServerClient() {
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
          try {
            cookiesToSet.forEach(({name, value, options}) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Ignore when called from server components that cannot mutate cookies.
          }
        }
      }
    }
  );
}
