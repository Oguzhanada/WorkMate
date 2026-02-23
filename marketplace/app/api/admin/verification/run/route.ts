import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminRoute } from '@/lib/auth/admin';
import { adminRunVerificationSchema } from '@/lib/validation/api';

function computePlaceholderRisk(documentCount: number, hasIdDoc: boolean) {
  if (!hasIdDoc) {
    return { risk_level: 'high', risk_score: 0.82, summary: 'ID document missing' };
  }
  if (documentCount >= 2) {
    return { risk_level: 'low', risk_score: 0.19, summary: 'Documents look sufficient for manual review' };
  }
  return { risk_level: 'medium', risk_score: 0.46, summary: 'Limited document set; manual review advised' };
}

export async function POST(request: NextRequest) {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  const { supabase, user } = auth;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = adminRunVerificationSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { profile_id } = parsed.data;

  const [{ data: profile }, { data: docs, error: docsError }] = await Promise.all([
    supabase.from('profiles').select('id').eq('id', profile_id).maybeSingle(),
    supabase.from('pro_documents').select('id,document_type').eq('profile_id', profile_id),
  ]);

  if (!profile) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }
  if (docsError) {
    return NextResponse.json({ error: docsError.message }, { status: 400 });
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
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({ check });
}
