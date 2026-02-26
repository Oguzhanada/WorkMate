import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { canQuoteJob, getUserRoles, isIdVerified } from '@/lib/auth/rbac';
import { createQuoteSchema } from '@/lib/validation/api';

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
    .select('id,status,review_status,county,job_visibility_tier')
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

  if (!providerIsVerified && job.job_visibility_tier !== 'basic') {
    return NextResponse.json(
      { error: 'This lead is available after ID verification only.', upgrade_message: 'Verify your ID to unlock all lead tiers.' },
      { status: 403 }
    );
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

  const { data, error } = await supabase.from('quotes').insert({
    job_id: body.job_id,
    pro_id: user.id,
    quote_amount_cents: body.quote_amount_cents,
    message: body.message,
    estimated_duration: body.estimated_duration,
    includes: body.includes,
    excludes: body.excludes,
    availability_slots: body.availability_slots,
  }).select('*').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

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

  return NextResponse.json(
    {
      quote: data,
      provider_verification_status: providerIsVerified ? 'approved' : profile?.id_verification_status ?? 'none',
      remaining_quotes_today: remainingQuotes,
      upgrade_message: providerIsVerified
        ? null
        : 'Quote sent. Verify your ID for unlimited quotes and wider lead access.'
    },
    { status: 201 }
  );
}
