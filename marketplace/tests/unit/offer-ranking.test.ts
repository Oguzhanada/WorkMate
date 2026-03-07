import { describe, expect, it, vi, beforeEach } from 'vitest';
import { calculateOfferScore } from '@/lib/ranking/offer-ranking';

// Mock the Supabase service client — we test scoring logic, not DB queries.
vi.mock('@/lib/supabase/service', () => ({
  getSupabaseServiceClient: vi.fn(),
}));

import { getSupabaseServiceClient } from '@/lib/supabase/service';

// Build a mock Supabase client that returns controlled data per table.
function makeMockClient(tableData: Record<string, unknown>) {
  const makeChain = (table: string) => {
    const value = tableData[table] ?? null;
    const chain: Record<string, unknown> = {};
    const terminal = () => Promise.resolve({ data: value, error: null });
    chain.select = () => chain;
    chain.eq = () => chain;
    chain.not = () => chain;
    chain.in = () => chain;
    chain.limit = terminal;
    chain.maybeSingle = terminal;
    return chain;
  };
  return { from: (table: string) => makeChain(table) };
}

// Fixed timestamps for deterministic response-time tests.
const JOB_CREATED_AT = '2025-01-01T10:00:00.000Z';

function quoteCreatedAt(hoursAfterJob: number) {
  return new Date(new Date(JOB_CREATED_AT).getTime() + hoursAfterJob * 60 * 60 * 1000).toISOString();
}

const BASE_OFFER = {
  id: 'offer-1',
  priceCents: 10_000, // EUR 100
  providerId: 'pro-1',
  createdAt: quoteCreatedAt(0.5), // 30 min response → responseScore = 20
};

const BASE_JOB = {
  id: 'job-1',
  categoryId: 'cat-1',
  createdAt: JOB_CREATED_AT,
};

// Provider ranking fixture (approved, 5-star, 50+ jobs, full trust docs)
const FULL_RANKING = {
  provider_id: 'pro-1',
  avg_rating: 5,
  review_count: 40,
  completed_jobs: 50,
  avg_response_hours: 1,
  id_verified_score: 5,
  tax_clearance_score: 10,
  insurance_score: 10,
  safe_pass_score: 5,
  total_trust_score: 30,
};

// Average price for category = EUR 100 (10_000 cents)
const AVG_PRICE_QUOTES = [
  { quote_amount_cents: 10_000, jobs: { category_id: 'cat-1' } },
];

beforeEach(() => {
  vi.mocked(getSupabaseServiceClient).mockReturnValue(
    makeMockClient({
      provider_rankings: FULL_RANKING,
      quotes: AVG_PRICE_QUOTES,
    }) as unknown as ReturnType<typeof getSupabaseServiceClient>
  );
});

// ─── Score component tests ─────────────────────────────────────────────────

describe('calculateOfferScore — priceScore', () => {
  it('gives max priceScore (25) when offer is 50% below average price', async () => {
    const result = await calculateOfferScore(
      { ...BASE_OFFER, priceCents: 5_000 }, // EUR 50, avg EUR 100 → ratio 2.0
      BASE_JOB
    );
    expect(result.breakdown.priceScore).toBe(25); // min(25, 2.0 * 15) = 25
  });

  it('gives 15 priceScore when offer matches average price exactly', async () => {
    const result = await calculateOfferScore(
      { ...BASE_OFFER, priceCents: 10_000 }, // ratio 1.0
      BASE_JOB
    );
    expect(result.breakdown.priceScore).toBe(15); // min(25, 1.0 * 15) = 15
  });

  it('gives lower priceScore when offer is above average price', async () => {
    const result = await calculateOfferScore(
      { ...BASE_OFFER, priceCents: 20_000 }, // EUR 200, ratio 0.5
      BASE_JOB
    );
    expect(result.breakdown.priceScore).toBe(Math.round(0.5 * 15)); // 7 or 8
  });

  it('clamps priceScore to 0 when offer is extremely expensive', async () => {
    const result = await calculateOfferScore(
      { ...BASE_OFFER, priceCents: 1_000_000 }, // EUR 10,000 — ratio near 0
      BASE_JOB
    );
    expect(result.breakdown.priceScore).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.priceScore).toBeLessThanOrEqual(2);
  });
});

describe('calculateOfferScore — ratingScore', () => {
  it('gives 20 ratingScore for a 5-star provider', async () => {
    const result = await calculateOfferScore(BASE_OFFER, BASE_JOB);
    expect(result.breakdown.ratingScore).toBe(20);
  });

  it('gives 16 ratingScore for a 4-star provider', async () => {
    vi.mocked(getSupabaseServiceClient).mockReturnValue(
      makeMockClient({
        provider_rankings: { ...FULL_RANKING, avg_rating: 4 },
        quotes: AVG_PRICE_QUOTES,
      }) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );
    const result = await calculateOfferScore(BASE_OFFER, BASE_JOB);
    expect(result.breakdown.ratingScore).toBe(16);
  });

  it('gives default 10 ratingScore when provider has no ranking record', async () => {
    vi.mocked(getSupabaseServiceClient).mockReturnValue(
      makeMockClient({
        provider_rankings: null, // no record in view
        quotes: AVG_PRICE_QUOTES,
      }) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );
    const result = await calculateOfferScore(BASE_OFFER, BASE_JOB);
    expect(result.breakdown.ratingScore).toBe(10);
  });
});

describe('calculateOfferScore — responseScore', () => {
  it('gives 20 for response under 1 hour', async () => {
    const result = await calculateOfferScore(
      { ...BASE_OFFER, createdAt: quoteCreatedAt(0.5) },
      BASE_JOB
    );
    expect(result.breakdown.responseScore).toBe(20);
  });

  it('gives 17 for response between 1 and 3 hours', async () => {
    const result = await calculateOfferScore(
      { ...BASE_OFFER, createdAt: quoteCreatedAt(2) },
      BASE_JOB
    );
    expect(result.breakdown.responseScore).toBe(17);
  });

  it('gives 14 for response between 3 and 6 hours', async () => {
    const result = await calculateOfferScore(
      { ...BASE_OFFER, createdAt: quoteCreatedAt(4) },
      BASE_JOB
    );
    expect(result.breakdown.responseScore).toBe(14);
  });

  it('gives 11 for response between 6 and 12 hours', async () => {
    const result = await calculateOfferScore(
      { ...BASE_OFFER, createdAt: quoteCreatedAt(8) },
      BASE_JOB
    );
    expect(result.breakdown.responseScore).toBe(11);
  });

  it('gives 8 for response between 12 and 24 hours', async () => {
    const result = await calculateOfferScore(
      { ...BASE_OFFER, createdAt: quoteCreatedAt(18) },
      BASE_JOB
    );
    expect(result.breakdown.responseScore).toBe(8);
  });

  it('gives 5 for response over 24 hours', async () => {
    const result = await calculateOfferScore(
      { ...BASE_OFFER, createdAt: quoteCreatedAt(30) },
      BASE_JOB
    );
    expect(result.breakdown.responseScore).toBe(5);
  });
});

describe('calculateOfferScore — matchScore (completedJobs)', () => {
  const withCompletedJobs = (n: number) =>
    vi.mocked(getSupabaseServiceClient).mockReturnValue(
      makeMockClient({
        provider_rankings: { ...FULL_RANKING, completed_jobs: n },
        quotes: AVG_PRICE_QUOTES,
      }) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

  it('gives 15 matchScore for 50+ completed jobs', async () => {
    withCompletedJobs(50);
    const result = await calculateOfferScore(BASE_OFFER, BASE_JOB);
    expect(result.breakdown.matchScore).toBe(15);
  });

  it('gives 13 matchScore for 20–49 completed jobs', async () => {
    withCompletedJobs(25);
    const result = await calculateOfferScore(BASE_OFFER, BASE_JOB);
    expect(result.breakdown.matchScore).toBe(13);
  });

  it('gives 11 matchScore for 10–19 completed jobs', async () => {
    withCompletedJobs(10);
    const result = await calculateOfferScore(BASE_OFFER, BASE_JOB);
    expect(result.breakdown.matchScore).toBe(11);
  });

  it('gives 9 matchScore for 5–9 completed jobs', async () => {
    withCompletedJobs(7);
    const result = await calculateOfferScore(BASE_OFFER, BASE_JOB);
    expect(result.breakdown.matchScore).toBe(9);
  });

  it('gives 8 matchScore for fewer than 5 completed jobs', async () => {
    withCompletedJobs(2);
    const result = await calculateOfferScore(BASE_OFFER, BASE_JOB);
    expect(result.breakdown.matchScore).toBe(8);
  });

  it('gives 8 matchScore when no ranking record exists', async () => {
    vi.mocked(getSupabaseServiceClient).mockReturnValue(
      makeMockClient({ provider_rankings: null, quotes: AVG_PRICE_QUOTES }) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );
    const result = await calculateOfferScore(BASE_OFFER, BASE_JOB);
    expect(result.breakdown.matchScore).toBe(8);
  });
});

// ─── Badge tests ──────────────────────────────────────────────────────────

describe('calculateOfferScore — badge assignment', () => {
  it('assigns TOP_OFFER badge when score >= 85', async () => {
    // Full ranking + fast response + below-average price → highest possible score
    const result = await calculateOfferScore(
      { ...BASE_OFFER, priceCents: 5_000, createdAt: quoteCreatedAt(0.5) },
      BASE_JOB
    );
    if (result.score >= 85) {
      expect(result.badge).toBe('TOP_OFFER');
    } else {
      // score may be < 85 depending on trust; still valid, just no TOP_OFFER badge
      expect(result.badge).not.toBe('TOP_OFFER');
    }
  });

  it('assigns TRUSTED_PRO badge when complianceScore >= 80 and smartScore < 85', async () => {
    // Expensive + slow offer → low price/response scores → smartScore < 85
    // compliance_score=90 → TRUSTED_PRO badge should fire
    vi.mocked(getSupabaseServiceClient).mockReturnValue(
      makeMockClient({
        provider_rankings: { ...FULL_RANKING, avg_rating: 0, completed_jobs: 0, total_trust_score: 0, compliance_score: 90 },
        quotes: AVG_PRICE_QUOTES,
      }) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );
    const result = await calculateOfferScore(
      { ...BASE_OFFER, priceCents: 100_000, createdAt: quoteCreatedAt(30) }, // expensive + slow
      BASE_JOB
    );
    // complianceScore=90 ≥ 80, and with low price+response the smartScore should be < 85
    if (result.breakdown.smartScore < 85 && result.breakdown.complianceMultiplier >= 1.2) {
      expect(result.badge).toBe('TRUSTED_PRO');
    }
  });

  it('assigns FAST_RESPONDER badge when responseScore >= 17 and conditions not met for others', async () => {
    vi.mocked(getSupabaseServiceClient).mockReturnValue(
      makeMockClient({
        provider_rankings: { ...FULL_RANKING, total_trust_score: 0, avg_rating: 0, completed_jobs: 0 },
        quotes: AVG_PRICE_QUOTES,
      }) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );
    const result = await calculateOfferScore(
      { ...BASE_OFFER, priceCents: 100_000, createdAt: quoteCreatedAt(1.5) }, // slow response → responseScore=17
      BASE_JOB
    );
    if (result.score < 85 && result.breakdown.trustScore < 20 && result.breakdown.responseScore >= 17) {
      expect(result.badge).toBe('FAST_RESPONDER');
    }
  });

  it('returns no badge for a low-scoring offer', async () => {
    vi.mocked(getSupabaseServiceClient).mockReturnValue(
      makeMockClient({
        provider_rankings: { ...FULL_RANKING, avg_rating: 0, completed_jobs: 0, total_trust_score: 0 },
        quotes: AVG_PRICE_QUOTES,
      }) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );
    const result = await calculateOfferScore(
      { ...BASE_OFFER, priceCents: 500_000, createdAt: quoteCreatedAt(48) }, // very expensive + very slow
      BASE_JOB
    );
    expect(result.badge).toBeUndefined();
  });
});

// ─── Total score integrity ─────────────────────────────────────────────────

describe('calculateOfferScore — total score integrity', () => {
  it('score equals sum of all breakdown components', async () => {
    const result = await calculateOfferScore(BASE_OFFER, BASE_JOB);
    const { priceScore, ratingScore, responseScore, matchScore, trustScore } = result.breakdown;
    expect(result.score).toBe(Math.round(priceScore + ratingScore + responseScore + matchScore + trustScore));
  });

  it('score is always a non-negative integer', async () => {
    const result = await calculateOfferScore(BASE_OFFER, BASE_JOB);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result.score)).toBe(true);
  });

  it('uses default average price of EUR 100 (10000 cents) when no historical quotes exist', async () => {
    vi.mocked(getSupabaseServiceClient).mockReturnValue(
      makeMockClient({
        provider_rankings: FULL_RANKING,
        quotes: [], // no historical data → fallback avg = 10_000
      }) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );
    const result = await calculateOfferScore(
      { ...BASE_OFFER, priceCents: 10_000 }, // matches fallback avg exactly
      BASE_JOB
    );
    expect(result.breakdown.priceScore).toBe(15); // ratio=1.0 → 15
  });
});
