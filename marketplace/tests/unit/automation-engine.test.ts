import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock the Supabase service client before importing the module under test.
vi.mock('@/lib/supabase/service', () => ({
  getSupabaseServiceClient: vi.fn(),
}));

import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { fireAutomationEvent } from '@/lib/automation/engine';

/* ─── Helpers ─── */

type InsertCall = { table: string; data: unknown };
type UpdateCall = { table: string; data: unknown; filter: { field: string; value: unknown } };

/**
 * Build a mock Supabase client that returns controlled data per table.
 * The chain is thenable — `await svc.from(t).select().eq().eq()` resolves
 * to `{ data, error: null }` using the data stored for that table.
 */
function makeMockClient(
  tableData: Record<string, unknown>,
  opts?: { insertCalls?: InsertCall[]; updateCalls?: UpdateCall[] }
) {
  const insertCalls = opts?.insertCalls ?? [];
  const updateCalls = opts?.updateCalls ?? [];

  const makeChain = (table: string) => {
    const value = tableData[table] ?? null;
    const resolved = { data: value, error: null };

    let updateData: unknown = null;

    // The chain is a thenable: it has .then() so `await chain` works
    const chain: Record<string, unknown> = {};
    chain.then = (resolve: (v: unknown) => unknown) => Promise.resolve(resolved).then(resolve);
    chain.select = () => chain;
    chain.eq = (field: string, val: unknown) => {
      if (updateData !== null) {
        updateCalls.push({ table, data: updateData, filter: { field, value: val } });
        updateData = null;
      }
      return chain;
    };
    chain.maybeSingle = () => Promise.resolve(resolved);
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

/** Shorthand to build a rule row */
function makeRule(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rule-001',
    trigger_event: 'job_created',
    conditions: {},
    action_type: 'send_notification',
    action_config: {},
    enabled: true,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

/* ─── 1. Event matching and rule retrieval ─── */

describe('fireAutomationEvent — rule retrieval', () => {
  it('does nothing when no rules match the event', async () => {
    const insertCalls: InsertCall[] = [];
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        { automation_rules: [] },
        { insertCalls }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    await fireAutomationEvent('job_created', { jobId: 'j-1' });
    expect(insertCalls).toHaveLength(0);
  });

  it('does nothing when rules query returns null data', async () => {
    const insertCalls: InsertCall[] = [];
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient({ automation_rules: null }, { insertCalls }) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    await fireAutomationEvent('job_created', {});
    expect(insertCalls).toHaveLength(0);
  });

  it('does nothing when rules query returns error', async () => {
    const mock = vi.mocked(getSupabaseServiceClient);
    const errorChain: Record<string, unknown> = {};
    const errorResult = { data: null, error: new Error('db error') };
    errorChain.then = (resolve: (v: unknown) => unknown) => Promise.resolve(errorResult).then(resolve);
    errorChain.select = () => errorChain;
    errorChain.eq = () => errorChain;

    mock.mockReturnValue({
      from: () => errorChain,
    } as unknown as ReturnType<typeof getSupabaseServiceClient>);

    await expect(fireAutomationEvent('job_created', {})).resolves.toBeUndefined();
  });
});

/* ─── 2. Condition matching ─── */

describe('fireAutomationEvent — condition matching', () => {
  it('fires rule with empty conditions (always matches)', async () => {
    const insertCalls: InsertCall[] = [];
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        {
          automation_rules: [makeRule({ conditions: {}, action_config: { recipient: 'all_admins' } })],
          user_roles: [{ user_id: 'admin-1' }],
        },
        { insertCalls }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    await fireAutomationEvent('job_created', { jobId: 'j-1' });
    const notifInsert = insertCalls.find((c) => c.table === 'notifications');
    expect(notifInsert).toBeDefined();
  });

  it('fires rule when all conditions match context', async () => {
    const insertCalls: InsertCall[] = [];
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        {
          automation_rules: [
            makeRule({
              conditions: { category: 'plumbing', county: 'Dublin' },
              action_config: { recipient: 'all_admins' },
            }),
          ],
          user_roles: [{ user_id: 'admin-1' }],
        },
        { insertCalls }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    await fireAutomationEvent('job_created', { category: 'plumbing', county: 'Dublin', jobId: 'j-1' });
    const notifInsert = insertCalls.find((c) => c.table === 'notifications');
    expect(notifInsert).toBeDefined();
  });

  it('skips rule when a condition key is missing from context', async () => {
    const insertCalls: InsertCall[] = [];
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        {
          automation_rules: [
            makeRule({ conditions: { category: 'plumbing' }, action_config: { recipient: 'all_admins' } }),
          ],
          user_roles: [],
        },
        { insertCalls }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    await fireAutomationEvent('job_created', { jobId: 'j-1' });
    const notifInsert = insertCalls.find((c) => c.table === 'notifications');
    expect(notifInsert).toBeUndefined();
  });

  it('skips rule when a condition value does not match', async () => {
    const insertCalls: InsertCall[] = [];
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        {
          automation_rules: [
            makeRule({ conditions: { category: 'plumbing' }, action_config: { recipient: 'all_admins' } }),
          ],
          user_roles: [],
        },
        { insertCalls }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    await fireAutomationEvent('job_created', { category: 'electrical', jobId: 'j-1' });
    const notifInsert = insertCalls.find((c) => c.table === 'notifications');
    expect(notifInsert).toBeUndefined();
  });

  it('matches when context value is number and condition is string equivalent', async () => {
    const insertCalls: InsertCall[] = [];
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        {
          automation_rules: [
            makeRule({ conditions: { priority: '3' }, action_config: { recipient: 'all_admins' } }),
          ],
          user_roles: [{ user_id: 'admin-1' }],
        },
        { insertCalls }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    await fireAutomationEvent('job_created', { priority: 3 });
    const notifInsert = insertCalls.find((c) => c.table === 'notifications');
    expect(notifInsert).toBeDefined();
  });

  it('skips when context value is null for a required condition', async () => {
    const insertCalls: InsertCall[] = [];
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        {
          automation_rules: [
            makeRule({ conditions: { category: 'plumbing' }, action_config: { recipient: 'all_admins' } }),
          ],
          user_roles: [],
        },
        { insertCalls }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    await fireAutomationEvent('job_created', { category: null });
    const notifInsert = insertCalls.find((c) => c.table === 'notifications');
    expect(notifInsert).toBeUndefined();
  });

  it('fires rule with null conditions (treated as empty)', async () => {
    const insertCalls: InsertCall[] = [];
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        {
          automation_rules: [makeRule({ conditions: null, action_config: { recipient: 'all_admins' } })],
          user_roles: [{ user_id: 'admin-1' }],
        },
        { insertCalls }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    await fireAutomationEvent('job_created', {});
    const notifInsert = insertCalls.find((c) => c.table === 'notifications');
    expect(notifInsert).toBeDefined();
  });
});

/* ─── 3. send_notification action ─── */

describe('fireAutomationEvent — send_notification', () => {
  it('sends notification to all admins when recipient is all_admins', async () => {
    const insertCalls: InsertCall[] = [];
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        {
          automation_rules: [
            makeRule({ action_config: { recipient: 'all_admins', message: 'New job posted' } }),
          ],
          user_roles: [{ user_id: 'admin-1' }, { user_id: 'admin-2' }],
        },
        { insertCalls }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    await fireAutomationEvent('job_created', { jobId: 'j-1' });
    const notifInsert = insertCalls.find((c) => c.table === 'notifications');
    expect(notifInsert).toBeDefined();
    expect(Array.isArray(notifInsert!.data)).toBe(true);
    expect((notifInsert!.data as unknown[]).length).toBe(2);
  });

  it('does not insert notifications when no admins exist', async () => {
    const insertCalls: InsertCall[] = [];
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        {
          automation_rules: [
            makeRule({ action_config: { recipient: 'all_admins' } }),
          ],
          user_roles: [],
        },
        { insertCalls }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    await fireAutomationEvent('job_created', { jobId: 'j-1' });
    const notifInsert = insertCalls.find((c) => c.table === 'notifications');
    expect(notifInsert).toBeUndefined();
  });

  it('sends notification to customer when recipient is customer', async () => {
    const insertCalls: InsertCall[] = [];
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        {
          automation_rules: [
            makeRule({
              action_config: { recipient: 'customer', message: 'Quote received' },
              trigger_event: 'quote_received',
            }),
          ],
        },
        { insertCalls }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    await fireAutomationEvent('quote_received', { customerId: 'cust-1', jobId: 'j-1' });
    const notifInsert = insertCalls.find((c) => c.table === 'notifications');
    expect(notifInsert).toBeDefined();
    expect((notifInsert!.data as Record<string, unknown>).user_id).toBe('cust-1');
  });

  it('sends notification to provider when recipient is provider', async () => {
    const insertCalls: InsertCall[] = [];
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        {
          automation_rules: [
            makeRule({
              action_config: { recipient: 'provider', message: 'Document verified' },
              trigger_event: 'document_verified',
            }),
          ],
        },
        { insertCalls }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    await fireAutomationEvent('document_verified', { profileId: 'prof-1' });
    const notifInsert = insertCalls.find((c) => c.table === 'notifications');
    expect(notifInsert).toBeDefined();
    expect((notifInsert!.data as Record<string, unknown>).user_id).toBe('prof-1');
  });

  it('sends notification to pro when recipient is pro', async () => {
    const insertCalls: InsertCall[] = [];
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        {
          automation_rules: [
            makeRule({
              action_config: { recipient: 'pro', message: 'You are approved' },
              trigger_event: 'provider_approved',
            }),
          ],
        },
        { insertCalls }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    await fireAutomationEvent('provider_approved', { proId: 'pro-1' });
    const notifInsert = insertCalls.find((c) => c.table === 'notifications');
    expect(notifInsert).toBeDefined();
    expect((notifInsert!.data as Record<string, unknown>).user_id).toBe('pro-1');
  });

  it('uses default recipient and message when action_config is empty', async () => {
    const insertCalls: InsertCall[] = [];
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        {
          automation_rules: [makeRule({ action_config: {} })],
          user_roles: [{ user_id: 'admin-1' }],
        },
        { insertCalls }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    await fireAutomationEvent('job_created', {});
    const notifInsert = insertCalls.find((c) => c.table === 'notifications');
    expect(notifInsert).toBeDefined();
    const payload = ((notifInsert!.data as unknown[])[0] as Record<string, unknown>).payload as Record<string, unknown>;
    expect(payload.message).toContain('Automation rule fired');
  });

  it('does not send customer notification when customerId is missing from context', async () => {
    const insertCalls: InsertCall[] = [];
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        {
          automation_rules: [
            makeRule({ action_config: { recipient: 'customer' } }),
          ],
        },
        { insertCalls }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    await fireAutomationEvent('job_created', { jobId: 'j-1' });
    const notifInsert = insertCalls.find((c) => c.table === 'notifications');
    expect(notifInsert).toBeUndefined();
  });

  it('includes rule_id and trigger in notification payload', async () => {
    const insertCalls: InsertCall[] = [];
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        {
          automation_rules: [
            makeRule({
              id: 'rule-xyz',
              action_config: { recipient: 'all_admins', message: 'Test msg' },
            }),
          ],
          user_roles: [{ user_id: 'admin-1' }],
        },
        { insertCalls }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    await fireAutomationEvent('job_created', { jobId: 'j-1' });
    const notifInsert = insertCalls.find((c) => c.table === 'notifications');
    expect(notifInsert).toBeDefined();
    const entry = (notifInsert!.data as unknown[])[0] as Record<string, unknown>;
    const payload = entry.payload as Record<string, unknown>;
    expect(payload.rule_id).toBe('rule-xyz');
    expect(payload.trigger).toBe('job_created');
    expect(payload.fired_at).toBeDefined();
  });
});

/* ─── 4. change_status action ─── */

describe('fireAutomationEvent — change_status', () => {
  it('updates status on jobs table', async () => {
    const updateCalls: UpdateCall[] = [];
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        {
          automation_rules: [
            makeRule({
              action_type: 'change_status',
              action_config: {
                table: 'jobs',
                id_field: 'id',
                id_value: 'j-1',
                status_field: 'status',
                status_value: 'cancelled',
              },
              trigger_event: 'job_inactive',
            }),
          ],
        },
        { updateCalls }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    await fireAutomationEvent('job_inactive', { jobId: 'j-1' });
    const jobUpdate = updateCalls.find((c) => c.table === 'jobs');
    expect(jobUpdate).toBeDefined();
    expect(jobUpdate!.data).toEqual({ status: 'cancelled' });
  });

  it('updates status on profiles table', async () => {
    const updateCalls: UpdateCall[] = [];
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        {
          automation_rules: [
            makeRule({
              action_type: 'change_status',
              action_config: {
                table: 'profiles',
                id_value: 'prof-1',
                status_value: 'active',
              },
              trigger_event: 'provider_approved',
            }),
          ],
        },
        { updateCalls }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    await fireAutomationEvent('provider_approved', { profileId: 'prof-1' });
    const profileUpdate = updateCalls.find((c) => c.table === 'profiles');
    expect(profileUpdate).toBeDefined();
    expect(profileUpdate!.data).toEqual({ status: 'active' });
  });

  it('does not update disallowed tables', async () => {
    const updateCalls: UpdateCall[] = [];
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        {
          automation_rules: [
            makeRule({
              action_type: 'change_status',
              action_config: {
                table: 'users',
                id_value: 'u-1',
                status_value: 'banned',
              },
            }),
          ],
        },
        { updateCalls }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    await fireAutomationEvent('job_created', { jobId: 'j-1' });
    expect(updateCalls).toHaveLength(0);
  });

  it('does not update when table is missing from config', async () => {
    const updateCalls: UpdateCall[] = [];
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        {
          automation_rules: [
            makeRule({
              action_type: 'change_status',
              action_config: { status_value: 'cancelled' },
            }),
          ],
        },
        { updateCalls }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    await fireAutomationEvent('job_created', { jobId: 'j-1' });
    expect(updateCalls).toHaveLength(0);
  });

  it('falls back to context jobId when id_value is not in config', async () => {
    const updateCalls: UpdateCall[] = [];
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        {
          automation_rules: [
            makeRule({
              action_type: 'change_status',
              action_config: {
                table: 'jobs',
                status_value: 'expired',
              },
              trigger_event: 'job_inactive',
            }),
          ],
        },
        { updateCalls }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    await fireAutomationEvent('job_inactive', { jobId: 'j-99' });
    const jobUpdate = updateCalls.find((c) => c.table === 'jobs');
    expect(jobUpdate).toBeDefined();
    expect(jobUpdate!.filter.value).toBe('j-99');
  });

  it('does not update when status_value is missing', async () => {
    const updateCalls: UpdateCall[] = [];
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        {
          automation_rules: [
            makeRule({
              action_type: 'change_status',
              action_config: { table: 'jobs', id_value: 'j-1' },
            }),
          ],
        },
        { updateCalls }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    await fireAutomationEvent('job_created', { jobId: 'j-1' });
    expect(updateCalls).toHaveLength(0);
  });
});

/* ─── 5. create_task action ─── */

describe('fireAutomationEvent — create_task', () => {
  it('inserts a task into job_todos', async () => {
    const insertCalls: InsertCall[] = [];
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        {
          automation_rules: [
            makeRule({
              action_type: 'create_task',
              action_config: {
                job_id: 'j-1',
                description: 'Follow up with customer',
              },
            }),
          ],
        },
        { insertCalls }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    await fireAutomationEvent('job_created', { jobId: 'j-1' });
    const todoInsert = insertCalls.find((c) => c.table === 'job_todos');
    expect(todoInsert).toBeDefined();
    expect(todoInsert!.data).toEqual({
      job_id: 'j-1',
      description: 'Follow up with customer',
      created_by: null,
    });
  });

  it('uses context jobId when job_id is not in config', async () => {
    const insertCalls: InsertCall[] = [];
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        {
          automation_rules: [
            makeRule({
              action_type: 'create_task',
              action_config: { description: 'Review job' },
            }),
          ],
        },
        { insertCalls }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    await fireAutomationEvent('job_created', { jobId: 'j-42' });
    const todoInsert = insertCalls.find((c) => c.table === 'job_todos');
    expect(todoInsert).toBeDefined();
    expect((todoInsert!.data as Record<string, unknown>).job_id).toBe('j-42');
  });

  it('uses default description when not in config', async () => {
    const insertCalls: InsertCall[] = [];
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        {
          automation_rules: [
            makeRule({
              action_type: 'create_task',
              action_config: { job_id: 'j-1' },
              trigger_event: 'document_verified',
            }),
          ],
        },
        { insertCalls }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    await fireAutomationEvent('document_verified', {});
    const todoInsert = insertCalls.find((c) => c.table === 'job_todos');
    expect(todoInsert).toBeDefined();
    expect((todoInsert!.data as Record<string, unknown>).description).toContain('Automated task');
  });

  it('sets created_by to null (system-created)', async () => {
    const insertCalls: InsertCall[] = [];
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        {
          automation_rules: [
            makeRule({
              action_type: 'create_task',
              action_config: { job_id: 'j-1', description: 'Task' },
            }),
          ],
        },
        { insertCalls }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    await fireAutomationEvent('job_created', {});
    const todoInsert = insertCalls.find((c) => c.table === 'job_todos');
    expect(todoInsert).toBeDefined();
    expect((todoInsert!.data as Record<string, unknown>).created_by).toBeNull();
  });
});

/* ─── 6. Error handling ─── */

describe('fireAutomationEvent — error handling', () => {
  it('never throws — catches internal errors silently', async () => {
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockImplementation(() => {
      throw new Error('Connection failed');
    });

    await expect(fireAutomationEvent('job_created', {})).resolves.toBeUndefined();
  });

  it('processes multiple rules and continues if one has no matching context', async () => {
    const insertCalls: InsertCall[] = [];
    const mock = vi.mocked(getSupabaseServiceClient);
    mock.mockReturnValue(
      makeMockClient(
        {
          automation_rules: [
            makeRule({
              id: 'rule-1',
              conditions: { category: 'plumbing' },
              action_config: { recipient: 'all_admins' },
            }),
            makeRule({
              id: 'rule-2',
              conditions: {},
              action_type: 'create_task',
              action_config: { job_id: 'j-1', description: 'Always runs' },
            }),
          ],
          user_roles: [],
        },
        { insertCalls }
      ) as unknown as ReturnType<typeof getSupabaseServiceClient>
    );

    // rule-1 won't match (no category in context), rule-2 should still fire
    await fireAutomationEvent('job_created', { jobId: 'j-1' });
    const todoInsert = insertCalls.find((c) => c.table === 'job_todos');
    expect(todoInsert).toBeDefined();
    const notifInsert = insertCalls.find((c) => c.table === 'notifications');
    expect(notifInsert).toBeUndefined();
  });
});
