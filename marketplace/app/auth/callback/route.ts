import {NextRequest, NextResponse} from 'next/server';

import {getSupabaseRouteClient} from '@/lib/supabase/route';

function sanitizeNext(path: string | null) {
  if (!path || !path.startsWith('/')) return '/';
  return path;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = sanitizeNext(url.searchParams.get('next'));

  if (!code) {
    return NextResponse.redirect(new URL(`${next}?error=missing_code`, url.origin));
  }

  const supabase = await getSupabaseRouteClient();
  const {error} = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(`${next}?error=auth_callback_failed`, url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
