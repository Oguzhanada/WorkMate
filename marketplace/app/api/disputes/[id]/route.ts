import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getDisputeParticipantContext, isDisputeParticipant } from '@/lib/disputes';
import { canAccessAdmin, getUserRoles } from '@/lib/auth/rbac';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: dispute, error } = await supabase
    .from('disputes')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !dispute) {
    return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
  }

  const roles = await getUserRoles(supabase, user.id);
  const isAdmin = canAccessAdmin(roles);
  const context = await getDisputeParticipantContext(supabase, dispute.job_id);

  if (!isAdmin && (!context || !isDisputeParticipant(user.id, context))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [{ data: logs }, { data: evidence }] = await Promise.all([
    supabase
      .from('dispute_logs')
      .select('id,created_at,actor_id,actor_role,action,details,old_status,new_status')
      .eq('dispute_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('dispute_evidence')
      .select('id,uploaded_by,uploaded_at,file_url,file_type,description')
      .eq('dispute_id', id)
      .order('uploaded_at', { ascending: false }),
  ]);

  return NextResponse.json(
    {
      dispute,
      logs: logs ?? [],
      evidence: evidence ?? [],
    },
    { status: 200 }
  );
}