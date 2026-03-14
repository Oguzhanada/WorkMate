import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock the Supabase service client before importing the module under test.
vi.mock('@/lib/supabase/service', () => ({
  getSupabaseServiceClient: vi.fn(),
}));

import { getSupabaseServiceClient } from '@/lib/supabase/service';
import {
  MONTHLY_CREDITS_BY_PLAN,
  quoteCreditCost,
  getCreditBalance,
  adjustCredits,
  debitQuoteCredits,
  refundQuoteCredits,
  grantMonthlyCredits,
} from '@/lib/credits/provider-credits';

/* ─── Helpers ─── */

const PROVIDER_ID = 'prov-test-001';
const QUOTE_ID = 'quote-test-001';

type InsertCall = { table: string; data: unknown };
type UpdateCall = { table: string; data: unknown; filter: { field: string; value: unknown } };

/**
 * Build a mock Supabase client with controlled data per table.
 * Tracks insert and update calls for assertions.
 */
function makeMockClient(
  tableData: Record<string, unknown>,
  opts?: { insertCalls?: InsertCall[]; updateCalls?: UpdateCall[] }
) {
  const insertCalls = opts?.insertCalls ?? [];
  const updateCalls = opts?.updateCalls ?? [];

  const makeChain = (table: string) => {
    const value = tableData[table] ?? null;
    const terminal = () => Promise.resolve({ data: value, error: null });

    let updateData: unknown = null;
    let eqField: string = '';

    const chain: Record<string, unknown> = {};
    chain.select = () => chain;
    chain.eq = (field: string, val: unknown) => {
      eqField = field;
      if (updateData !== null) {
        updateCalls.push({ table, data: updateData, filter: { field, value: val } });
      }
      return chain;
    };
    chain.maybeSingle = terminal;
    chain.insert = (data: unknown) => {
      insertCalls.push({ table, data });
      return Promise.resolve({ data: null, error: null });
    };
    chain.update = (data: unknown) => {
      updateData = data;
      return chain;
    };
    return chain;
  };

  return {
    from: (table: string) => makeChain(table),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

/* ─── 1. Exported constants ─── */

describe('MONTHLY_CREDITS_BY_PLAN', () => {
  it('basic plan grants 5 credits', () => {
    expect(MONTHLY_CREDITS_BY_PLAN.basic).toBe(5);
  });

  it('professional plan grants 25 credits', () => {
    expect(MONTHLY_CREDITS_BY_PLAN.professional).toBe(25);
  });

  it('premium plan grants 60 credits', () => {
    expect(MONTHLY_CREDITS_BY_PLAN.premium).toBe(60);
  });
});

/* ─── 2. quoteCreditCost ─── */

describe('quoteCreditCost', () => {
  it('returns 1 for a normal (non-urgent) quote', () => {
    expect(quoteCreditCost(false)).toBe(1);
  });

  it('returns 2 for an urgent quote', () => {
    expect(quoteCreditCost(true)).toBe(2);
  });
});

/* ─── 3. getCreditBalance ─── */

describe('getCreditBalance', () => {
  it('returns balance when provider_credits row exists', async () => {
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient({ provider_credits: { balance: 42 } }) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    const balance = await getCreditBalance(PROVIDER_ID);
    expect(balance).toBe(42);
  });

  it('returns 0 when no provider_credits row exists', async () => {
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient({ provider_credits: null }) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    const balance = await getCreditBalance(PROVIDER_ID);
    expect(balance).toBe(0);
  });

  it('returns 0 when data.balance is undefined', async () => {
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient({ provider_credits: {} }) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    const balance = await getCreditBalance(PROVIDER_ID);
    expect(balance).toBe(0);
  });
});

/* ─── 4. adjustCredits ─── */

describe('adjustCredits', () => {
  it('adds credits to existing balance and records transaction', async () => {
    const insertCalls: InsertCall[] = [];
    const updateCalls: UpdateCall[] = [];
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        { provider_credits: { balance: 10 } },
        { insertCalls, updateCalls }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    const result = await adjustCredits(PROVIDER_ID, 5, 'purchase', 'ref-123');
    expect(result.newBalance).toBe(15);

    // Should have updated provider_credits
    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0].table).toBe('provider_credits');

    // Should have inserted a credit_transactions record
    const txInsert = insertCalls.find((c) => c.table === 'credit_transactions');
    expect(txInsert).toBeDefined();
    expect(txInsert!.data).toEqual({
      provider_id: PROVIDER_ID,
      amount: 5,
      reason: 'purchase',
      reference_id: 'ref-123',
    });
  });

  it('creates new balance row when provider has no existing credits', async () => {
    const insertCalls: InsertCall[] = [];
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        { provider_credits: null },
        { insertCalls }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    const result = await adjustCredits(PROVIDER_ID, 10, 'monthly_grant');
    expect(result.newBalance).toBe(10);

    // Should have inserted into provider_credits (new row)
    const creditsInsert = insertCalls.find((c) => c.table === 'provider_credits');
    expect(creditsInsert).toBeDefined();
    expect(creditsInsert!.data).toEqual({
      provider_id: PROVIDER_ID,
      balance: 10,
    });
  });

  it('throws when debit would make balance negative', async () => {
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient({ provider_credits: { balance: 3 } }) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    await expect(adjustCredits(PROVIDER_ID, -5, 'quote_submitted')).rejects.toThrow(
      'Insufficient credits: balance 3, requested debit 5'
    );
  });

  it('throws on exact overspend (balance 0, debit 1)', async () => {
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient({ provider_credits: { balance: 0 } }) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    await expect(adjustCredits(PROVIDER_ID, -1, 'quote_submitted')).rejects.toThrow(
      'Insufficient credits'
    );
  });

  it('allows debit that exactly zeroes balance', async () => {
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        { provider_credits: { balance: 5 } },
        { insertCalls: [], updateCalls: [] }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    const result = await adjustCredits(PROVIDER_ID, -5, 'quote_submitted');
    expect(result.newBalance).toBe(0);
  });

  it('records null reference_id when none provided', async () => {
    const insertCalls: InsertCall[] = [];
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        { provider_credits: { balance: 10 } },
        { insertCalls }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    await adjustCredits(PROVIDER_ID, 5, 'admin_adjustment');
    const txInsert = insertCalls.find((c) => c.table === 'credit_transactions');
    expect(txInsert!.data).toMatchObject({ reference_id: null });
  });

  it('handles zero adjustment without error', async () => {
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        { provider_credits: { balance: 10 } },
        { insertCalls: [], updateCalls: [] }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    const result = await adjustCredits(PROVIDER_ID, 0, 'admin_adjustment');
    expect(result.newBalance).toBe(10);
  });
});

/* ─── 5. debitQuoteCredits ─── */

describe('debitQuoteCredits', () => {
  it('debits 1 credit for normal quote and returns success', async () => {
    const insertCalls: InsertCall[] = [];
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        { provider_credits: { balance: 10 } },
        { insertCalls }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    const result = await debitQuoteCredits(PROVIDER_ID, QUOTE_ID, false);
    expect(result.success).toBe(true);
    expect(result.cost).toBe(1);
    expect(result.newBalance).toBe(9);
  });

  it('debits 2 credits for urgent quote and returns success', async () => {
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        { provider_credits: { balance: 10 } },
        { insertCalls: [], updateCalls: [] }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    const result = await debitQuoteCredits(PROVIDER_ID, QUOTE_ID, true);
    expect(result.success).toBe(true);
    expect(result.cost).toBe(2);
    expect(result.newBalance).toBe(8);
  });

  it('returns failure when insufficient credits for normal quote', async () => {
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient({ provider_credits: { balance: 0 } }) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    const result = await debitQuoteCredits(PROVIDER_ID, QUOTE_ID, false);
    expect(result.success).toBe(false);
    expect(result.cost).toBe(1);
    expect(result.newBalance).toBe(0);
  });

  it('returns failure when insufficient credits for urgent quote (has 1, needs 2)', async () => {
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient({ provider_credits: { balance: 1 } }) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    const result = await debitQuoteCredits(PROVIDER_ID, QUOTE_ID, true);
    expect(result.success).toBe(false);
    expect(result.cost).toBe(2);
    expect(result.newBalance).toBe(1);
  });
});

/* ─── 6. refundQuoteCredits ─── */

describe('refundQuoteCredits', () => {
  it('refunds 1 credit for normal quote', async () => {
    const insertCalls: InsertCall[] = [];
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        { provider_credits: { balance: 5 } },
        { insertCalls }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    const result = await refundQuoteCredits(PROVIDER_ID, QUOTE_ID, false);
    expect(result.newBalance).toBe(6);

    const txInsert = insertCalls.find((c) => c.table === 'credit_transactions');
    expect(txInsert!.data).toMatchObject({
      amount: 1,
      reason: 'quote_refund',
      reference_id: QUOTE_ID,
    });
  });

  it('refunds 2 credits for urgent quote', async () => {
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        { provider_credits: { balance: 5 } },
        { insertCalls: [], updateCalls: [] }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    const result = await refundQuoteCredits(PROVIDER_ID, QUOTE_ID, true);
    expect(result.newBalance).toBe(7);
  });
});

/* ─── 7. grantMonthlyCredits ─── */

describe('grantMonthlyCredits', () => {
  it('grants 5 credits for basic plan', async () => {
    const insertCalls: InsertCall[] = [];
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        { provider_credits: { balance: 0 } },
        { insertCalls }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    const result = await grantMonthlyCredits(PROVIDER_ID, 'basic');
    expect(result.granted).toBe(5);
    expect(result.newBalance).toBe(5);

    const txInsert = insertCalls.find((c) => c.table === 'credit_transactions');
    expect(txInsert!.data).toMatchObject({
      amount: 5,
      reason: 'monthly_grant',
    });
  });

  it('grants 25 credits for professional plan', async () => {
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        { provider_credits: { balance: 3 } },
        { insertCalls: [], updateCalls: [] }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    const result = await grantMonthlyCredits(PROVIDER_ID, 'professional');
    expect(result.granted).toBe(25);
    expect(result.newBalance).toBe(28);
  });

  it('grants 60 credits for premium plan', async () => {
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        { provider_credits: { balance: 10 } },
        { insertCalls: [], updateCalls: [] }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    const result = await grantMonthlyCredits(PROVIDER_ID, 'premium');
    expect(result.granted).toBe(60);
    expect(result.newBalance).toBe(70);
  });

  it('stacks onto existing balance (does not reset)', async () => {
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        { provider_credits: { balance: 15 } },
        { insertCalls: [], updateCalls: [] }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    const result = await grantMonthlyCredits(PROVIDER_ID, 'basic');
    expect(result.newBalance).toBe(20); // 15 + 5
    expect(result.granted).toBe(5);
  });
});
