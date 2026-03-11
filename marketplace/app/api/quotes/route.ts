import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { canQuoteJob, getUserRoles, isIdVerified } from '@/lib/auth/rbac';
import { createQuoteSchema } from '@/lib/validation/api';
import { fireAutomationEvent } from '@/lib/automation/engine';
import { calculateOfferScore } from '@/lib/ranking/offer-ranking';
import { sendTransactionalEmail } from '@/lib/email/send';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { debitQuoteCredits } from '@/lib/credits/provider-credits';

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
  const { data: profile } = await supabase
    .from('profiles')
    .select('id,id_verification_status')
    .eq('id', user.id)
    .maybeSingle();
  const providerIsVerified = isIdVerified(profile?.id_verification_status);

  if (!canQuoteJob(roles, profile?.id_verification_status)) {
    return NextResponse.json({ error: 'Only professionals can submit quotes' }, { status: 403 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createQuoteSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const body = parsed.data;
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id,title,customer_id,status,review_status,county,job_visibility_tier,category_id,created_at,job_mode,target_provider_id,expires_at,max_quotes,is_urgent')
    .eq('id', body.job_id)
    .maybeSingle();

  if (jobError || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  if (job.status !== 'open' || job.review_status !== 'approved') {
    return NextResponse.json(
      { error: 'This job is not available for quoting yet.' },
      { status: 400 }
    );
  }

  // Reject quotes on expired jobs
  if (job.expires_at && new Date(job.expires_at).getTime() < Date.now()) {
    return NextResponse.json(
      { error: 'This job has expired and is no longer accepting quotes.' },
      { status: 400 }
    );
  }

  // Enforce max_quotes limit (Quick Hire = 5, Get Quotes = unlimited)
  if (job.max_quotes != null) {
    const { count: existingQuoteCount } = await supabase
      .from('quotes')
      .select('id', { count: 'exact', head: true })
      .eq('job_id', body.job_id)
      .neq('status', 'withdrawn');

    if ((existingQuoteCount ?? 0) >= job.max_quotes) {
      return NextResponse.json(
        { error: 'This job has reached its maximum number of quotes.' },
        { status: 400 }
      );
    }
  }

  // Check provider availability — block quoting if provider has marked themselves unavailable
  {
    const serviceClient = getSupabaseServiceClient();
    const todayDow = new Date().getDay(); // 0 = Sunday
    const { data: availRows } = await serviceClient
      .from('provider_availability')
      .select('is_available')
      .eq('provider_id', user.id)
      .eq('day_of_week', todayDow)
      .limit(1)
      .maybeSingle();

    // If the provider has an availability record for today and it's set to unavailable, block
    if (availRows && availRows.is_available === false) {
      return NextResponse.json(
        { error: 'You are marked as unavailable today. Update your availability to submit quotes.' },
        { status: 400 }
      );
    }
  }

  // direct_request: only the targeted provider may quote
  if (job.job_mode === 'direct_request' && job.target_provider_id) {
    if (job.target_provider_id !== user.id) {
      return NextResponse.json(
        { error: 'This job is a direct request to another provider.' },
        { status: 403 }
      );
    }
  }

  if (!providerIsVerified) {
    const { data: areas } = await supabase
      .from('pro_service_areas')
      .select('county')
      .eq('profile_id', user.id);

    const counties = (areas ?? []).map((row) => row.county);
    const hasCountyAccess = job.county ? counties.includes(job.county) : false;
    if (!hasCountyAccess) {
      return NextResponse.json(
        { error: 'This lead is outside your current basic-tier county access.' },
        { status: 403 }
      );
    }

    const quoteDate = new Date().toISOString().slice(0, 10);
    const { data: limitRow } = await supabase
      .from('quote_daily_limits')
      .select('used_count')
      .eq('profile_id', user.id)
      .eq('quote_date', quoteDate)
      .maybeSingle();

    const usedCount = limitRow?.used_count ?? 0;
    if (usedCount >= 3) {
      return NextResponse.json(
        {
          error: 'Daily quote limit reached for basic tier.',
          upgrade_message: 'Verify your ID for unlimited quotes and wider lead access.'
        },
        { status: 429 }
      );
    }
  }

  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.from('quotes').insert({
    job_id: body.job_id,
    pro_id: user.id,
    quote_amount_cents: body.quote_amount_cents,
    message: body.message,
    estimated_duration: body.estimated_duration,
    includes: body.includes,
    excludes: body.excludes,
    availability_slots: body.availability_slots,
    expires_at: expiresAt,
  }).select('*').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Debit provider credits — non-blocking; does not fail the quote if credits are exhausted
  void debitQuoteCredits(user.id, data.id, job.is_urgent ?? false).catch(() => {
    // Credit debit failure is swallowed — credits are advisory, not a hard gate in quote submission
  });

  let isFirstQuoteMilestone = false;
  let providerEmail: string | null = null;
  let providerName = 'Provider';
  const dashboardTourPath = '/dashboard/pro?tour=1';

  try {
    const serviceSupabase = getSupabaseServiceClient();
    const [{ count: providerQuoteCount }, { data: providerProfile }] = await Promise.all([
      serviceSupabase
        .from('quotes')
        .select('id', { count: 'exact', head: true })
        .eq('pro_id', user.id),
      serviceSupabase
        .from('profiles')
        .select('email,full_name')
        .eq('id', user.id)
        .maybeSingle(),
    ]);

    isFirstQuoteMilestone = (providerQuoteCount ?? 0) === 1;
    providerEmail = providerProfile?.email ?? null;
    providerName = providerProfile?.full_name ?? providerName;

    if (isFirstQuoteMilestone) {
      await serviceSupabase.from('notifications').insert({
        user_id: user.id,
        type: 'provider_first_quote',
        payload: {
          quote_id: data.id,
          job_id: body.job_id,
          dashboard_tour_path: dashboardTourPath,
          message: 'First quote sent. Complete your provider dashboard tour.',
        },
      });
    }
  } catch {
    // Non-blocking — first quote milestone signals should never block quote creation.
  }

  if (job.category_id && job.created_at) {
    const ranking = await calculateOfferScore(
      {
        id: data.id,
        priceCents: body.quote_amount_cents,
        providerId: user.id,
        createdAt: data.created_at,
      },
      {
        id: job.id,
        categoryId: job.category_id,
        createdAt: job.created_at,
      }
    );

    const serviceSupabase = getSupabaseServiceClient();
    await serviceSupabase
      .from('quotes')
      .update({ ranking_score: ranking.score })
      .eq('id', data.id);
  }

  // Fire automation rules for quote_received — non-blocking
  void fireAutomationEvent('quote_received', {
    quoteId: data.id,
    jobId: body.job_id,
    proId: user.id,
    amountCents: body.quote_amount_cents,
    category: job.category_id ?? '',
  });

  let remainingQuotes: number | null = null;
  if (!providerIsVerified) {
    const quoteDate = new Date().toISOString().slice(0, 10);
    const { data: currentLimit } = await supabase
      .from('quote_daily_limits')
      .select('used_count')
      .eq('profile_id', user.id)
      .eq('quote_date', quoteDate)
      .maybeSingle();

    let used = 1;
    if (currentLimit) {
      used = (currentLimit.used_count ?? 0) + 1;
      await supabase
        .from('quote_daily_limits')
        .update({ used_count: used })
        .eq('profile_id', user.id)
        .eq('quote_date', quoteDate);
    } else {
      await supabase
        .from('quote_daily_limits')
        .insert({
          profile_id: user.id,
          quote_date: quoteDate,
          used_count: 1
        });
    }

    const { data: finalLimit } = await supabase
      .from('quote_daily_limits')
      .select('used_count')
      .eq('profile_id', user.id)
      .eq('quote_date', quoteDate)
      .maybeSingle();

    remainingQuotes = Math.max(0, 3 - (finalLimit?.used_count ?? used));
  }

  // Notify customer of new quote — non-blocking, best-effort
  if (job.customer_id) {
    void (async () => {
      try {
        const serviceSupabase = getSupabaseServiceClient();
        const [{ data: customerProfile }, { data: providerProfile }] = await Promise.all([
          serviceSupabase.from('profiles').select('email,full_name').eq('id', job.customer_id!).maybeSingle(),
          serviceSupabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
        ]);
        if (customerProfile?.email) {
          sendTransactionalEmail({
            type: 'quote_received',
            to: customerProfile.email,
            jobTitle: job.title ?? 'your job',
            providerName: providerProfile?.full_name ?? 'A provider',
            amountEur: (body.quote_amount_cents / 100).toFixed(2),
            jobId: body.job_id,
          });
        }
      } catch {
        // Non-blocking — email lookup failure is swallowed.
      }
    })();
  }

  if (isFirstQuoteMilestone && providerEmail) {
    sendTransactionalEmail({
      type: 'provider_first_quote',
      to: providerEmail,
      providerName,
      jobTitle: job.title ?? 'your job',
      dashboardUrl: `${process.env.NEXT_PUBLIC_PLATFORM_BASE_URL ?? 'https://workmate.ie'}/en${dashboardTourPath}`,
    });
  }

  return NextResponse.json(
    {
      quote: data,
      provider_verification_status: providerIsVerified ? 'approved' : profile?.id_verification_status ?? 'none',
      remaining_quotes_today: remainingQuotes,
      dashboard_tour_path: isFirstQuoteMilestone ? dashboardTourPath : null,
      upgrade_message: providerIsVerified
        ? null
        : 'Quote sent. Verify your ID for unlimited quotes and wider lead access.'
    },
    { status: 201 }
  );
}

export const POST = withRateLimit(RATE_LIMITS.WRITE_ENDPOINT, postHandler);
