import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminRoute } from '@/lib/auth/admin';
import { patchAutomationRuleSchema } from '@/lib/validation/api';
import { logAdminAudit } from '@/lib/admin/audit';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';

async function patchHandler(
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

  await logAdminAudit({
    adminUserId: auth.user?.id ?? null,
    adminEmail: auth.user?.email ?? null,
    action: 'update_automation_rule',
    targetType: 'automation_rule',
    targetLabel: data.name ?? null,
    details: {
      rule_id: ruleId,
      updated_fields: Object.keys(parsed.data),
    },
  });

  return NextResponse.json({ rule: data });
}

async function deleteHandler(
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

  await logAdminAudit({
    adminUserId: auth.user?.id ?? null,
    adminEmail: auth.user?.email ?? null,
    action: 'delete_automation_rule',
    targetType: 'automation_rule',
    details: {
      rule_id: ruleId,
    },
  });

  return NextResponse.json({ deleted: true });
}

export const PATCH = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, patchHandler);

export const DELETE = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, deleteHandler);
