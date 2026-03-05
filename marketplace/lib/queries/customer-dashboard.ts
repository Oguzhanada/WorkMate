import type { SupabaseClient } from '@supabase/supabase-js';

export type CustomerJob = {
  id: string;
  title: string;
  category: string;
  category_id: string | null;
  status: string;
  review_status: string | null;
  accepted_quote_id: string | null;
  budget_range: string;
  eircode: string;
  photo_urls: string[] | null;
  created_at: string;
  auto_release_at: string | null;
  payment_released_at: string | null;
  job_mode: 'quick_hire' | 'direct_request' | 'get_quotes';
  target_provider_id: string | null;
};

export type CustomerQuote = {
  id: string;
  pro_id: string;
  quote_amount_cents: number;
  message: string | null;
  estimated_duration: string | null;
  includes: string[];
  excludes: string[];
  status: string;
  created_at: string;
  ranking_score: number | null;
};

export type CustomerPayment = {
  job_id: string;
  quote_id: string;
  status: 'authorized' | 'captured' | 'cancelled' | 'refunded';
  stripe_payment_intent_id: string;
};

export type CustomerPortfolioItem = {
  id: string;
  profile_id: string;
  category_id: string | null;
  before_image_url: string;
  after_image_url: string;
  experience_note: string | null;
  created_at: string;
};

export type CustomerDashboardData = {
  jobs: CustomerJob[];
  quotesByJob: Map<string, CustomerQuote[]>;
  proNameById: Map<string, string>;
  proVerificationById: Map<string, string>;
  stripeAccountByProId: Map<string, string | null>;
  proPriorityById: Map<string, number>;
  paymentByQuoteId: Map<string, CustomerPayment>;
  reviewStatsByPro: Map<string, { count: number; avg: number }>;
  completedByPro: Map<string, number>;
  reviewedJobIds: Set<string>;
  portfolio: CustomerPortfolioItem[];
  activeDisputeCount: number;
  stats: {
    totalJobs: number;
    openJobs: number;
    assignedJobs: number;
    completedJobsCount: number;
    monthKeys: string[];
    monthCounts: Map<string, number>;
  };
};

export async function fetchCustomerDashboardData(
  supabase: SupabaseClient,
  userId: string
): Promise<CustomerDashboardData> {
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id,title,category,category_id,status,review_status,accepted_quote_id,budget_range,eircode,photo_urls,created_at,auto_release_at,payment_released_at,job_mode,target_provider_id')
    .eq('customer_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  const safeJobs = (jobs ?? []) as CustomerJob[];
  const jobIds = safeJobs.map((j) => j.id);

  const [
    { data: activeDisputes },
    { data: quotes },
  ] = await Promise.all([
    jobIds.length > 0
      ? supabase.from('disputes').select('id,job_id,status').in('job_id', jobIds).in('status', ['open', 'under_review'])
      : Promise.resolve({ data: [] as Array<{ id: string; job_id: string; status: string }> }),
    jobIds.length > 0
      ? supabase
          .from('quotes')
          .select('id,job_id,pro_id,quote_amount_cents,message,estimated_duration,includes,excludes,status,created_at,ranking_score')
          .in('job_id', jobIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as Array<{ id: string; job_id: string; pro_id: string; quote_amount_cents: number; message: string | null; estimated_duration: string | null; includes: string[] | null; excludes: string[] | null; status: string; created_at: string; ranking_score: number | null }> }),
  ]);

  const proIds = Array.from(new Set((quotes ?? []).map((q) => q.pro_id)));
  const allQuoteIds = (quotes ?? []).map((q) => q.id);

  const [
    { data: pros },
    { data: proReviews },
    { data: payments },
    { data: completedJobs },
    { data: portfolio },
    { data: submittedReviews },
  ] = await Promise.all([
    proIds.length > 0
      ? supabase.from('profiles').select('id,full_name,stripe_account_id,id_verification_status,provider_matching_priority').in('id', proIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null; stripe_account_id: string | null; id_verification_status: string | null; provider_matching_priority: number | null }> }),
    proIds.length > 0
      ? supabase.from('reviews').select('pro_id,rating').in('pro_id', proIds)
      : Promise.resolve({ data: [] as Array<{ pro_id: string; rating: number }> }),
    jobIds.length > 0
      ? supabase.from('payments').select('job_id,quote_id,status,stripe_payment_intent_id').in('job_id', jobIds)
      : Promise.resolve({ data: [] as CustomerPayment[] }),
    allQuoteIds.length > 0
      ? supabase.from('jobs').select('accepted_quote_id').eq('status', 'completed').in('accepted_quote_id', allQuoteIds)
      : Promise.resolve({ data: [] as Array<{ accepted_quote_id: string | null }> }),
    proIds.length > 0
      ? supabase.from('pro_portfolio').select('id,profile_id,category_id,before_image_url,after_image_url,experience_note,created_at').in('profile_id', proIds).order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as CustomerPortfolioItem[] }),
    jobIds.length > 0
      ? supabase.from('reviews').select('job_id').eq('customer_id', userId).in('job_id', jobIds)
      : Promise.resolve({ data: [] as Array<{ job_id: string }> }),
  ]);

  // Maps
  const proNameById = new Map((pros ?? []).map((p) => [p.id, p.full_name ?? 'Professional']));
  const stripeAccountByProId = new Map((pros ?? []).map((p) => [p.id, p.stripe_account_id]));
  const proVerificationById = new Map((pros ?? []).map((p) => [p.id, p.id_verification_status ?? 'none']));
  const proPriorityById = new Map((pros ?? []).map((p) => [p.id, p.provider_matching_priority ?? 1]));
  const paymentByQuoteId = new Map((payments ?? []).map((p) => [p.quote_id, p as CustomerPayment]));

  const reviewStatsByPro = new Map<string, { count: number; avg: number }>();
  for (const review of proReviews ?? []) {
    const cur = reviewStatsByPro.get(review.pro_id) ?? { count: 0, avg: 0 };
    const nextCount = cur.count + 1;
    reviewStatsByPro.set(review.pro_id, {
      count: nextCount,
      avg: (cur.avg * cur.count + review.rating) / nextCount,
    });
  }

  const proByQuoteId = new Map((quotes ?? []).map((q) => [q.id, q.pro_id]));
  const completedByPro = new Map<string, number>();
  for (const row of completedJobs ?? []) {
    if (!row.accepted_quote_id) continue;
    const proId = proByQuoteId.get(row.accepted_quote_id);
    if (!proId) continue;
    completedByPro.set(proId, (completedByPro.get(proId) ?? 0) + 1);
  }

  const quotesByJob = new Map<string, CustomerQuote[]>();
  for (const quote of quotes ?? []) {
    const arr = quotesByJob.get(quote.job_id) ?? [];
    arr.push({
      id: quote.id,
      pro_id: quote.pro_id,
      quote_amount_cents: quote.quote_amount_cents,
      message: quote.message,
      estimated_duration: quote.estimated_duration,
      includes: quote.includes ?? [],
      excludes: quote.excludes ?? [],
      status: quote.status,
      created_at: quote.created_at,
      ranking_score: quote.ranking_score ?? null,
    });
    quotesByJob.set(quote.job_id, arr);
  }
  for (const [jobId, list] of quotesByJob.entries()) {
    quotesByJob.set(
      jobId,
      list.sort((a, b) => {
        const scoreB = b.ranking_score ?? 0;
        const scoreA = a.ranking_score ?? 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        const prioB = proPriorityById.get(b.pro_id) ?? 1;
        const prioA = proPriorityById.get(a.pro_id) ?? 1;
        if (prioB !== prioA) return prioB - prioA;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
    );
  }

  // Stats
  const statusCounts = new Map<string, number>();
  for (const job of safeJobs) {
    statusCounts.set(job.status, (statusCounts.get(job.status) ?? 0) + 1);
  }
  const monthKeys = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const monthCounts = new Map<string, number>(monthKeys.map((k) => [k, 0]));
  for (const job of safeJobs) {
    const d = new Date(job.created_at);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (monthCounts.has(k)) monthCounts.set(k, (monthCounts.get(k) ?? 0) + 1);
  }

  const reviewedJobIds = new Set((submittedReviews ?? []).map((r) => r.job_id));

  return {
    jobs: safeJobs,
    quotesByJob,
    proNameById,
    proVerificationById,
    stripeAccountByProId,
    proPriorityById,
    paymentByQuoteId,
    reviewStatsByPro,
    completedByPro,
    reviewedJobIds,
    portfolio: (portfolio ?? []) as CustomerPortfolioItem[],
    activeDisputeCount: (activeDisputes ?? []).length,
    stats: {
      totalJobs: safeJobs.length,
      openJobs: statusCounts.get('open') ?? 0,
      assignedJobs: statusCounts.get('accepted') ?? 0,
      completedJobsCount: statusCounts.get('completed') ?? 0,
      monthKeys,
      monthCounts,
    },
  };
}
