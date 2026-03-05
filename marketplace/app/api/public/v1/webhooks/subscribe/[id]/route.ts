import { NextRequest, NextResponse } from 'next/server';
import { authenticatePublicRequest } from '@/lib/api/public-auth';
import { getSupabaseServiceClient } from '@/lib/supabase/service';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticatePublicRequest(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  const svc = getSupabaseServiceClient();

  const { data, error } = await svc
    .from('webhook_subscriptions')
    .delete()
    .eq('id', id)
    .eq('profile_id', auth.profileId)
    .select('id')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

  return NextResponse.json({ success: true, id: data.id }, { status: 200 });
}
