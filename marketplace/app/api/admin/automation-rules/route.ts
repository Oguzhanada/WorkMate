import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminRoute } from '@/lib/auth/admin';
import { createAutomationRuleSchema } from '@/lib/validation/api';
import { logAdminAudit } from '@/lib/admin/audit';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError } from '@/lib/api/error-response';

async function getHandler() {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  const { data, error } = await auth.supabase
    .from('automation_rules')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return apiError(error.message, 400);

  return NextResponse.json({ rules: data ?? [] });
}

export const GET = withRateLimit(RATE_LIMITS.ADMIN_READ, getHandler);

async function postHandler(request: NextRequest) {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = createAutomationRuleSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiError('Validation failed', 400);
  }

  const { data, error } = await auth.supabase
    .from('automation_rules')
    .insert({ ...parsed.data, created_by: auth.user?.id ?? null })
    .select('*')
    .single();

  if (error) return apiError(error.message, 400);

  await logAdminAudit({
    adminUserId: auth.user?.id ?? null,
    adminEmail: auth.user?.email ?? null,
    action: 'create_automation_rule',
    targetType: 'automation_rule',
    targetLabel: parsed.data.trigger_event ?? null,
    details: {
      rule_id: data.id,
      trigger_event: parsed.data.trigger_event,
    },
  });

  return NextResponse.json({ rule: data }, { status: 201 });
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
