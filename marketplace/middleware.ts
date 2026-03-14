import {createServerClient} from '@supabase/ssr';
import createMiddleware from 'next-intl/middleware';
import {NextRequest, NextResponse} from 'next/server';

import {defaultLocale, locales} from './i18n/config';
import {rateLimit, RATE_LIMITS} from './lib/rate-limit';
import {buildCspHeader, getCspResponseHeaderName} from './lib/security/csp';
import {getCspTierForPath, type CspTier} from './lib/security/csp-routes';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'never'
});

// Layer 1 (edge) rate limiting — protects auth endpoints (login, signup) before
// any route handler executes. Complements the per-route withRateLimit (Layer 2
// in lib/rate-limit/middleware.ts) which covers API routes. Both layers are
// intentional defense-in-depth: auth mutations need early rejection at the edge.
const checkAuthRateLimit = rateLimit(RATE_LIMITS.AUTH_LOGIN);

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

function isProtectedPath(pathname: string) {
  if (/^\/profile\/public(?:\/|$)/.test(pathname)) return false;
  return /^\/(profile|dashboard)(?:\/|$)/.test(pathname);
}

function applyPageSecurityHeaders(response: NextResponse, requestId: string, cspTier: CspTier, cspHeader: string) {
  response.headers.set(getCspResponseHeaderName(), cspHeader);
  response.headers.set('x-csp-tier', cspTier);
  response.headers.set('x-request-id', requestId);
  return response;
}

export async function middleware(request: NextRequest) {
  const requestId = crypto.randomUUID();
  // CSP is computed here, not in next.config.ts, because strict routes need a
  // request-scoped nonce. A global `strict-dynamic` header without a nonce/hash
  // previously caused the UI to render only SSR shells/loading states.
  const cspTier = getCspTierForPath(request.nextUrl.pathname);
  const nonce = cspTier === 'strict' ? btoa(crypto.randomUUID()) : undefined;
  const cspHeader = buildCspHeader({
    tier: cspTier,
    nonce,
    reportUri: process.env.CSP_REPORT_URI,
  });

  // Propagate the request ID to downstream handlers via a request header.
  // NextResponse.next() with request.headers override is the only safe way to
  // mutate headers for the route handler in Next.js middleware.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('Content-Security-Policy', cspHeader);
  requestHeaders.set('x-csp-tier', cspTier);
  requestHeaders.set('x-request-id', requestId);
  if (nonce) {
    requestHeaders.set('x-nonce', nonce);
  }

  // OAuth callback route must bypass locale rewrites and reach its route handler directly.
  if (request.nextUrl.pathname === '/auth/callback') {
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    res.headers.set('x-request-id', requestId);
    return res;
  }

  if (request.method === 'POST' && isAuthMutationPath(request.nextUrl.pathname)) {
    const ip = getClientIdentifier(request);
    const identifier = `${ip}:${request.nextUrl.pathname}`;
    const result = await checkAuthRateLimit(identifier);

    if (!result.allowed) {
      const retryAfterSeconds = Math.ceil((result.resetAt - Date.now()) / 1000);
      const response = NextResponse.json(
        {error: 'Too many requests. Please try again shortly.'},
        {status: 429}
      );
      response.headers.set('Retry-After', String(Math.max(retryAfterSeconds, 1)));
      response.headers.set('x-request-id', requestId);
      return response;
    }
  }

  // Re-create the request with the injected x-request-id header so that
  // intlMiddleware and the Supabase client both see a consistent request object.
  const modifiedRequest = new NextRequest(request.url, {
    method: request.method,
    headers: requestHeaders,
    body: request.body,
  });

  const response = intlMiddleware(modifiedRequest);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return modifiedRequest.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({name, value}) => modifiedRequest.cookies.set(name, value));
          cookiesToSet.forEach(({name, value, options}) => response.cookies.set(name, value, options));
        }
      }
    }
  );

  const {
    data: {user}
  } = await supabase.auth.getUser();

  if (!user && isProtectedPath(request.nextUrl.pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
    const redirectResponse = NextResponse.redirect(loginUrl);
    redirectResponse.headers.set('x-csp-tier', cspTier);
    redirectResponse.headers.set('x-request-id', requestId);
    return redirectResponse;
  }

  return applyPageSecurityHeaders(response, requestId, cspTier, cspHeader);
}

export const config = {
  matcher: [
    '/((?!api|_next|.*\\..*).*)'
  ]
};
