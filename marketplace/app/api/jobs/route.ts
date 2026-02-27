import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { canPostJob, getUserRoles, isIdVerified } from '@/lib/auth/rbac';
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
  const customerIsVerified = isIdVerified(profile?.id_verification_status);

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
    task_type: body.task_type,
    job_mode: body.job_mode,
    photo_urls: body.photo_urls,
    requires_verified_id: customerIsVerified,
    created_by_verified_id: customerIsVerified,
    job_visibility_tier: customerIsVerified ? 'verified_tier' : 'basic',
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceKey) {
    fetch(`${supabaseUrl}/functions/v1/match-task-alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ jobId: data.id }),
    }).catch(() => {
      // Non-blocking best-effort notification trigger.
    });
  }

  return NextResponse.json(
    {
      job: data,
      customer_verification_status: customerIsVerified ? 'approved' : profile?.id_verification_status ?? 'none',
      upgrade_message: customerIsVerified
        ? null
        : 'Verify your ID to increase trust and unlock higher-priority matching.'
    },
    { status: 201 }
  );
}
