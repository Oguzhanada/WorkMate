'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { calculateOfferScore } from '@/lib/ranking/offer-ranking';
import { submitOfferSchema } from '@/lib/validation/api';
import { sendTransactionalEmail } from '@/lib/email/send';
import { sendNotification } from '@/lib/notifications/send';

function parseStringList(value: FormDataEntryValue | null) {
  if (!value) return [] as string[];
  const parsed = String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return parsed;
}

export async function submitOffer(formData: FormData) {
  const supabase = await getSupabaseServerClient();
  const serviceSupabase = getSupabaseServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' as const };
  }

  const parsed = submitOfferSchema.safeParse({
    jobId: formData.get('jobId'),
    priceCents: Number(formData.get('priceCents')),
    description: formData.get('description'),
    estimatedDuration: formData.get('estimatedDuration') ?? '',
    includes: parseStringList(formData.get('includes')),
    excludes: parseStringList(formData.get('excludes')),
  });

  if (!parsed.success) {
    return { error: 'Invalid input' as const, details: parsed.error.flatten() };
  }

  const { jobId, priceCents, description, estimatedDuration, includes, excludes } = parsed.data;

  const { data: roleRow } = await serviceSupabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['verified_pro', 'admin'])
    .limit(1)
    .maybeSingle();

  if (!roleRow) {
    return { error: 'Only providers can submit offers.' as const };
  }

  const { data: job } = await serviceSupabase
    .from('jobs')
    .select('id,title,status,review_status,category_id,created_at,customer_id')
    .eq('id', jobId)
    .maybeSingle();

  if (!job) {
    return { error: 'Job not found.' as const };
  }

  if (job.status !== 'open' || job.review_status !== 'approved') {
    return { error: 'This job is not accepting offers right now.' as const };
  }

  const { data: existingQuote } = await serviceSupabase
    .from('quotes')
    .select('id')
    .eq('job_id', jobId)
    .eq('pro_id', user.id)
    .in('status', ['pending', 'accepted'])
    .maybeSingle();

  if (existingQuote) {
    return { error: 'You already have an active offer for this job.' as const };
  }

  const now = new Date();
  const start = new Date(now.getTime() + 60 * 60 * 1000);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

  const { data: insertedQuote, error: insertError } = await serviceSupabase
    .from('quotes')
    .insert({
      job_id: jobId,
      pro_id: user.id,
      quote_amount_cents: priceCents,
      message: description,
      estimated_duration: estimatedDuration || null,
      includes,
      excludes,
      availability_slots: [{ start: start.toISOString(), end: end.toISOString() }],
      expires_at: expiresAt,
      status: 'pending',
    })
    .select('id,created_at')
    .single();

  if (insertError || !insertedQuote) {
    return { error: 'Failed to submit offer.' as const };
  }

  try {
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

    if ((providerQuoteCount ?? 0) === 1) {
      await serviceSupabase.from('notifications').insert({
        user_id: user.id,
        type: 'provider_first_quote',
        payload: {
          quote_id: insertedQuote.id,
          job_id: jobId,
          dashboard_tour_path: '/dashboard/pro?tour=1',
          message: 'First quote sent. Complete your provider dashboard tour.',
        },
      });

      if (providerProfile?.email) {
        sendTransactionalEmail({
          type: 'provider_first_quote',
          to: providerProfile.email,
          providerName: providerProfile.full_name ?? 'Provider',
          jobTitle: job.title ?? 'your job',
          dashboardUrl: `${process.env.NEXT_PUBLIC_PLATFORM_BASE_URL ?? 'https://workmate.ie'}/${process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'en'}/dashboard/pro?tour=1`,
        });
      }
    }
  } catch {
    // Non-blocking milestone signaling.
  }

  if (job.category_id && job.created_at) {
    const ranking = await calculateOfferScore(
      {
        id: insertedQuote.id,
        providerId: user.id,
        priceCents,
        createdAt: insertedQuote.created_at,
      },
      {
        id: job.id,
        categoryId: job.category_id,
        createdAt: job.created_at,
      }
    );

    await serviceSupabase
      .from('quotes')
      .update({ ranking_score: ranking.breakdown.smartScore })
      .eq('id', insertedQuote.id);
  }

  await serviceSupabase.from('notifications').insert({
    user_id: job.customer_id,
    type: 'new_offer',
    payload: {
      quote_id: insertedQuote.id,
      job_id: jobId,
      title: job.title,
      quote_amount_cents: priceCents,
    },
  });

  // In-app notification via sendNotification — fire-and-forget
  sendNotification({
    userId: job.customer_id,
    type: 'job_offer',
    title: 'New Offer on Your Job',
    data: { job_id: jobId },
  });

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath('/dashboard/pro');

  return { success: true as const, offerId: insertedQuote.id };
}

export async function acceptOffer(offerId: string) {
  const supabase = await getSupabaseServerClient();
  const serviceSupabase = getSupabaseServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' as const };
  }

  const { data: offer } = await serviceSupabase
    .from('quotes')
    .select('id,job_id,pro_id,status,expires_at')
    .eq('id', offerId)
    .maybeSingle();

  if (!offer) {
    return { error: 'Offer not found.' as const };
  }

  const { data: job } = await serviceSupabase
    .from('jobs')
    .select('id,title,customer_id,status')
    .eq('id', offer.job_id)
    .maybeSingle();

  if (!job || job.customer_id !== user.id) {
    return { error: 'Unauthorized' as const };
  }

  if (offer.status !== 'pending' && offer.status !== 'accepted') {
    return { error: `Cannot accept offer with status "${offer.status}".` as const };
  }

  if (offer.expires_at && new Date(offer.expires_at).getTime() < Date.now()) {
    return { error: 'This offer has expired.' as const };
  }

  await serviceSupabase
    .from('quotes')
    .update({ status: 'rejected' })
    .eq('job_id', offer.job_id)
    .in('status', ['pending', 'accepted'])
    .neq('id', offer.id);

  const { error: acceptError } = await serviceSupabase
    .from('quotes')
    .update({ status: 'accepted' })
    .eq('id', offer.id);

  if (acceptError) {
    return { error: 'Failed to accept offer.' as const };
  }

  await serviceSupabase
    .from('jobs')
    .update({ accepted_quote_id: offer.id, status: 'accepted' })
    .eq('id', offer.job_id);

  await serviceSupabase.from('notifications').insert({
    user_id: offer.pro_id,
    type: 'offer_accepted',
    payload: {
      quote_id: offer.id,
      job_id: offer.job_id,
      title: job.title,
    },
  });

  // In-app notification via sendNotification — fire-and-forget
  sendNotification({
    userId: offer.pro_id,
    type: 'job_offer',
    title: 'Your Offer Was Accepted!',
    data: { job_id: offer.job_id },
  });

  revalidatePath(`/jobs/${offer.job_id}`);
  revalidatePath('/dashboard/customer');

  return { success: true as const, jobId: offer.job_id };
}
