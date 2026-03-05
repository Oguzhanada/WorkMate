import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ensureAdminRoute } from '@/lib/auth/admin';

const createRuleSchema = z.object({
  trigger_event: z.enum([
    'document_verified',
    'document_rejected',
    'job_created',
    'quote_received',
    'job_inactive',
    'provider_approved',
  ]),
  conditions: z.record(z.string(), z.string()).default({}),
  action_type: z.enum(['send_notification', 'change_status', 'create_task']),
  action_config: z.record(z.string(), z.unknown()),
  enabled: z.boolean().default(true),
});

export async function GET() {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  const { data, error } = await auth.supabase
    .from('automation_rules')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ rules: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await ensureAdminRoute();
  if (auth.error) return auth.error;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createRuleSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data, error } = await auth.supabase
    .from('automation_rules')
    .insert({ ...parsed.data, created_by: auth.user?.id ?? null })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ rule: data }, { status: 201 });
}
