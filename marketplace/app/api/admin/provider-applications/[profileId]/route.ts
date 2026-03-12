import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminRoute } from '@/lib/auth/admin';
import { apiError, apiNotFound } from '@/lib/api/error-response';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';

async function getHandler(
  _request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  const { profileId } = await params;
  const { supabase } = auth;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id,full_name,phone,role,verification_status,id_verification_method,stripe_identity_status,created_at,stripe_requirements_due')
    .eq('id', profileId)
    .maybeSingle();

  if (profileError) {
    return apiError(profileError.message, 400);
  }
  if (!profile) {
    return apiNotFound('Application not found');
  }

  const [{ data: docs, error: docsError }, { data: checks, error: checksError }] = await Promise.all([
    supabase
      .from('pro_documents')
      .select('id,document_type,storage_path,verification_status,created_at')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false }),
    supabase
      .from('verification_checks')
      .select('id,provider,status,risk_level,risk_score,summary,signals,created_at')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  if (docsError) {
    return apiError(docsError.message, 400);
  }
  if (checksError) {
    return apiError(checksError.message, 400);
  }

  return NextResponse.json({
    application: {
      ...profile,
      documents: docs ?? [],
      checks: checks ?? [],
    },
  });
}

export const GET = withRateLimit(RATE_LIMITS.ADMIN_READ, getHandler);
