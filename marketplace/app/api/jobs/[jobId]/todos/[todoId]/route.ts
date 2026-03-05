import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getUserRoles } from '@/lib/auth/rbac';

const patchTodoSchema = z.object({
  completed: z.boolean().optional(),
  description: z.string().min(1).max(500).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  due_date: z.string().datetime({ offset: true }).nullable().optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' });

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string; todoId: string }> }
) {
  const { jobId, todoId } = await params;
  const supabase = await getSupabaseRouteClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const allowed = await resolveJobAccess(supabase, jobId, user.id);
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = patchTodoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const { data: updated, error: updateError } = await supabase
    .from('job_todos')
    .update(parsed.data)
    .eq('id', todoId)
    .eq('job_id', jobId)
    .select('id, job_id, description, completed, due_date, created_at, created_by, assigned_to')
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ todo: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string; todoId: string }> }
) {
  const { jobId, todoId } = await params;
  const supabase = await getSupabaseRouteClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const roles = await getUserRoles(supabase, user.id);
  const isAdmin = roles.includes('admin');

  // Verify todo belongs to this job
  const { data: todo } = await supabase
    .from('job_todos')
    .select('id, created_by, job_id')
    .eq('id', todoId)
    .eq('job_id', jobId)
    .maybeSingle();

  if (!todo) return NextResponse.json({ error: 'Todo not found' }, { status: 404 });

  if (!isAdmin && todo.created_by !== user.id) {
    return NextResponse.json({ error: 'Only the creator can delete this todo' }, { status: 403 });
  }

  const { error: deleteError } = await supabase
    .from('job_todos')
    .delete()
    .eq('id', todoId);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
