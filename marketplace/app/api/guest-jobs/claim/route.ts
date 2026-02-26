import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { claimGuestJobIntentSchema } from '@/lib/validation/api';
import { canPostJobWithIdentity, getUserRoles } from '@/lib/auth/rbac';

export async function POST(request: NextRequest) {
  const routeClient = await getSupabaseRouteClient();
  const {
    data: { user },
    error: authError,
  } = await routeClient.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = await getUserRoles(routeClient, user.id);
  const { data: profile } = await routeClient
    .from('profiles')
    .select('id,id_verification_status')
    .eq('id', user.id)
    .maybeSingle();

  if (!canPostJobWithIdentity(roles, profile?.id_verification_status)) {
    return NextResponse.json({ error: 'Only customers can claim guest jobs' }, { status: 403 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = claimGuestJobIntentSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { intent_id } = parsed.data;
  const serviceClient = getSupabaseServiceClient();

  const { data: intent, error: intentError } = await serviceClient
    .from('job_intents')
    .select(
      'id,email,title,category_id,description,eircode,county,locality,budget_range,photo_urls,status,published_job_id'
    )
    .eq('id', intent_id)
    .maybeSingle();

  if (intentError || !intent) {
    return NextResponse.json({ error: 'Intent not found' }, { status: 404 });
  }

  if (intent.published_job_id) {
    return NextResponse.json({ job_id: intent.published_job_id, status: 'already_published' }, { status: 200 });
  }

  if (intent.status !== 'ready_to_publish') {
    return NextResponse.json(
      {
        error: 'Intent is not verified yet',
        prod_reminder:
          'PROD TODO: allow publishing only after email verification link is completed.',
      },
      { status: 400 }
    );
  }

  const { data: categoryRow } = await serviceClient
    .from('categories')
    .select('id,name')
    .eq('id', intent.category_id)
    .maybeSingle();

  if (!categoryRow) {
    return NextResponse.json({ error: 'Category no longer available' }, { status: 400 });
  }

  const { data: jobRow, error: jobError } = await serviceClient
    .from('jobs')
    .insert({
      customer_id: user.id,
      title: intent.title,
      category: categoryRow.name,
      category_id: intent.category_id,
      description: intent.description,
      eircode: intent.eircode,
      county: intent.county,
      locality: intent.locality,
      budget_range: intent.budget_range,
      photo_urls: intent.photo_urls ?? [],
      status: 'open',
      review_status: 'pending_review',
    })
    .select('id')
    .single();

  if (jobError || !jobRow) {
    return NextResponse.json({ error: jobError?.message || 'Job could not be published' }, { status: 400 });
  }

  const { error: updateError } = await serviceClient
    .from('job_intents')
    .update({
      status: 'published',
      claimed_by: user.id,
      published_job_id: jobRow.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', intent_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  const { data: adminRows } = await serviceClient
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin');

  if ((adminRows ?? []).length > 0) {
    await serviceClient.from('notifications').insert(
      (adminRows ?? []).map((row) => ({
        user_id: row.user_id,
        type: 'job_pending_review',
        payload: {
          job_id: jobRow.id,
          title: intent.title,
          customer_id: user.id,
          source: 'guest_claim',
        },
      }))
    );
  }

  return NextResponse.json({ job_id: jobRow.id, status: 'published' }, { status: 200 });
}
