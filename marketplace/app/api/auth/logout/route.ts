import {NextResponse} from 'next/server';

import {getSupabaseRouteClient} from '@/lib/supabase/route';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';

async function postHandler() {
  const supabase = await getSupabaseRouteClient();
  await supabase.auth.signOut({scope: 'global'});
  return NextResponse.json({ok: true});
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
