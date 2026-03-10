/**
 * Browser Supabase Client
 *
 * Use in: Client components, browser-only code, useEffect hooks
 * Pattern: Module-scope singleton with lazy initialization (safe in browser)
 * Auth: Uses anon key — respects RLS policies
 *
 * @example
 * import { getSupabaseBrowserClient } from '@/lib/supabase/client';
 * const supabase = getSupabaseBrowserClient();
 */
'use client';

import {createBrowserClient} from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (client) return client;

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return client;
}
