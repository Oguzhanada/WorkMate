import {NextResponse} from 'next/server';

import {getSupabaseRouteClient} from '@/lib/supabase/route';

export async function POST() {
  const supabase = await getSupabaseRouteClient();
  await supabase.auth.signOut({scope: 'global'});
  return NextResponse.json({ok: true});
}

