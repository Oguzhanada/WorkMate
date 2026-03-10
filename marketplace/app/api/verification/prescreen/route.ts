import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { getUserRoles } from '@/lib/auth/rbac';
import { prescreenVerificationSchema } from '@/lib/validation/api';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';

type RiskLevel = 'low' | 'medium' | 'high';

function computeIdPrescreen(input: { storagePath: string; documentType: string }) {
  const path = input.storagePath.toLowerCase();
  const extension = path.split('.').pop() ?? '';
  const keywords = ['id', 'passport', 'driving', 'licence', 'license', 'identity', 'tax', 'clearance'];
  const hasKeyword = keywords.some((word) => path.includes(word));
  const isCommonDocExt = ['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(extension);
  const isExpectedType = input.documentType === 'id_verification';

  let score = 0.2;
  if (isExpectedType) score += 0.35;
  if (hasKeyword) score += 0.3;
  if (isCommonDocExt) score += 0.15;
  if (score > 1) score = 1;

  let riskLevel: RiskLevel = 'high';
  if (score >= 0.75) riskLevel = 'low';
  else if (score >= 0.5) riskLevel = 'medium';

  const summary =
    riskLevel === 'low'
      ? 'File metadata looks consistent with an ID document.'
      : riskLevel === 'medium'
        ? 'File may be an ID document, but confidence is limited.'
        : 'File metadata does not strongly indicate a valid ID document.';

  return {
    risk_level: riskLevel,
    risk_score: Number((1 - score).toFixed(4)),
    summary,
    signals: {
      model: 'local-prescreen-v1',
      expected_type: 'id_verification',
      received_type: input.documentType,
      extension,
      has_keyword: hasKeyword,
      is_common_doc_ext: isCommonDocExt,
      storage_path: input.storagePath,
      generated_at: new Date().toISOString(),
    },
  };
}

async function postHandler(request: NextRequest) {
  const routeClient = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await routeClient.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = prescreenVerificationSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { profile_id, document_id } = parsed.data;
  const roles = await getUserRoles(routeClient, user.id);
  const isAdmin = roles.includes('admin');
  if (user.id !== profile_id && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const serviceClient = getSupabaseServiceClient();
  const { data: doc, error: docError } = await serviceClient
    .from('pro_documents')
    .select('id,profile_id,document_type,storage_path')
    .eq('id', document_id)
    .eq('profile_id', profile_id)
    .maybeSingle();

  if (docError || !doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  const prescreen = computeIdPrescreen({
    storagePath: doc.storage_path,
    documentType: doc.document_type,
  });

  const { data: check, error: insertError } = await serviceClient
    .from('verification_checks')
    .insert({
      profile_id,
      provider: 'local-prescreen',
      status: 'completed',
      risk_level: prescreen.risk_level,
      risk_score: prescreen.risk_score,
      summary: prescreen.summary,
      signals: prescreen.signals,
      created_by: user.id,
    })
    .select('*')
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({ check });
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
