import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockConstructEvent = vi.fn();
const mockServiceFrom = vi.fn();
const mockSendWebhookEvent = vi.fn();
const mockSendTransactionalEmail = vi.fn();
const mockUpdateCustomerProviderHistory = vi.fn();
const mockSendNotification = vi.fn();
const mockPaymentsSelect = vi.fn();
const mockPaymentsUpdate = vi.fn();
const mockWebhookInsert = vi.fn();
const mockWebhookUpdate = vi.fn();
const mockNotificationsInsert = vi.fn();
const mockJobsUpdate = vi.fn();
const mockJobsSelect = vi.fn();
const mockQuotesSelect = vi.fn();
const mockProfilesSelect = vi.fn();
const mockUserRolesSelect = vi.fn();

vi.mock('@/lib/stripe/client', () => ({
  stripe: {
    webhooks: {
      constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
    },
  },
}));

vi.mock('@/lib/supabase/service', () => ({
  getSupabaseServiceClient: vi.fn(() => ({
    from: (...args: unknown[]) => mockServiceFrom(...args),
  })),
}));

vi.mock('@/lib/webhook/send', () => ({
  sendWebhookEvent: (...args: unknown[]) => mockSendWebhookEvent(...args),
}));

vi.mock('@/lib/email/send', () => ({
  sendTransactionalEmail: (...args: unknown[]) => mockSendTransactionalEmail(...args),
}));

vi.mock('@/lib/pricing/fee-calculator', () => ({
  updateCustomerProviderHistory: (...args: unknown[]) => mockUpdateCustomerProviderHistory(...args),
}));

vi.mock('@/lib/notifications/send', () => ({
  sendNotification: (...args: unknown[]) => mockSendNotification(...args),
}));

vi.mock('@/lib/validation/api', () => ({
  stripeSubscriptionObjectSchema: {
    safeParse: vi.fn((data: unknown) => ({ success: true, data })),
  },
}));

vi.mock('@/lib/api/error-response', async () => {
  const { NextResponse } = await import('next/server');
  return {
    apiError: (msg: string, status: number) => NextResponse.json({ error: msg }, { status }),
  };
});

import { POST } from '@/app/api/webhooks/stripe/route';

function makeRequest(body: string, signature = 'sig_test'): NextRequest {
  return new NextRequest('http://localhost:3000/api/webhooks/stripe', {
    method: 'POST',
    headers: signature ? { 'Content-Type': 'application/json', 'stripe-signature': signature } : { 'Content-Type': 'application/json' },
    body,
  });
}

function setupSupabase() {
  mockServiceFrom.mockImplementation((table: string) => {
    if (table === 'webhook_events') {
      return {
        insert: (...args: unknown[]) => mockWebhookInsert(...args),
        update: (...args: unknown[]) => ({
          eq: (...eqArgs: unknown[]) => mockWebhookUpdate(...args, ...eqArgs),
        }),
      };
    }

    if (table === 'payments') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () => mockPaymentsSelect(),
          }),
        }),
        update: (...args: unknown[]) => ({
          eq: (...eqArgs: unknown[]) => mockPaymentsUpdate(...args, ...eqArgs),
        }),
      };
    }

    if (table === 'notifications') {
      return {
        insert: (...args: unknown[]) => mockNotificationsInsert(...args),
      };
    }

    if (table === 'jobs') {
      return {
        update: (...args: unknown[]) => ({
          eq: (...eqArgs: unknown[]) => mockJobsUpdate(...args, ...eqArgs),
        }),
        select: () => ({
          eq: () => ({
            maybeSingle: () => mockJobsSelect(),
          }),
        }),
      };
    }

    if (table === 'quotes') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () => mockQuotesSelect(),
          }),
        }),
      };
    }

    if (table === 'profiles') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () => mockProfilesSelect(),
          }),
        }),
        update: (...args: unknown[]) => ({
          eq: (...eqArgs: unknown[]) => Promise.resolve({ data: null, error: null }),
        }),
      };
    }

    if (table === 'user_roles') {
      return {
        select: () => ({
          eq: () => ({
            then: (resolve: (value: { data: unknown; error: null }) => unknown) =>
              Promise.resolve({ data: mockUserRolesSelect(), error: null }).then(resolve),
          }),
        }),
      };
    }

    if (table === 'provider_subscriptions') {
      return {
        update: (...args: unknown[]) => ({
          eq: (...eqArgs: unknown[]) => Promise.resolve({ data: null, error: null }),
        }),
        upsert: (...args: unknown[]) => Promise.resolve({ data: null, error: null }),
      };
    }

    return {
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    };
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  setupSupabase();
  mockWebhookInsert.mockResolvedValue({ error: null });
  mockWebhookUpdate.mockResolvedValue({ error: null });
  mockPaymentsSelect.mockResolvedValue({ data: null, error: null });
  mockPaymentsUpdate.mockResolvedValue({ error: null });
  mockNotificationsInsert.mockResolvedValue({ error: null });
  mockJobsUpdate.mockResolvedValue({ error: null });
  mockJobsSelect.mockResolvedValue({ data: null, error: null });
  mockQuotesSelect.mockResolvedValue({ data: null, error: null });
  mockProfilesSelect.mockResolvedValue({ data: null, error: null });
  mockUserRolesSelect.mockReturnValue([]);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  delete process.env.STRIPE_WEBHOOK_SECRET;
  vi.restoreAllMocks();
});

describe('POST /api/webhooks/stripe', () => {
  it('returns 400 when signature or secret is missing', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const res = await POST(makeRequest('{}', ''));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Missing webhook signature or secret');
  });

  it('returns 400 when signature verification fails', async () => {
    mockConstructEvent.mockImplementationOnce(() => {
      throw new Error('invalid signature');
    });

    const res = await POST(makeRequest('{"id":"evt_1"}'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('signature verification failed');
  });

  it('acknowledges duplicate events without reprocessing', async () => {
    mockConstructEvent.mockReturnValueOnce({
      id: 'evt_dup',
      type: 'invoice.paid',
      data: { object: { id: 'in_1', metadata: {}, amount_paid: 0 } },
    });
    mockWebhookInsert.mockResolvedValueOnce({
      error: { code: '23505', message: 'duplicate key value violates unique constraint' },
    });

    const res = await POST(makeRequest('{"id":"evt_dup"}'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ received: true, duplicate: true });
    expect(mockSendWebhookEvent).not.toHaveBeenCalled();
  });

  it('marks payment as cancelled on payment_intent.payment_failed', async () => {
    mockConstructEvent.mockReturnValueOnce({
      id: 'evt_failed',
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: 'pi_failed',
          last_payment_error: { message: 'Card declined' },
        },
      },
    });
    mockPaymentsSelect.mockResolvedValueOnce({
      data: { id: 'payment-1', job_id: 'job-1', customer_id: 'customer-1' },
      error: null,
    });

    const res = await POST(makeRequest('{"id":"evt_failed"}'));

    expect(res.status).toBe(200);
    expect(mockPaymentsUpdate).toHaveBeenCalledWith({ status: 'cancelled' }, 'id', 'payment-1');
    expect(mockNotificationsInsert).toHaveBeenCalledWith({
      user_id: 'customer-1',
      type: 'payment_failed',
      payload: expect.objectContaining({
        job_id: 'job-1',
        payment_intent_id: 'pi_failed',
        reason: 'Card declined',
      }),
    });
  });

  it('processes invoice.paid and emits payment.completed webhook', async () => {
    mockConstructEvent.mockReturnValueOnce({
      id: 'evt_invoice_paid',
      type: 'invoice.paid',
      data: {
        object: {
          id: 'in_123',
          metadata: {
            workmate_job_id: 'job-1',
            workmate_customer_id: 'customer-1',
          },
          amount_paid: 7500,
          lines: { data: [] },
          parent: null,
        },
      },
    });
    mockJobsSelect.mockResolvedValue({ data: null, error: null });

    const res = await POST(makeRequest('{"id":"evt_invoice_paid"}'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ received: true });
    expect(mockJobsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ payment_released_at: expect.any(String) }),
      'id',
      'job-1'
    );
    expect(mockNotificationsInsert).toHaveBeenCalledWith({
      user_id: 'customer-1',
      type: 'invoice_paid',
      payload: {
        job_id: 'job-1',
        stripe_invoice_id: 'in_123',
        amount_paid_cents: 7500,
      },
    });
    expect(mockSendWebhookEvent).toHaveBeenCalledWith(
      'payment.completed',
      expect.objectContaining({
        stripe_invoice_id: 'in_123',
        job_id: 'job-1',
        customer_id: 'customer-1',
        amount_paid_cents: 7500,
      })
    );
  });
});
