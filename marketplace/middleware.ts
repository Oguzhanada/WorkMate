import createMiddleware from 'next-intl/middleware';
import {NextResponse, type NextRequest} from 'next/server';

import {defaultLocale, locales} from './i18n/config';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
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
  return /^\/(en|tr|pt|es)\/(giris|uye-ol)\/?$/.test(pathname);
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

export default function middleware(request: NextRequest) {
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

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/about', '/giris', '/uye-ol', '/hizmet-ver', '/hizmet/:path*', '/arama', '/privacy-policy', '/terms', '/cookie-policy', '/(en|tr|pt|es)/:path*']
};
