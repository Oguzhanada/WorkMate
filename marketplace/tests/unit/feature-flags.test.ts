import { describe, expect, it, vi, beforeEach } from 'vitest';
import { isFeatureEnabled } from '@/lib/flags/feature-flags';

// ---------------------------------------------------------------------------
// Mock the Supabase service client — tests control returned flag data.
// ---------------------------------------------------------------------------
vi.mock('@/lib/supabase/service', () => ({
  getSupabaseServiceClient: vi.fn(),
}));

import { getSupabaseServiceClient } from '@/lib/supabase/service';

// Build a minimal mock that returns a controlled flag row from feature_flags.
function makeMockClient(flagRow: Record<string, unknown> | null) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: flagRow, error: null }),
        }),
      }),
    }),
  } as unknown as ReturnType<typeof getSupabaseServiceClient>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Flag not found ───────────────────────────────────────────────────────────

describe('isFeatureEnabled — flag not found', () => {
  it('returns false when flag does not exist in the table', async () => {
    vi.mocked(getSupabaseServiceClient).mockReturnValue(makeMockClient(null));
    const result = await isFeatureEnabled('nonexistent_flag');
    expect(result).toBe(false);
  });
});

// ─── Globally enabled flag ────────────────────────────────────────────────────

describe('isFeatureEnabled — globally enabled', () => {
  it('returns true when enabled=true regardless of user or roles', async () => {
    vi.mocked(getSupabaseServiceClient).mockReturnValue(
      makeMockClient({ enabled: true, enabled_for_roles: [], enabled_for_ids: [] })
    );
    expect(await isFeatureEnabled('ai_job_description')).toBe(true);
  });

  it('returns true even when no userId or roles are passed', async () => {
    vi.mocked(getSupabaseServiceClient).mockReturnValue(
      makeMockClient({ enabled: true, enabled_for_roles: [], enabled_for_ids: [] })
    );
    expect(await isFeatureEnabled('ai_job_description', undefined, undefined)).toBe(true);
  });
});

// ─── Disabled globally but enabled for specific users ─────────────────────────

describe('isFeatureEnabled — enabled_for_ids', () => {
  const flagRow = {
    enabled: false,
    enabled_for_roles: [],
    enabled_for_ids: ['user-abc-123'],
  };

  it('returns true for a user listed in enabled_for_ids', async () => {
    vi.mocked(getSupabaseServiceClient).mockReturnValue(makeMockClient(flagRow));
    expect(await isFeatureEnabled('beta_feature', 'user-abc-123')).toBe(true);
  });

  it('returns false for a user NOT in enabled_for_ids', async () => {
    vi.mocked(getSupabaseServiceClient).mockReturnValue(makeMockClient(flagRow));
    expect(await isFeatureEnabled('beta_feature', 'user-xyz-999')).toBe(false);
  });

  it('returns false when no userId is passed at all', async () => {
    vi.mocked(getSupabaseServiceClient).mockReturnValue(makeMockClient(flagRow));
    expect(await isFeatureEnabled('beta_feature')).toBe(false);
  });
});

// ─── Disabled globally but enabled for specific roles ─────────────────────────

describe('isFeatureEnabled — enabled_for_roles', () => {
  const flagRow = {
    enabled: false,
    enabled_for_roles: ['admin'],
    enabled_for_ids: [],
  };

  it('returns true when user has a matching role', async () => {
    vi.mocked(getSupabaseServiceClient).mockReturnValue(makeMockClient(flagRow));
    expect(await isFeatureEnabled('admin_only_feature', undefined, ['admin'])).toBe(true);
  });

  it('returns true when user has one of several matching roles', async () => {
    vi.mocked(getSupabaseServiceClient).mockReturnValue(
      makeMockClient({ enabled: false, enabled_for_roles: ['admin', 'verified_pro'], enabled_for_ids: [] })
    );
    expect(await isFeatureEnabled('pro_feature', undefined, ['verified_pro'])).toBe(true);
  });

  it('returns false when user role does not match', async () => {
    vi.mocked(getSupabaseServiceClient).mockReturnValue(makeMockClient(flagRow));
    expect(await isFeatureEnabled('admin_only_feature', undefined, ['customer'])).toBe(false);
  });

  it('returns false when no roles are passed', async () => {
    vi.mocked(getSupabaseServiceClient).mockReturnValue(makeMockClient(flagRow));
    expect(await isFeatureEnabled('admin_only_feature')).toBe(false);
  });
});

// ─── Fully disabled flag ──────────────────────────────────────────────────────

describe('isFeatureEnabled — fully disabled', () => {
  const flagRow = {
    enabled: false,
    enabled_for_roles: [],
    enabled_for_ids: [],
  };

  it('returns false for any user/role combination when flag is fully disabled', async () => {
    vi.mocked(getSupabaseServiceClient).mockReturnValue(makeMockClient(flagRow));
    expect(await isFeatureEnabled('disabled_feature', 'any-user', ['admin'])).toBe(false);
  });
});
