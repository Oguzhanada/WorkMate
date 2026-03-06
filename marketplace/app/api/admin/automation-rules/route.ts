import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminRoute } from '@/lib/auth/admin';
import { createAutomationRuleSchema } from '@/lib/validation/api';

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

  const parsed = createAutomationRuleSchema.safeParse(rawBody);
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
