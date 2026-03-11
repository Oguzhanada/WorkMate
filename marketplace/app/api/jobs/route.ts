import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { canPostJob, getUserRoles, isIdVerified } from '@/lib/auth/rbac';
import { isValidEircode, normalizeEircode } from '@/lib/ireland/eircode';
import { fireAutomationEvent } from '@/lib/automation/engine';
import { createJobSchema } from '@/lib/validation/api';
import { sendWebhookEvent } from '@/lib/webhook/send';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';

async function postHandler(request: NextRequest) {
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

  // direct_request requires a valid target_provider_id
  if (body.job_mode === 'direct_request' && !body.target_provider_id) {
    return NextResponse.json({ error: 'Direct request requires a target provider.' }, { status: 400 });
  }

  // ── Mode-specific defaults ──────────────────────────────
  const isQuickHire = body.job_mode === 'quick_hire';

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
    target_provider_id: body.target_provider_id ?? null,
    photo_urls: body.photo_urls,
    requires_verified_id: customerIsVerified,
    created_by_verified_id: customerIsVerified,
    job_visibility_tier: customerIsVerified ? 'verified_tier' : 'basic',
    review_status: 'pending_review',
    // Job mode differentiation
    is_urgent: isQuickHire,
    // Quick Hire always caps at 5; unverified customers capped at 5 to encourage verification
    max_quotes: isQuickHire ? 5 : (customerIsVerified ? null : 5),
    auto_close_on_accept: true,
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

  // Notify targeted provider for direct_request jobs
  if (data.job_mode === 'direct_request' && data.target_provider_id) {
    await serviceSupabase.from('notifications').insert({
      user_id: data.target_provider_id,
      type: 'direct_request',
      payload: {
        job_id: data.id,
        title: data.title,
        customer_id: user.id,
        budget_range: data.budget_range,
      },
    });
  }

  // Notify matching providers for quick_hire jobs with urgency flag
  if (data.job_mode === 'quick_hire' && data.category_id) {
    const { data: matchingProviders } = await serviceSupabase
      .from('pro_service_areas')
      .select('profile_id')
      .eq('county', data.county ?? '')
      .limit(50);

    if (matchingProviders && matchingProviders.length > 0) {
      const uniqueProviderIds = [...new Set(matchingProviders.map((p) => p.profile_id))];
      await serviceSupabase.from('notifications').insert(
        uniqueProviderIds.map((providerId) => ({
          user_id: providerId,
          type: 'urgent_job_posted',
          payload: {
            job_id: data.id,
            title: data.title,
            customer_id: user.id,
            budget_range: data.budget_range,
            urgency_label: 'urgent',
            message: 'Urgent job posted — respond quickly! Limited to 5 quotes.',
          },
        }))
      );
    }
  }

  // Fire automation rules for job_created — non-blocking
  void fireAutomationEvent('job_created', {
    jobId: data.id,
    customerId: user.id,
    category: data.category,
    county: data.county ?? '',
    jobMode: data.job_mode ?? 'get_quotes',
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const taskAlertSecret = process.env.TASK_ALERT_SECRET;
  if (supabaseUrl && serviceKey) {
    fetch(`${supabaseUrl}/functions/v1/match-task-alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
        ...(taskAlertSecret ? { 'x-task-secret': taskAlertSecret } : {}),
      },
      body: JSON.stringify({ jobId: data.id }),
    }).catch(() => {
      // Non-blocking best-effort notification trigger.
    });
  }

  // Public webhook fan-out (best-effort, non-blocking)
  void sendWebhookEvent('job.created', {
    job_id: data.id,
    customer_id: user.id,
    title: data.title,
    category: data.category,
    county: data.county,
    locality: data.locality,
    budget_range: data.budget_range,
    status: data.status,
    created_at: data.created_at,
  });

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

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
