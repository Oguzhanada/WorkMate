import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminRoute } from '@/lib/auth/admin';
import { adminRunVerificationSchema } from '@/lib/validation/api';
import { logAdminAudit } from '@/lib/admin/audit';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiNotFound } from '@/lib/api/error-response';

function computePlaceholderRisk(documentCount: number, hasIdDoc: boolean) {
  if (!hasIdDoc) {
    return { risk_level: 'high', risk_score: 0.82, summary: 'ID document missing' };
  }
  if (documentCount >= 2) {
    return { risk_level: 'low', risk_score: 0.19, summary: 'Documents look sufficient for manual review' };
  }
  return { risk_level: 'medium', risk_score: 0.46, summary: 'Limited document set; manual review advised' };
}

async function postHandler(request: NextRequest) {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  const { supabase, user } = auth;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = adminRunVerificationSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiError('Validation failed', 400);
  }

  const { profile_id } = parsed.data;

  const [{ data: profile }, { data: docs, error: docsError }] = await Promise.all([
    supabase.from('profiles').select('id').eq('id', profile_id).maybeSingle(),
    supabase.from('pro_documents').select('id,document_type').eq('profile_id', profile_id),
  ]);

  if (!profile) {
    return apiNotFound('Application not found');
  }
  if (docsError) {
    return apiError(docsError.message, 400);
  }

  const documentCount = docs?.length ?? 0;
  const hasIdDoc = (docs ?? []).some((doc) => doc.document_type === 'id_verification');
  const risk = computePlaceholderRisk(documentCount, hasIdDoc);

  const signals = {
    placeholder: true,
    document_count: documentCount,
    has_id_document: hasIdDoc,
    generated_at: new Date().toISOString(),
  };

  const { data: check, error: insertError } = await supabase
    .from('verification_checks')
    .insert({
      profile_id,
      provider: 'local-placeholder',
      status: 'completed',
      risk_level: risk.risk_level,
      risk_score: risk.risk_score,
      summary: risk.summary,
      signals,
      created_by: user?.id ?? null,
    })
    .select('*')
    .single();

  if (insertError) {
    return apiError(insertError.message, 400);
  }

  await logAdminAudit({
    adminUserId: user?.id ?? null,
    adminEmail: user?.email ?? null,
    action: 'run_verification_check',
    targetType: 'verification_check',
    targetProfileId: profile_id,
    details: {
      check_id: check.id,
      risk_level: risk.risk_level,
      risk_score: risk.risk_score,
      document_count: documentCount,
    },
  });

  return NextResponse.json({ check });
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
