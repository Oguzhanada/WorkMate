import { NextResponse } from 'next/server';
import type { ZodIssue } from 'zod';

/**
 * Standardized API error response helpers.
 *
 * Usage:
 *   return apiError('Job not found', 404);
 *   return apiValidationError(parsed.error.issues);
 *   return apiUnauthorized();
 *   return apiForbidden('Only admins can access this resource');
 */

export function apiError(
  message: string,
  status: number,
  details?: Record<string, unknown>,
) {
  return NextResponse.json(
    { error: message, ...(details && { details }) },
    { status },
  );
}

export function apiValidationError(issues: ZodIssue[]) {
  return NextResponse.json(
    { error: 'Validation failed', details: issues },
    { status: 400 },
  );
}

export function apiUnauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function apiForbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function apiNotFound(message = 'Not found') {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function apiConflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 });
}

export function apiServerError(message = 'Internal server error') {
  return NextResponse.json({ error: message }, { status: 500 });
}
