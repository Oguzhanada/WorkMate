import { NextRequest, NextResponse } from 'next/server';

/**
 * Extract x-request-id from the incoming request (set by middleware.ts).
 * Returns the header value or generates a fallback UUID.
 */
export function getRequestId(request: NextRequest): string {
  return request.headers.get('x-request-id') ?? crypto.randomUUID();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteHandler = (request: NextRequest, ctx?: any) => Promise<NextResponse> | NextResponse;

/**
 * Lightweight wrapper that extracts x-request-id and sets it on the response.
 * For routes that don't use withRateLimit (which already handles this).
 *
 * Usage:
 *   export const GET = withRequestId(async (request) => { ... });
 */
export function withRequestId(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest, ctx?: unknown) => {
    const requestId = getRequestId(request);
    const response = await handler(request, ctx);
    response.headers.set('x-request-id', requestId);
    return response;
  };
}
