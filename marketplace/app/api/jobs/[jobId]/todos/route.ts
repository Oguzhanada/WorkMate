import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getUserRoles } from '@/lib/auth/rbac';

const createTodoSchema = z.object({
  description: z.string().min(1).max(500),
  assigned_to: z.string().uuid().optional(),
  due_date: z.string().datetime({ offset: true }).optional(),
});

async function resolveJobAccess(
  supabase: Awaited<ReturnType<typeof getSupabaseRouteClient>>,
  jobId: string,
  userId: string
): Promise<boolean> {
  const { data: job } = await supabase
    .from('jobs')
    .select('customer_id, accepted_quote_id')
    .eq('id', jobId)
    .maybeSingle();

  if (!job) return false;

  let proId: string | null = null;
  if (job.accepted_quote_id) {
    const { data: quote } = await supabase
      .from('quotes')
      .select('pro_id')
      .eq('id', job.accepted_quote_id)
      .maybeSingle();
    proId = quote?.pro_id ?? null;
  }

  const roles = await getUserRoles(supabase, userId);
  return roles.includes('admin') || userId === job.customer_id || userId === proId;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const supabase = await getSupabaseRouteClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const allowed = await resolveJobAccess(supabase, jobId, user.id);
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data, error } = await supabase
    .from('job_todos')
    .select(`
      id, job_id, description, completed, due_date, created_at,
      created_by, assigned_to,
      creator:profiles!created_by(full_name),
      assignee:profiles!assigned_to(full_name)
    `)
    .eq('job_id', jobId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ todos: data ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const supabase = await getSupabaseRouteClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const allowed = await resolveJobAccess(supabase, jobId, user.id);
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = createTodoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const { data: inserted, error: insertError } = await supabase
    .from('job_todos')
    .insert({
      job_id: jobId,
      created_by: user.id,
      description: parsed.data.description,
      assigned_to: parsed.data.assigned_to ?? null,
      due_date: parsed.data.due_date ?? null,
    })
    .select('id, job_id, description, completed, due_date, created_at, created_by, assigned_to')
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  return NextResponse.json({ todo: inserted }, { status: 201 });
}
