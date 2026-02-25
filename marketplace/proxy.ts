import {createServerClient} from '@supabase/ssr';
import createMiddleware from 'next-intl/middleware';
import {NextResponse, type NextRequest} from 'next/server';

import {defaultLocale, locales} from './i18n/config';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'never'
});

type Bucket = {
  count: number;
  resetAt: number;
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_ATTEMPTS = 10;

const rateLimitStore = new Map<string, Bucket>();

function getClientIdentifier(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return request.headers.get('x-real-ip') ?? 'unknown';
}

function isAuthMutationPath(pathname: string) {
  return /^\/(login|sign-up)\/?$/.test(pathname);
}

function allowRequest(key: string) {
  const now = Date.now();
  const bucket = rateLimitStore.get(key);

  if (!bucket || bucket.resetAt < now) {
    rateLimitStore.set(key, {count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS});
    return {allowed: true, retryAfterMs: 0};
  }

  if (bucket.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return {allowed: false, retryAfterMs: bucket.resetAt - now};
  }

  bucket.count += 1;
  return {allowed: true, retryAfterMs: 0};
}

export async function proxy(request: NextRequest) {
  // OAuth callback route must bypass locale rewrites and reach its route handler directly.
  if (request.nextUrl.pathname === '/auth/callback') {
    return NextResponse.next();
  }

  if (request.method === 'POST' && isAuthMutationPath(request.nextUrl.pathname)) {
    const ip = getClientIdentifier(request);
    const key = `${ip}:${request.nextUrl.pathname}`;
    const rateLimit = allowRequest(key);

    if (!rateLimit.allowed) {
      const response = NextResponse.json(
        {error: 'Too many requests. Please try again shortly.'},
        {status: 429}
      );
      response.headers.set('Retry-After', Math.ceil(rateLimit.retryAfterMs / 1000).toString());
      return response;
    }
  }

  const response = intlMiddleware(request);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({name, value}) => request.cookies.set(name, value));
          cookiesToSet.forEach(({name, value, options}) => response.cookies.set(name, value, options));
        }
      }
    }
  );

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next|.*\\..*).*)'
  ]
};
