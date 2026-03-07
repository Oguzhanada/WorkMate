import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { getRebookingInfo } from '@/lib/pricing/fee-calculator';
import { calculateOfferScore } from '@/lib/ranking/offer-ranking';
import JobOffersClient, { type OfferData } from './JobOffersClient';

type Props = {
  jobId: string;
  customerId: string;
  locale: string;
  categoryId: string | null;
  jobCreatedAt: string;
};

export default async function JobOffersPanel({
  jobId,
  customerId,
  locale,
  categoryId,
  jobCreatedAt,
}: Props) {
  if (!categoryId) return null;

  const supabase = getSupabaseServiceClient();

  const [{ data: quotes }, { data: allQuoteProviders }] = await Promise.all([
    supabase
      .from('quotes')
      .select('id,pro_id,quote_amount_cents,message,estimated_duration,expires_at,created_at,status')
      .eq('job_id', jobId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    supabase
      .from('quotes')
      .select('pro_id')
      .eq('job_id', jobId),
  ]);

  const uniqueInterestedProviders = new Set((allQuoteProviders ?? []).map((q) => q.pro_id)).size;

  if (!quotes || quotes.length === 0) {
    return (
      <div className="rounded-2xl p-5" style={{ border: '1px solid var(--wm-border)', background: 'var(--wm-surface)' }}>
        <h2 className="text-base font-semibold">Offers</h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--wm-muted)' }}>
          No offers yet. Providers will submit offers once your job is approved.
        </p>
      </div>
    );
  }

  const providerIds = [...new Set(quotes.map((q) => q.pro_id))];

  const todayDate = new Date().toISOString().slice(0, 10);
  const todayDow = new Date().getDay();

  const [
    { data: profiles },
    { data: rankings },
    { data: documents },
    { data: sameDaySlots },
    rebookingChecks,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id,full_name,avatar_url,compliance_score')
      .in('id', providerIds),
    supabase
      .from('provider_rankings')
      .select('provider_id,avg_rating,review_count,completed_jobs')
      .in('provider_id', providerIds),
    supabase
      .from('pro_documents')
      .select('profile_id,document_type')
      .in('profile_id', providerIds)
      .eq('verification_status', 'verified')
      .is('archived_at', null),
    supabase
      .from('provider_availability')
      .select('provider_id')
      .in('provider_id', providerIds)
      .or(`and(is_recurring.eq.true,day_of_week.eq.${todayDow}),and(is_recurring.eq.false,specific_date.eq.${todayDate})`),
    Promise.all(providerIds.map((pid) => getRebookingInfo(customerId, pid))),
  ]);

  const sameDayProviderIds = new Set((sameDaySlots ?? []).map((row) => row.provider_id));

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const rankingById = new Map((rankings ?? []).map((r) => [r.provider_id, r]));
  const rebookingByProvider = new Map(providerIds.map((pid, idx) => [pid, rebookingChecks[idx]]));

  const docsByProvider = new Map<string, Set<string>>();
  for (const doc of documents ?? []) {
    const set = docsByProvider.get(doc.profile_id) ?? new Set<string>();
    set.add(doc.document_type);
    docsByProvider.set(doc.profile_id, set);
  }

  const offersWithRankings: OfferData[] = await Promise.all(
    quotes.map(async (quote) => {
      const ranking = await calculateOfferScore(
        {
          id: quote.id,
          priceCents: Number(quote.quote_amount_cents ?? 0),
          providerId: quote.pro_id,
          createdAt: quote.created_at,
        },
        {
          id: jobId,
          categoryId,
          createdAt: jobCreatedAt,
        }
      );

      const profile = profileById.get(quote.pro_id);
      const rankingData = rankingById.get(quote.pro_id);
      const docs = docsByProvider.get(quote.pro_id) ?? new Set<string>();
      const rebooking = rebookingByProvider.get(quote.pro_id);

      return {
        id: quote.id,
        priceCents: Number(quote.quote_amount_cents ?? 0),
        description: quote.message ?? '',
        estimatedDuration: quote.estimated_duration ?? undefined,
        createdAt: quote.created_at,
        expiresAt: quote.expires_at ?? undefined,
        status: quote.status,
        provider: {
          id: quote.pro_id,
          businessName: profile?.full_name ?? 'Provider',
          avatarUrl: profile?.avatar_url ?? undefined,
          rating: Number(rankingData?.avg_rating ?? 0),
          reviewCount: Number(rankingData?.review_count ?? 0),
          completedJobs: Number(rankingData?.completed_jobs ?? 0),
          hasTaxClearance: docs.has('tax_clearance'),
          hasInsurance: docs.has('public_liability_insurance'),
          hasSafePass: docs.has('safe_pass'),
          complianceScore: Number(profile?.compliance_score ?? 0),
          isSameDayAvailable: sameDayProviderIds.has(quote.pro_id),
        },
        ranking,
        isRebooking: Boolean(rebooking?.hasWorkedBefore),
      };
    })
  );

  offersWithRankings.sort(
    (a, b) => b.ranking.breakdown.smartScore - a.ranking.breakdown.smartScore
  );

  return (
    <div className="rounded-2xl p-5" style={{ border: '1px solid var(--wm-border)', background: 'var(--wm-surface)' }}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">
            Offers <span className="ml-1 text-sm font-normal" style={{ color: 'var(--wm-muted)' }}>({offersWithRankings.length})</span>
          </h2>
          {uniqueInterestedProviders > 0 ? (
            <p className="mt-0.5 text-xs" style={{ color: 'var(--wm-muted)' }}>
              {uniqueInterestedProviders} {uniqueInterestedProviders === 1 ? 'provider' : 'providers'} interested in this job
            </p>
          ) : null}
        </div>
        {offersWithRankings.some((o) => o.isRebooking) && (
          <span className="text-xs text-[var(--wm-primary)] font-medium">
            Repeat booking discount applied
          </span>
        )}
      </div>
      <JobOffersClient offers={offersWithRankings} locale={locale} />
    </div>
  );
}
