import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock the Supabase service client before importing the module under test.
vi.mock('@/lib/supabase/service', () => ({
  getSupabaseServiceClient: vi.fn(),
}));

import { getSupabaseServiceClient } from '@/lib/supabase/service';
import {
  calculateFees,
  getProviderPlan,
  getRebookingInfo,
  CUSTOMER_FEE_TIERS,
  PLATFORM_FEE_THRESHOLD,
  STRIPE_PROCESSING_RATE,
  STRIPE_FIXED_FEE,
  STRIPE_CONNECT_FEE,
} from '@/lib/pricing/fee-calculator';

/* ─── Helpers ─── */

/**
 * Build a mock Supabase client that returns controlled data per table.
 * Supports chaining: .from().select().eq().order().limit().maybeSingle()
 */
function makeMockClient(tableData: Record<string, unknown>) {
  const makeChain = (table: string) => {
    const value = tableData[table] ?? null;
    const terminal = () => Promise.resolve({ data: value, error: null });
    const chain: Record<string, unknown> = {};
    chain.select = () => chain;
    chain.eq = () => chain;
    chain.order = () => chain;
    chain.limit = () => chain;
    chain.maybeSingle = terminal;
    chain.rpc = () => Promise.resolve({ data: null, error: null });
    return chain;
  };
  return {
    from: (table: string) => makeChain(table),
    rpc: () => Promise.resolve({ data: null, error: null }),
  };
}

const CUSTOMER_ID = 'cust-001';
const PROVIDER_ID = 'prov-001';

beforeEach(() => {
  vi.clearAllMocks();
});

/* ─── 1. Customer fee tiers ─── */

describe('Customer fee tiers', () => {
  // We test calculateFees which internally calls getCustomerFeeRate.
  // For tier tests, use a first-time booking (not rebooking) with basic plan.

  function setupMock(plan: string | null, rebookingData: unknown) {
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient({
        provider_subscriptions: plan ? { plan } : null,
        customer_provider_history: rebookingData,
      }) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );
  }

  const noRebooking = null; // first-time customer

  it('€0 subtotal (0 cents) — tier 1, 0% fee', async () => {
    setupMock('basic', noRebooking);
    const result = await calculateFees(0, CUSTOMER_ID, PROVIDER_ID);
    expect(result.subtotal).toBe(0);
    expect(result.serviceFee).toBe(0);
    expect(result.total).toBe(0);
    expect(result.isRebooking).toBe(false);
  });

  it('€49 subtotal (4900 cents) — tier 1, 0% fee', async () => {
    setupMock('basic', noRebooking);
    const result = await calculateFees(4900, CUSTOMER_ID, PROVIDER_ID);
    expect(result.subtotal).toBe(49);
    expect(result.serviceFee).toBe(0);
    expect(result.total).toBe(49);
  });

  it('€50 subtotal (5000 cents) — tier 2, 5% fee', async () => {
    setupMock('basic', noRebooking);
    const result = await calculateFees(5000, CUSTOMER_ID, PROVIDER_ID);
    expect(result.subtotal).toBe(50);
    expect(result.serviceFee).toBe(2.5);
    expect(result.total).toBe(52.5);
  });

  it('€99 subtotal (9900 cents) — tier 2, 5% fee', async () => {
    setupMock('basic', noRebooking);
    const result = await calculateFees(9900, CUSTOMER_ID, PROVIDER_ID);
    expect(result.subtotal).toBe(99);
    expect(result.serviceFee).toBeCloseTo(4.95);
    expect(result.total).toBeCloseTo(103.95);
  });

  it('€100 subtotal (10000 cents) — tier 3, 7% fee', async () => {
    setupMock('basic', noRebooking);
    const result = await calculateFees(10000, CUSTOMER_ID, PROVIDER_ID);
    expect(result.subtotal).toBe(100);
    expect(result.serviceFee).toBeCloseTo(7);
    expect(result.total).toBeCloseTo(107);
  });

  it('€299 subtotal (29900 cents) — tier 3, 7% fee', async () => {
    setupMock('basic', noRebooking);
    const result = await calculateFees(29900, CUSTOMER_ID, PROVIDER_ID);
    expect(result.subtotal).toBe(299);
    expect(result.serviceFee).toBeCloseTo(20.93);
    expect(result.total).toBeCloseTo(319.93);
  });

  it('€300 subtotal (30000 cents) — tier 4, 5% fee', async () => {
    setupMock('basic', noRebooking);
    const result = await calculateFees(30000, CUSTOMER_ID, PROVIDER_ID);
    expect(result.subtotal).toBe(300);
    expect(result.serviceFee).toBe(15);
    expect(result.total).toBe(315);
  });

  it('€500 subtotal (50000 cents) — tier 4, 5% fee', async () => {
    setupMock('basic', noRebooking);
    const result = await calculateFees(50000, CUSTOMER_ID, PROVIDER_ID);
    expect(result.subtotal).toBe(500);
    expect(result.serviceFee).toBe(25);
    expect(result.total).toBe(525);
  });
});

/* ─── 2. Rebooking customer rates ─── */

describe('Rebooking customer rates', () => {
  function setupRebooking(plan: string) {
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient({
        provider_subscriptions: { plan },
        customer_provider_history: {
          jobs_completed: 3,
          last_job_at: '2025-12-01T00:00:00Z',
          total_spent_cents: 50000,
          is_favorite: false,
        },
      }) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );
  }

  it('€49 rebooking — tier 1, 0% (same as standard)', async () => {
    setupRebooking('basic');
    const result = await calculateFees(4900, CUSTOMER_ID, PROVIDER_ID);
    expect(result.isRebooking).toBe(true);
    expect(result.serviceFee).toBe(0);
  });

  it('€50 rebooking — tier 2, 3% instead of 5%', async () => {
    setupRebooking('basic');
    const result = await calculateFees(5000, CUSTOMER_ID, PROVIDER_ID);
    expect(result.isRebooking).toBe(true);
    expect(result.serviceFee).toBe(1.5); // 50 * 0.03
    expect(result.total).toBe(51.5);
  });

  it('€100 rebooking — tier 3, 4% instead of 7%', async () => {
    setupRebooking('basic');
    const result = await calculateFees(10000, CUSTOMER_ID, PROVIDER_ID);
    expect(result.isRebooking).toBe(true);
    expect(result.serviceFee).toBe(4); // 100 * 0.04
    expect(result.total).toBe(104);
  });

  it('€300 rebooking — tier 4, 3% instead of 5%', async () => {
    setupRebooking('basic');
    const result = await calculateFees(30000, CUSTOMER_ID, PROVIDER_ID);
    expect(result.isRebooking).toBe(true);
    expect(result.serviceFee).toBe(9); // 300 * 0.03
    expect(result.total).toBe(309);
  });
});

/* ─── 3. Provider commission by plan (standard booking) ─── */

describe('Provider commission by plan', () => {
  function setupPlan(plan: string) {
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient({
        provider_subscriptions: { plan },
        customer_provider_history: null, // first-time
      }) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );
  }

  it('basic plan — 5% commission', async () => {
    setupPlan('basic');
    const result = await calculateFees(10000, CUSTOMER_ID, PROVIDER_ID);
    expect(result.transactionFee).toBe(5); // 100 * 0.05
  });

  it('professional plan — 3% commission', async () => {
    setupPlan('professional');
    const result = await calculateFees(10000, CUSTOMER_ID, PROVIDER_ID);
    expect(result.transactionFee).toBe(3); // 100 * 0.03
  });

  it('premium plan — 1.5% commission', async () => {
    setupPlan('premium');
    const result = await calculateFees(10000, CUSTOMER_ID, PROVIDER_ID);
    expect(result.transactionFee).toBe(1.5); // 100 * 0.015
  });
});

/* ─── 4. Rebooking provider commission ─── */

describe('Rebooking provider commission', () => {
  function setupRebookingPlan(plan: string) {
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient({
        provider_subscriptions: { plan },
        customer_provider_history: {
          jobs_completed: 5,
          last_job_at: '2025-12-01T00:00:00Z',
          total_spent_cents: 80000,
          is_favorite: true,
        },
      }) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );
  }

  it('basic plan rebooking — 3% commission', async () => {
    setupRebookingPlan('basic');
    const result = await calculateFees(20000, CUSTOMER_ID, PROVIDER_ID);
    expect(result.isRebooking).toBe(true);
    expect(result.transactionFee).toBe(6); // 200 * 0.03
  });

  it('professional plan rebooking — 1.5% commission', async () => {
    setupRebookingPlan('professional');
    const result = await calculateFees(20000, CUSTOMER_ID, PROVIDER_ID);
    expect(result.isRebooking).toBe(true);
    expect(result.transactionFee).toBe(3); // 200 * 0.015
  });

  it('premium plan rebooking — 0.75% commission', async () => {
    setupRebookingPlan('premium');
    const result = await calculateFees(20000, CUSTOMER_ID, PROVIDER_ID);
    expect(result.isRebooking).toBe(true);
    expect(result.transactionFee).toBe(1.5); // 200 * 0.0075
  });
});

/* ─── 5. Edge cases ─── */

describe('Edge cases', () => {
  function setupBasic() {
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient({
        provider_subscriptions: null,
        customer_provider_history: null,
      }) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );
  }

  it('negative priceCents is clamped to 0', async () => {
    setupBasic();
    const result = await calculateFees(-5000, CUSTOMER_ID, PROVIDER_ID);
    expect(result.subtotal).toBe(0);
    expect(result.serviceFee).toBe(0);
    expect(result.transactionFee).toBe(0);
    expect(result.total).toBe(0);
  });

  it('zero priceCents', async () => {
    setupBasic();
    const result = await calculateFees(0, CUSTOMER_ID, PROVIDER_ID);
    expect(result.subtotal).toBe(0);
    expect(result.serviceFee).toBe(0);
    expect(result.total).toBe(0);
  });

  it('very large amount (€10,000) — tier 4 applies', async () => {
    setupBasic();
    const result = await calculateFees(1_000_000, CUSTOMER_ID, PROVIDER_ID);
    expect(result.subtotal).toBe(10_000);
    expect(result.serviceFee).toBe(500); // 10000 * 0.05
    expect(result.total).toBe(10_500);
    expect(result.transactionFee).toBe(500); // basic 5%
  });

  it('fractional cents (e.g. 1 cent = €0.01) — tier 1, no fee', async () => {
    setupBasic();
    const result = await calculateFees(1, CUSTOMER_ID, PROVIDER_ID);
    expect(result.subtotal).toBe(0.01);
    expect(result.serviceFee).toBe(0);
    expect(result.total).toBe(0.01);
  });
});

/* ─── 6. calculateFees integration ─── */

describe('calculateFees integration', () => {
  it('first-time customer, professional plan, €150 job', async () => {
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient({
        provider_subscriptions: { plan: 'professional' },
        customer_provider_history: null,
      }) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    const result = await calculateFees(15000, CUSTOMER_ID, PROVIDER_ID);
    expect(result.subtotal).toBe(150);
    expect(result.serviceFee).toBeCloseTo(10.5);
    expect(result.transactionFee).toBeCloseTo(4.5);
    expect(result.total).toBeCloseTo(160.5);
    expect(result.savings).toBeUndefined();
    expect(result.isRebooking).toBe(false);
  });

  it('repeat customer, premium plan, €75 job', async () => {
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient({
        provider_subscriptions: { plan: 'premium' },
        customer_provider_history: {
          jobs_completed: 2,
          last_job_at: '2025-11-01T00:00:00Z',
          total_spent_cents: 15000,
          is_favorite: false,
        },
      }) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    const result = await calculateFees(7500, CUSTOMER_ID, PROVIDER_ID);
    // €75 is tier 2 (50-99)
    // standard rate = 0.05, rebooking rate = 0.03
    // savings = 75 * (0.05 - 0.03) = 1.5
    expect(result.subtotal).toBe(75);
    expect(result.serviceFee).toBeCloseTo(2.25);
    expect(result.transactionFee).toBeCloseTo(0.5625);
    expect(result.total).toBeCloseTo(77.25);
    expect(result.savings).toBeCloseTo(1.5);
    expect(result.isRebooking).toBe(true);
  });

  it('repeat customer, basic plan, €25 job — tier 1, no savings', async () => {
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient({
        provider_subscriptions: { plan: 'basic' },
        customer_provider_history: {
          jobs_completed: 1,
          last_job_at: '2025-10-01T00:00:00Z',
          total_spent_cents: 2500,
          is_favorite: false,
        },
      }) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    const result = await calculateFees(2500, CUSTOMER_ID, PROVIDER_ID);
    // €25 is tier 1 (0-49), both standard and rebooking rate are 0
    expect(result).toEqual({
      subtotal: 25,
      serviceFee: 0,
      transactionFee: 0.75,      // 25 * 0.03 (basic rebooking)
      total: 25,
      savings: undefined,        // no savings when both rates are 0
      isRebooking: true,
    });
  });
});

/* ─── 7. getProviderPlan ─── */

describe('getProviderPlan', () => {
  it('returns "basic" when no active subscription', async () => {
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient({ provider_subscriptions: null }) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );
    const plan = await getProviderPlan(PROVIDER_ID);
    expect(plan).toBe('basic');
  });

  it('returns "basic" when plan field is missing', async () => {
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient({ provider_subscriptions: {} }) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );
    const plan = await getProviderPlan(PROVIDER_ID);
    expect(plan).toBe('basic');
  });

  it('returns "professional" for professional subscription', async () => {
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient({ provider_subscriptions: { plan: 'professional' } }) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );
    const plan = await getProviderPlan(PROVIDER_ID);
    expect(plan).toBe('professional');
  });

  it('returns "premium" for premium subscription', async () => {
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient({ provider_subscriptions: { plan: 'premium' } }) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );
    const plan = await getProviderPlan(PROVIDER_ID);
    expect(plan).toBe('premium');
  });

  it('returns "basic" for unknown plan string', async () => {
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient({ provider_subscriptions: { plan: 'enterprise' } }) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );
    const plan = await getProviderPlan(PROVIDER_ID);
    expect(plan).toBe('basic');
  });
});

/* ─── 8. Savings calculation ─── */

describe('Savings calculation', () => {
  function setupRebookingWithPlan(plan: string) {
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient({
        provider_subscriptions: { plan },
        customer_provider_history: {
          jobs_completed: 4,
          last_job_at: '2025-12-15T00:00:00Z',
          total_spent_cents: 60000,
          is_favorite: false,
        },
      }) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );
  }

  it('tier 2 (€50-99) rebooking: savings = subtotal * (0.05 - 0.03)', async () => {
    setupRebookingWithPlan('basic');
    const result = await calculateFees(6000, CUSTOMER_ID, PROVIDER_ID); // €60
    expect(result.savings).toBeCloseTo(1.2); // 60 * 0.02
  });

  it('tier 3 (€100-299) rebooking: savings = subtotal * (0.07 - 0.04)', async () => {
    setupRebookingWithPlan('basic');
    const result = await calculateFees(20000, CUSTOMER_ID, PROVIDER_ID); // €200
    expect(result.savings).toBeCloseTo(6); // 200 * 0.03
  });

  it('tier 4 (€300+) rebooking: savings = subtotal * (0.05 - 0.03)', async () => {
    setupRebookingWithPlan('basic');
    const result = await calculateFees(40000, CUSTOMER_ID, PROVIDER_ID); // €400
    expect(result.savings).toBeCloseTo(8); // 400 * 0.02
  });

  it('tier 1 (€0-49) rebooking: no savings (both rates are 0)', async () => {
    setupRebookingWithPlan('basic');
    const result = await calculateFees(3000, CUSTOMER_ID, PROVIDER_ID); // €30
    expect(result.savings).toBeUndefined();
  });

  it('first-time booking: savings is undefined', async () => {
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient({
        provider_subscriptions: { plan: 'basic' },
        customer_provider_history: null,
      }) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );
    const result = await calculateFees(10000, CUSTOMER_ID, PROVIDER_ID); // €100
    expect(result.savings).toBeUndefined();
  });
});

/* ─── 9. getRebookingInfo ─── */

describe('getRebookingInfo', () => {
  it('returns default info for new customer-provider pair', async () => {
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient({ customer_provider_history: null }) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    const info = await getRebookingInfo(CUSTOMER_ID, PROVIDER_ID);
    expect(info).toEqual({
      hasWorkedBefore: false,
      jobsCompleted: 0,
      totalSpent: 0,
      isFavorite: false,
      discountRate: 0.05, // CUSTOMER_SERVICE_FEE
    });
  });

  it('returns rebooking info for existing relationship', async () => {
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient({
        customer_provider_history: {
          jobs_completed: 7,
          last_job_at: '2025-12-20T10:00:00Z',
          total_spent_cents: 125000,
          is_favorite: true,
        },
      }) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    const info = await getRebookingInfo(CUSTOMER_ID, PROVIDER_ID);
    expect(info).toEqual({
      hasWorkedBefore: true,
      jobsCompleted: 7,
      lastJobAt: '2025-12-20T10:00:00Z',
      totalSpent: 1250,
      isFavorite: true,
      discountRate: 0.03, // REBOOKING_CUSTOMER_FEE
    });
  });

  it('handles zero jobs_completed as not worked before', async () => {
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient({
        customer_provider_history: {
          jobs_completed: 0,
          last_job_at: null,
          total_spent_cents: 0,
          is_favorite: false,
        },
      }) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    const info = await getRebookingInfo(CUSTOMER_ID, PROVIDER_ID);
    expect(info.hasWorkedBefore).toBe(false);
    expect(info.discountRate).toBe(0.05);
  });
});

/* ─── 10. Exported constants ─── */

describe('Exported constants', () => {
  it('CUSTOMER_FEE_TIERS has 4 tiers covering 0 to Infinity', () => {
    expect(CUSTOMER_FEE_TIERS).toHaveLength(4);
    expect(CUSTOMER_FEE_TIERS[0].min).toBe(0);
    expect(CUSTOMER_FEE_TIERS[3].max).toBe(Infinity);
  });

  it('PLATFORM_FEE_THRESHOLD is 50', () => {
    expect(PLATFORM_FEE_THRESHOLD).toBe(50);
  });

  it('Stripe constants are correct', () => {
    expect(STRIPE_PROCESSING_RATE).toBe(0.0175);
    expect(STRIPE_FIXED_FEE).toBe(0.25);
    expect(STRIPE_CONNECT_FEE).toBe(0.0025);
  });
});
