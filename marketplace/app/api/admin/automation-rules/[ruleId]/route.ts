import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminRoute } from '@/lib/auth/admin';
import { patchAutomationRuleSchema } from '@/lib/validation/api';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  const { ruleId } = await params;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = patchAutomationRuleSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data, error } = await auth.supabase
    .from('automation_rules')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', ruleId)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ rule: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  const { ruleId } = await params;

  const { error } = await auth.supabase
    .from('automation_rules')
    .delete()
    .eq('id', ruleId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ deleted: true });
}
