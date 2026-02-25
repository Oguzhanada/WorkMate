import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { canPostJob, getUserRoles } from '@/lib/auth/rbac';
import { updateJobPhotosSchema } from '@/lib/validation/api';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const supabase = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = await getUserRoles(supabase, user.id);
  if (!canPostJob(roles)) {
    return NextResponse.json({ error: 'Only customers can update job photos' }, { status: 403 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = updateJobPhotosSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data: currentJob, error: jobError } = await supabase
    .from('jobs')
    .select('id,photo_urls')
    .eq('id', jobId)
    .eq('customer_id', user.id)
    .maybeSingle();

  if (jobError || !currentJob) {
    return NextResponse.json({ error: 'Job not found or access denied.' }, { status: 404 });
  }

  const existingUrls = Array.isArray(currentJob.photo_urls) ? currentJob.photo_urls : [];
  const merged = Array.from(new Set([...existingUrls, ...parsed.data.photo_urls]));
  if (merged.length > 20) {
    return NextResponse.json(
      { error: 'Maximum 20 job photos allowed. Please remove some before uploading more.' },
      { status: 400 }
    );
  }

  const { data: updated, error: updateError } = await supabase
    .from('jobs')
    .update({ photo_urls: merged })
    .eq('id', jobId)
    .eq('customer_id', user.id)
    .select('id,photo_urls')
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json(
    { job: updated, added_count: parsed.data.photo_urls.length, total_count: merged.length },
    { status: 200 }
  );
}
