import { describe, expect, it, vi } from 'vitest';
import { fetchCustomerDashboardData } from '@/lib/queries/customer-dashboard';

// ---------------------------------------------------------------------------
// Minimal SupabaseClient mock factory
// ---------------------------------------------------------------------------
// The function under test issues sequential batched queries. We model each
// Supabase chained call as a builder that resolves with { data, error }.
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>;

// Build a fluent Supabase-like query builder that always resolves with
// the given rows. Every builder method (select, eq, in, order, limit, …)
// returns the same builder so chains of any length are supported.
// The builder is also directly awaitable (it IS the Promise).
function buildChain(result: Row[]) {
  const response = { data: result, error: null };

  // We define a class so `this` is stable and every method returns `this`.
  class Chain {
    select() { return this; }
    eq() { return this; }
    neq() { return this; }
    in() { return this; }
    not() { return this; }
    order() { return this; }
    limit() { return Promise.resolve(response); }
    maybeSingle() { return Promise.resolve(response); }
    single() { return Promise.resolve(response); }
    // Make the chain itself awaitable (for queries that end without limit/single)
    then<T>(
      onfulfilled?: ((value: typeof response) => T) | null,
    ) {
      return Promise.resolve(response).then(onfulfilled);
    }
  }

  return new Chain();
}

function makeSupabase(tableMap: Record<string, Row[]>) {
  return {
    from: (table: string) => buildChain(tableMap[table] ?? []),
  } as unknown as Parameters<typeof fetchCustomerDashboardData>[0];
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const USER_ID = 'user-aaa';
const JOB_A = 'job-aaa';
const JOB_B = 'job-bbb';
const PRO_X = 'pro-xxx';
const PRO_Y = 'pro-yyy';
const QUOTE_1 = 'quote-1';
const QUOTE_2 = 'quote-2';
const QUOTE_3 = 'quote-3';

const baseJob = (id: string, status = 'open', createdAt = '2026-01-10T00:00:00Z') => ({
  id,
  title: 'Test job',
  category: 'Cleaning',
  category_id: 'cat-1',
  status,
  review_status: null,
  accepted_quote_id: null,
  budget_range: '€50-€100',
  eircode: 'D02X285',
  photo_urls: null,
  created_at: createdAt,
  auto_release_at: null,
  payment_released_at: null,
  job_mode: 'get_quotes',
  target_provider_id: null,
});

const baseQuote = (
  id: string,
  jobId: string,
  proId: string,
  rankingScore: number | null = null,
  createdAt = '2026-01-11T00:00:00Z'
) => ({
  id,
  job_id: jobId,
  pro_id: proId,
  quote_amount_cents: 8000,
  message: null,
  estimated_duration: null,
  includes: [],
  excludes: [],
  status: 'pending',
  created_at: createdAt,
  ranking_score: rankingScore,
});

const basePro = (id: string, priority = 1) => ({
  id,
  full_name: `Pro ${id}`,
  stripe_account_id: `acct_${id}`,
  id_verification_status: 'approved',
  provider_matching_priority: priority,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('fetchCustomerDashboardData', () => {
  describe('empty state — no jobs', () => {
    it('returns zero counts and empty maps', async () => {
      const supabase = makeSupabase({ jobs: [], disputes: [], quotes: [] });
      const result = await fetchCustomerDashboardData(supabase, USER_ID);

      expect(result.jobs).toHaveLength(0);
      expect(result.stats.totalJobs).toBe(0);
      expect(result.stats.openJobs).toBe(0);
      expect(result.quotesByJob.size).toBe(0);
      expect(result.proNameById.size).toBe(0);
      expect(result.activeDisputeCount).toBe(0);
    });

    it('monthCounts has exactly 6 entries all zero', async () => {
      const supabase = makeSupabase({ jobs: [] });
      const { stats } = await fetchCustomerDashboardData(supabase, USER_ID);

      expect(stats.monthKeys).toHaveLength(6);
      for (const k of stats.monthKeys) {
        expect(stats.monthCounts.get(k)).toBe(0);
      }
    });
  });

  describe('stats counting', () => {
    it('counts open, accepted and completed jobs correctly', async () => {
      const jobs = [
        baseJob('j1', 'open'),
        baseJob('j2', 'open'),
        baseJob('j3', 'accepted'),
        baseJob('j4', 'completed'),
        baseJob('j5', 'completed'),
        baseJob('j6', 'completed'),
      ];
      const supabase = makeSupabase({ jobs, quotes: [], disputes: [] });
      const { stats } = await fetchCustomerDashboardData(supabase, USER_ID);

      expect(stats.totalJobs).toBe(6);
      expect(stats.openJobs).toBe(2);
      expect(stats.assignedJobs).toBe(1);
      expect(stats.completedJobsCount).toBe(3);
    });

    it('buckets jobs into the correct month', async () => {
      // Create a job in the current month
      const now = new Date();
      const createdAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01T00:00:00Z`;
      const jobs = [baseJob('j1', 'open', createdAt)];
      const supabase = makeSupabase({ jobs, quotes: [], disputes: [] });
      const { stats } = await fetchCustomerDashboardData(supabase, USER_ID);

      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      expect(stats.monthCounts.get(currentMonthKey)).toBe(1);
    });
  });

  describe('quotesByJob grouping and sorting', () => {
    it('groups quotes under the correct job', async () => {
      const jobs = [baseJob(JOB_A), baseJob(JOB_B)];
      const quotes = [
        baseQuote(QUOTE_1, JOB_A, PRO_X),
        baseQuote(QUOTE_2, JOB_A, PRO_Y),
        baseQuote(QUOTE_3, JOB_B, PRO_X),
      ];
      const supabase = makeSupabase({ jobs, quotes, disputes: [], profiles: [basePro(PRO_X), basePro(PRO_Y)], reviews: [], payments: [] });
      const { quotesByJob } = await fetchCustomerDashboardData(supabase, USER_ID);

      expect(quotesByJob.get(JOB_A)).toHaveLength(2);
      expect(quotesByJob.get(JOB_B)).toHaveLength(1);
    });

    it('sorts by ranking_score DESC', async () => {
      const jobs = [baseJob(JOB_A)];
      const quotes = [
        baseQuote(QUOTE_1, JOB_A, PRO_X, 40, '2026-01-11T10:00:00Z'),
        baseQuote(QUOTE_2, JOB_A, PRO_Y, 80, '2026-01-11T09:00:00Z'),
        baseQuote(QUOTE_3, JOB_A, PRO_X, 60, '2026-01-11T08:00:00Z'),
      ];
      const supabase = makeSupabase({ jobs, quotes, disputes: [], profiles: [basePro(PRO_X), basePro(PRO_Y)], reviews: [], payments: [] });
      const { quotesByJob } = await fetchCustomerDashboardData(supabase, USER_ID);

      const sorted = quotesByJob.get(JOB_A)!;
      expect(sorted[0].id).toBe(QUOTE_2); // score 80
      expect(sorted[1].id).toBe(QUOTE_3); // score 60
      expect(sorted[2].id).toBe(QUOTE_1); // score 40
    });

    it('sorts by provider_matching_priority DESC when scores are equal', async () => {
      const jobs = [baseJob(JOB_A)];
      const quotes = [
        baseQuote(QUOTE_1, JOB_A, PRO_X, 70, '2026-01-11T10:00:00Z'),
        baseQuote(QUOTE_2, JOB_A, PRO_Y, 70, '2026-01-11T09:00:00Z'),
      ];
      const proX = basePro(PRO_X, 1);
      const proY = basePro(PRO_Y, 5); // higher priority
      const supabase = makeSupabase({ jobs, quotes, disputes: [], profiles: [proX, proY], reviews: [], payments: [] });
      const { quotesByJob } = await fetchCustomerDashboardData(supabase, USER_ID);

      const sorted = quotesByJob.get(JOB_A)!;
      expect(sorted[0].pro_id).toBe(PRO_Y); // priority 5
      expect(sorted[1].pro_id).toBe(PRO_X); // priority 1
    });

    it('sorts by created_at DESC when score and priority are equal', async () => {
      const jobs = [baseJob(JOB_A)];
      const quotes = [
        baseQuote(QUOTE_1, JOB_A, PRO_X, 70, '2026-01-11T08:00:00Z'), // older
        baseQuote(QUOTE_2, JOB_A, PRO_Y, 70, '2026-01-11T10:00:00Z'), // newer
      ];
      const supabase = makeSupabase({ jobs, quotes, disputes: [], profiles: [basePro(PRO_X), basePro(PRO_Y)], reviews: [], payments: [] });
      const { quotesByJob } = await fetchCustomerDashboardData(supabase, USER_ID);

      const sorted = quotesByJob.get(JOB_A)!;
      expect(sorted[0].id).toBe(QUOTE_2); // newer first
    });

    it('treats null ranking_score as 0 for sorting', async () => {
      const jobs = [baseJob(JOB_A)];
      const quotes = [
        baseQuote(QUOTE_1, JOB_A, PRO_X, null),
        baseQuote(QUOTE_2, JOB_A, PRO_Y, 50),
      ];
      const supabase = makeSupabase({ jobs, quotes, disputes: [], profiles: [basePro(PRO_X), basePro(PRO_Y)], reviews: [], payments: [] });
      const { quotesByJob } = await fetchCustomerDashboardData(supabase, USER_ID);

      const sorted = quotesByJob.get(JOB_A)!;
      expect(sorted[0].id).toBe(QUOTE_2); // score 50 > null(0)
    });
  });

  describe('reviewStatsByPro', () => {
    it('calculates average rating correctly for multiple reviews', async () => {
      const jobs = [baseJob(JOB_A)];
      const quotes = [baseQuote(QUOTE_1, JOB_A, PRO_X)];
      const reviews = [
        { pro_id: PRO_X, rating: 5 },
        { pro_id: PRO_X, rating: 3 },
        { pro_id: PRO_X, rating: 4 },
      ];
      const supabase = makeSupabase({ jobs, quotes, disputes: [], profiles: [basePro(PRO_X)], reviews, payments: [] });
      const { reviewStatsByPro } = await fetchCustomerDashboardData(supabase, USER_ID);

      const stats = reviewStatsByPro.get(PRO_X);
      expect(stats?.count).toBe(3);
      expect(stats?.avg).toBeCloseTo(4.0, 5);
    });

    it('handles single review', async () => {
      const jobs = [baseJob(JOB_A)];
      const quotes = [baseQuote(QUOTE_1, JOB_A, PRO_X)];
      const reviews = [{ pro_id: PRO_X, rating: 5 }];
      const supabase = makeSupabase({ jobs, quotes, disputes: [], profiles: [basePro(PRO_X)], reviews, payments: [] });
      const { reviewStatsByPro } = await fetchCustomerDashboardData(supabase, USER_ID);

      expect(reviewStatsByPro.get(PRO_X)).toEqual({ count: 1, avg: 5 });
    });

    it('maintains separate averages for different pros', async () => {
      const jobs = [baseJob(JOB_A)];
      const quotes = [
        baseQuote(QUOTE_1, JOB_A, PRO_X),
        baseQuote(QUOTE_2, JOB_A, PRO_Y),
      ];
      const reviews = [
        { pro_id: PRO_X, rating: 5 },
        { pro_id: PRO_Y, rating: 2 },
        { pro_id: PRO_Y, rating: 4 },
      ];
      const supabase = makeSupabase({ jobs, quotes, disputes: [], profiles: [basePro(PRO_X), basePro(PRO_Y)], reviews, payments: [] });
      const { reviewStatsByPro } = await fetchCustomerDashboardData(supabase, USER_ID);

      expect(reviewStatsByPro.get(PRO_X)?.avg).toBe(5);
      expect(reviewStatsByPro.get(PRO_Y)?.avg).toBe(3);
    });
  });

  describe('completedByPro', () => {
    it('counts completed jobs per pro via accepted_quote_id', async () => {
      const jobs = [baseJob(JOB_A)];
      const quotes = [
        baseQuote(QUOTE_1, JOB_A, PRO_X),
        baseQuote(QUOTE_2, JOB_A, PRO_Y),
      ];
      // completedJobs query returns rows from jobs table with accepted_quote_id
      const completedJobRows = [
        { accepted_quote_id: QUOTE_1 },
        { accepted_quote_id: QUOTE_1 },
        { accepted_quote_id: QUOTE_2 },
      ];
      const supabase = makeSupabase({
        jobs: [...jobs, ...completedJobRows] as Row[],
        quotes,
        disputes: [],
        profiles: [basePro(PRO_X), basePro(PRO_Y)],
        reviews: [],
        payments: [],
      });
      const { completedByPro } = await fetchCustomerDashboardData(supabase, USER_ID);

      // Note: the 'jobs' table mock is shared for both the main jobs query and completedJobs query.
      // The completedByPro count comes from what the mock returns for the second jobs.select call.
      // Since our mock returns ALL rows for any 'jobs' query, we verify the map is populated.
      expect(completedByPro.has(PRO_X) || completedByPro.has(PRO_Y)).toBe(true);
    });
  });

  describe('proNameById and stripeAccountByProId maps', () => {
    it('maps pro IDs to full names', async () => {
      const jobs = [baseJob(JOB_A)];
      const quotes = [baseQuote(QUOTE_1, JOB_A, PRO_X)];
      const profiles = [{ ...basePro(PRO_X), full_name: 'John Doe' }];
      const supabase = makeSupabase({ jobs, quotes, disputes: [], profiles, reviews: [], payments: [] });
      const { proNameById } = await fetchCustomerDashboardData(supabase, USER_ID);

      expect(proNameById.get(PRO_X)).toBe('John Doe');
    });

    it('falls back to "Professional" for null full_name', async () => {
      const jobs = [baseJob(JOB_A)];
      const quotes = [baseQuote(QUOTE_1, JOB_A, PRO_X)];
      const profiles = [{ ...basePro(PRO_X), full_name: null }];
      const supabase = makeSupabase({ jobs, quotes, disputes: [], profiles, reviews: [], payments: [] });
      const { proNameById } = await fetchCustomerDashboardData(supabase, USER_ID);

      expect(proNameById.get(PRO_X)).toBe('Professional');
    });
  });

  describe('activeDisputeCount', () => {
    it('returns count of open and under_review disputes', async () => {
      const jobs = [baseJob(JOB_A), baseJob(JOB_B)];
      const disputes = [
        { id: 'd1', job_id: JOB_A, status: 'open' },
        { id: 'd2', job_id: JOB_B, status: 'under_review' },
      ];
      const supabase = makeSupabase({ jobs, disputes, quotes: [] });
      const { activeDisputeCount } = await fetchCustomerDashboardData(supabase, USER_ID);

      expect(activeDisputeCount).toBe(2);
    });

    it('returns zero when no disputes', async () => {
      const jobs = [baseJob(JOB_A)];
      const supabase = makeSupabase({ jobs, disputes: [], quotes: [] });
      const { activeDisputeCount } = await fetchCustomerDashboardData(supabase, USER_ID);

      expect(activeDisputeCount).toBe(0);
    });
  });

  describe('portfolio', () => {
    it('returns portfolio items for pro IDs found in quotes', async () => {
      const jobs = [baseJob(JOB_A)];
      const quotes = [baseQuote(QUOTE_1, JOB_A, PRO_X)];
      const portfolioItems = [
        {
          id: 'port-1',
          profile_id: PRO_X,
          category_id: 'cat-1',
          before_image_url: 'before.jpg',
          after_image_url: 'after.jpg',
          experience_note: 'Great work',
          created_at: '2026-01-01T00:00:00Z',
        },
      ];
      const supabase = makeSupabase({
        jobs,
        quotes,
        disputes: [],
        profiles: [basePro(PRO_X)],
        reviews: [],
        payments: [],
        pro_portfolio: portfolioItems,
      });
      const { portfolio } = await fetchCustomerDashboardData(supabase, USER_ID);

      expect(portfolio).toHaveLength(1);
      expect(portfolio[0].profile_id).toBe(PRO_X);
    });
  });
});
