import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { canPostJob, canPostJobWithIdentity, getUserRoles } from '@/lib/auth/rbac';
import { isValidEircode, normalizeEircode } from '@/lib/eircode';
import { createJobSchema } from '@/lib/validation/api';

export async function POST(request: NextRequest) {
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
    return NextResponse.json({ error: 'Only customers can create jobs' }, { status: 403 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id,id_verification_status')
    .eq('id', user.id)
    .maybeSingle();

  if (!canPostJobWithIdentity(roles, profile?.id_verification_status)) {
    return NextResponse.json(
      { error: 'identity_required', redirect_to: '/profile?message=identity_required' },
      { status: 403 }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createJobSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const body = parsed.data;
  const eircode = normalizeEircode(body.eircode || '');

  if (!isValidEircode(eircode)) {
    return NextResponse.json({ error: 'Please enter a valid Eircode.' }, { status: 400 });
  }

  const { data: categoryRow, error: categoryError } = await supabase
    .from('categories')
    .select('id,name')
    .eq('id', body.category_id)
    .eq('is_active', true)
    .maybeSingle();

  if (categoryError || !categoryRow) {
    return NextResponse.json({ error: 'Invalid category selection' }, { status: 400 });
  }

  const { data, error } = await supabase.from('jobs').insert({
    customer_id: user.id,
    title: body.title,
    category: categoryRow.name,
    category_id: categoryRow.id,
    description: body.description,
    eircode,
    county: body.county,
    locality: body.locality,
    budget_range: body.budget_range,
    photo_urls: body.photo_urls,
    requires_verified_id: true,
    review_status: 'pending_review',
  }).select('*').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const serviceSupabase = getSupabaseServiceClient();
  const { data: adminRows } = await serviceSupabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin');

  if ((adminRows ?? []).length > 0) {
    await serviceSupabase.from('notifications').insert(
      (adminRows ?? []).map((row) => ({
        user_id: row.user_id,
        type: 'job_pending_review',
        payload: {
          job_id: data.id,
          title: data.title,
          customer_id: user.id,
          created_at: data.created_at,
        },
      }))
    );
  }

  return NextResponse.json({ job: data }, { status: 201 });
}
