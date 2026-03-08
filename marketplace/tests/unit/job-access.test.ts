import { describe, expect, it, vi } from 'vitest';
import { resolveJobAccessContext } from '@/lib/jobs/access';

// ---------------------------------------------------------------------------
// Mock RBAC helper — getUserRoles is the only external dep of resolveJobAccessContext
// ---------------------------------------------------------------------------
vi.mock('@/lib/auth/rbac', () => ({
  getUserRoles: vi.fn(),
}));

import { getUserRoles } from '@/lib/auth/rbac';

// ---------------------------------------------------------------------------
// Supabase mock builder
// Each call chain ends at .maybeSingle() → returns the fixture for that table.
// ---------------------------------------------------------------------------
function makeMockSupabase(
  jobRow: Record<string, unknown> | null,
  quoteRow: Record<string, unknown> | null = null
) {
  return {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: table === 'jobs' ? jobRow : quoteRow,
              error: null,
            }),
        }),
      }),
    }),
  } as unknown as Parameters<typeof resolveJobAccessContext>[0];
}

const JOB_ID = 'job-1111-1111-1111-111111111111';
const CUSTOMER_ID = 'cust-1111-1111-1111-111111111111';
const PRO_ID = 'pro-11111-1111-1111-111111111111';
const QUOTE_ID = 'quot-1111-1111-1111-111111111111';

describe('resolveJobAccessContext — job not found', () => {
  it('returns exists:false when job row is null', async () => {
    vi.mocked(getUserRoles).mockResolvedValue([]);
    const ctx = await resolveJobAccessContext(makeMockSupabase(null), JOB_ID, CUSTOMER_ID);

    expect(ctx.exists).toBe(false);
    expect(ctx.isCustomer).toBe(false);
    expect(ctx.isProvider).toBe(false);
    expect(ctx.isAdmin).toBe(false);
    expect(ctx.customerId).toBeNull();
    expect(ctx.providerId).toBeNull();
  });
});

describe('resolveJobAccessContext — customer access', () => {
  const jobRow = { id: JOB_ID, customer_id: CUSTOMER_ID, accepted_quote_id: null };

  it('recognises the job owner as customer', async () => {
    vi.mocked(getUserRoles).mockResolvedValue(['customer']);
    const ctx = await resolveJobAccessContext(makeMockSupabase(jobRow), JOB_ID, CUSTOMER_ID);

    expect(ctx.exists).toBe(true);
    expect(ctx.isCustomer).toBe(true);
    expect(ctx.isProvider).toBe(false);
    expect(ctx.isAdmin).toBe(false);
    expect(ctx.customerId).toBe(CUSTOMER_ID);
  });

  it('returns isCustomer:false for a different user', async () => {
    vi.mocked(getUserRoles).mockResolvedValue(['customer']);
    const ctx = await resolveJobAccessContext(makeMockSupabase(jobRow), JOB_ID, 'other-user');

    expect(ctx.isCustomer).toBe(false);
  });
});

describe('resolveJobAccessContext — provider access', () => {
  const jobRow = {
    id: JOB_ID,
    customer_id: CUSTOMER_ID,
    accepted_quote_id: QUOTE_ID,
  };
  const quoteRow = { pro_id: PRO_ID };

  it('resolves providerId from the accepted quote and marks isProvider', async () => {
    vi.mocked(getUserRoles).mockResolvedValue(['verified_pro']);
    const ctx = await resolveJobAccessContext(
      makeMockSupabase(jobRow, quoteRow),
      JOB_ID,
      PRO_ID
    );

    expect(ctx.exists).toBe(true);
    expect(ctx.isProvider).toBe(true);
    expect(ctx.isCustomer).toBe(false);
    expect(ctx.providerId).toBe(PRO_ID);
  });

  it('returns isProvider:false for a non-accepted pro', async () => {
    vi.mocked(getUserRoles).mockResolvedValue(['verified_pro']);
    const ctx = await resolveJobAccessContext(
      makeMockSupabase(jobRow, quoteRow),
      JOB_ID,
      'other-pro'
    );

    expect(ctx.isProvider).toBe(false);
  });
});

describe('resolveJobAccessContext — admin access', () => {
  const jobRow = { id: JOB_ID, customer_id: CUSTOMER_ID, accepted_quote_id: null };

  it('marks isAdmin for a user with admin role', async () => {
    vi.mocked(getUserRoles).mockResolvedValue(['admin']);
    const ctx = await resolveJobAccessContext(
      makeMockSupabase(jobRow),
      JOB_ID,
      'admin-user-id'
    );

    expect(ctx.isAdmin).toBe(true);
    expect(ctx.isCustomer).toBe(false);
    expect(ctx.isProvider).toBe(false);
  });
});

describe('resolveJobAccessContext — no accepted quote', () => {
  const jobRow = { id: JOB_ID, customer_id: CUSTOMER_ID, accepted_quote_id: null };

  it('sets providerId to null when there is no accepted quote', async () => {
    vi.mocked(getUserRoles).mockResolvedValue([]);
    const ctx = await resolveJobAccessContext(makeMockSupabase(jobRow), JOB_ID, CUSTOMER_ID);

    expect(ctx.providerId).toBeNull();
    expect(ctx.isProvider).toBe(false);
  });
});
