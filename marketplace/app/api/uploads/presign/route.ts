import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { createR2PresignedUpload, isR2Configured } from '@/lib/cloudflare/r2';
import { apiError, apiUnauthorized, apiServerError } from '@/lib/api/error-response';

/**
 * POST /api/uploads/presign
 *
 * Generates a Cloudflare R2 presigned PUT URL for direct browser uploads.
 * The client receives the URL, uploads the file directly to R2 (no data
 * passes through the Next.js server), then stores the returned publicUrl.
 *
 * Auth: required (logged-in users only)
 * Rate limit: WRITE_ENDPOINT (30 req/min)
 *
 * Body:
 *   { filename: string, contentType: string, scope: 'avatar' | 'document' | 'portfolio' }
 *
 * Returns:
 *   { uploadUrl: string, publicUrl: string, expiresAt: string }
 */

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

const MAX_SIZE_BY_SCOPE: Record<string, number> = {
  avatar: 5 * 1024 * 1024,       // 5 MB
  document: 20 * 1024 * 1024,    // 20 MB
  portfolio: 10 * 1024 * 1024,   // 10 MB
};

const presignSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  contentType: z.string().trim().min(1).max(128),
  scope: z.enum(['avatar', 'document', 'portfolio']),
});

async function handler(request: NextRequest): Promise<NextResponse> {
  if (!isR2Configured()) {
    return apiError('File upload via R2 is not configured on this environment.', 503);
  }

  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiUnauthorized();
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = presignSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Invalid request', 400);
  }

  const { filename, contentType, scope } = parsed.data;

  if (!ALLOWED_MIME_TYPES.has(contentType)) {
    return apiError('File type not allowed. Use PNG, JPEG, WEBP, GIF, or PDF.', 400);
  }

  // Sanitize filename — keep only safe characters
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
  const timestamp = Date.now();
  const key = `${scope}/${user.id}/${timestamp}_${safeName}`;

  const maxSizeBytes = MAX_SIZE_BY_SCOPE[scope] ?? 5 * 1024 * 1024;

  try {
    const { uploadUrl, publicUrl } = await createR2PresignedUpload({
      key,
      contentType,
      maxSizeBytes,
      expiresInSeconds: 300,
    });

    const expiresAt = new Date(Date.now() + 300_000).toISOString();

    return NextResponse.json({ uploadUrl, publicUrl, expiresAt });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Presign failed';
    return apiServerError(message);
  }
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, handler);
