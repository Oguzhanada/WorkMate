import { getSupabaseServiceClient } from '@/lib/supabase/service';
import type { OfferRanking, ProviderRanking } from '@/lib/types/airtasker';

type OfferInput = {
  id: string;
  priceCents: number;
  providerId: string;
  createdAt: string;
};

type JobInput = {
  id: string;
  categoryId: string;
  createdAt: string;
};

async function getAveragePriceForCategory(categoryId: string): Promise<number> {
  const supabase = getSupabaseServiceClient();

  const { data } = await supabase
    .from('quotes')
    .select('quote_amount_cents,jobs!inner(category_id)')
    .eq('jobs.category_id', categoryId)
    .eq('status', 'accepted')
    .not('quote_amount_cents', 'is', null)
    .limit(100);

  if (!data || data.length === 0) return 10_000;
  const total = data.reduce((sum, row) => sum + Number(row.quote_amount_cents ?? 0), 0);
  const average = total / data.length;
  return Number.isFinite(average) && average > 0 ? average : 10_000;
}

export async function getProviderRanking(providerId: string): Promise<ProviderRanking | null> {
  const supabase = getSupabaseServiceClient();

  const { data } = await supabase
    .from('provider_rankings')
    .select('*')
    .eq('provider_id', providerId)
    .maybeSingle();

  if (!data) return null;

  return {
    providerId: data.provider_id,
    avgRating: Number(data.avg_rating ?? 0),
    reviewCount: Number(data.review_count ?? 0),
    completedJobs: Number(data.completed_jobs ?? 0),
    avgResponseHours: Number(data.avg_response_hours ?? 24),
    idVerifiedScore: Number(data.id_verified_score ?? 0),
    taxClearanceScore: Number(data.tax_clearance_score ?? 0),
    insuranceScore: Number(data.insurance_score ?? 0),
    safePassScore: Number(data.safe_pass_score ?? 0),
    totalTrustScore: Number(data.total_trust_score ?? 0),
    complianceScore: Number(data.compliance_score ?? 0)
  };
}

export async function calculateOfferScore(offer: OfferInput, job: JobInput): Promise<OfferRanking> {
  const providerRanking = await getProviderRanking(offer.providerId);
  const averagePrice = await getAveragePriceForCategory(job.categoryId);

  const safePrice = Math.max(offer.priceCents, 1);
  const priceRatio = averagePrice / safePrice;
  const priceScore = Math.min(25, Math.max(0, priceRatio * 15));

  const ratingScore = providerRanking ? (providerRanking.avgRating / 5) * 20 : 10;

  const responseHours =
    (new Date(offer.createdAt).getTime() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60);
  let responseScore = 5;
  if (responseHours < 1) responseScore = 20;
  else if (responseHours < 3) responseScore = 17;
  else if (responseHours < 6) responseScore = 14;
  else if (responseHours < 12) responseScore = 11;
  else if (responseHours < 24) responseScore = 8;

  const completedJobs = providerRanking?.completedJobs ?? 0;
  let matchScore = 8;
  if (completedJobs >= 50) matchScore = 15;
  else if (completedJobs >= 20) matchScore = 13;
  else if (completedJobs >= 10) matchScore = 11;
  else if (completedJobs >= 5) matchScore = 9;

  const trustScore = providerRanking?.totalTrustScore ?? 0;
  const complianceScore = providerRanking?.complianceScore ?? 0;
  const score = Math.round(priceScore + ratingScore + responseScore + matchScore + trustScore);

  // Smart Match Score: compliance boosts the base score by up to 25%
  // A fully compliant pro (ID + insurance + Safe Pass + tax clearance = 100pts) earns maximum boost.
  const complianceMultiplier = 1.0 + (complianceScore / 100) * 0.25;
  const smartScore = Math.round(score * complianceMultiplier);

  let badge: OfferRanking['badge'] = undefined;
  if (smartScore >= 85) badge = 'TOP_OFFER';
  else if (complianceScore >= 80) badge = 'TRUSTED_PRO';
  else if (responseScore >= 17) badge = 'FAST_RESPONDER';

  // matchPercentage: consumer-friendly 0–99 number derived from smartScore
  const matchPercentage = Math.min(99, Math.max(10, Math.round((smartScore / 125) * 100)));

  return {
    score,
    breakdown: {
      priceScore: Math.round(priceScore),
      ratingScore: Math.round(ratingScore),
      responseScore,
      matchScore,
      trustScore,
      matchPercentage,
      smartScore,
      complianceMultiplier: Math.round(complianceMultiplier * 100) / 100,
    },
    badge
  };
}

export async function rankOffersForJob(jobId: string) {
  const supabase = getSupabaseServiceClient();

  const { data: job } = await supabase
    .from('jobs')
    .select('id,category_id,created_at')
    .eq('id', jobId)
    .maybeSingle();

  if (!job?.category_id) return [] as Array<{ offerId: string; ranking: OfferRanking }>;

  const { data: offers } = await supabase
    .from('quotes')
    .select('id,quote_amount_cents,pro_id,created_at')
    .eq('job_id', jobId)
    .in('status', ['pending', 'accepted']);

  if (!offers || offers.length === 0) return [] as Array<{ offerId: string; ranking: OfferRanking }>;

  const ranked = await Promise.all(
    offers.map(async (offer) => {
      const ranking = await calculateOfferScore(
        {
          id: offer.id,
          priceCents: Number(offer.quote_amount_cents ?? 0),
          providerId: offer.pro_id,
          createdAt: offer.created_at
        },
        {
          id: job.id,
          categoryId: job.category_id,
          createdAt: job.created_at
        }
      );

      return { offerId: offer.id, ranking };
    })
  );

  ranked.sort((a, b) => b.ranking.breakdown.smartScore - a.ranking.breakdown.smartScore);

  if (ranked[0] && ranked[0].ranking.breakdown.smartScore >= 70) {
    ranked[0].ranking.badge = 'TOP_OFFER';
  }

  return ranked;
}
