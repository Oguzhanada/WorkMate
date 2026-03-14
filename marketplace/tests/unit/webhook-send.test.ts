import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHmac } from 'crypto';

// ── Mocks ───────────────────────────────────────────────────────────────────

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockContains = vi.fn();
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock('@/lib/supabase/service', () => ({
  getSupabaseServiceClient: vi.fn(() => ({ from: mockFrom })),
}));

// Mock structured logger — code uses logWebhookDelivery instead of console.warn
const mockLogWebhookDelivery = vi.fn();
vi.mock('@/lib/logger', () => ({
  logWebhookDelivery: (...args: unknown[]) => mockLogWebhookDelivery(...args),
}));

// Mock decrypt for encrypted_secret support
vi.mock('@/lib/crypto/encrypt', () => ({
  decrypt: (val: string) => val,
  isEncrypted: () => false,
}));

// ── Helpers ─────────────────────────────────────────────────────────────────

function setupSupabaseChain(result: { data: unknown; error: unknown }) {
  mockFrom.mockReturnValue({ select: mockSelect });
  mockSelect.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ contains: mockContains });
  mockContains.mockResolvedValue(result);
}

function okResponse() {
  return { ok: true, status: 200 } as Response;
}

function errorResponse(status: number) {
  return { ok: false, status } as Response;
}

const FIXED_TIMESTAMP = 1_700_000_000_000; // epoch ms
const FIXED_TIMESTAMP_SECS = '1700000000';
const FIXED_UUID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

// ── Suite ───────────────────────────────────────────────────────────────────

describe('webhook/send — sendWebhookEvent', () => {
  let sendWebhookEvent: typeof import('@/lib/webhook/send').sendWebhookEvent;

  beforeEach(async () => {
    vi.useFakeTimers({ now: FIXED_TIMESTAMP });
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('crypto', { randomUUID: () => FIXED_UUID });
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Re-import to pick up fresh mocks
    const mod = await import('@/lib/webhook/send');
    sendWebhookEvent = mod.sendWebhookEvent;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  // ── 1. HMAC signature ──────────────────────────────────────────────────

  it('sends correct HMAC sha256 signature in X-WorkMate-Signature header', async () => {
    const secret = 'webhook-test-secret';
    const event = 'job.created';
    const payload = { jobId: '123' };

    setupSupabaseChain({
      data: [{ id: '1', url: 'https://example.com/hook', encrypted_secret: secret }],
      error: null,
    });

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(okResponse());

    const promise = sendWebhookEvent(event, payload);
    await vi.runAllTimersAsync();
    await promise;

    expect(fetch).toHaveBeenCalledTimes(1);
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const headers = init.headers as Record<string, string>;

    // Reproduce the expected signature
    const body = JSON.stringify({ event, data: payload, timestamp: Number(FIXED_TIMESTAMP_SECS) });
    const expectedSig = createHmac('sha256', secret)
      .update(`${FIXED_TIMESTAMP_SECS}.${body}`)
      .digest('hex');

    expect(headers['X-WorkMate-Signature']).toBe(`sha256=${expectedSig}`);
  });

  // ── 2. HTTPS enforcement ──────────────────────────────────────────────

  it('skips non-HTTPS URLs and does not call fetch', async () => {
    setupSupabaseChain({
      data: [{ id: '1', url: 'http://insecure.example.com/hook', encrypted_secret: 's' }],
      error: null,
    });

    const promise = sendWebhookEvent('job.created', { jobId: '1' });
    await vi.runAllTimersAsync();
    await promise;

    expect(fetch).not.toHaveBeenCalled();
    expect(mockLogWebhookDelivery).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, url: 'http://insecure.example.com/hook' })
    );
  });

  // ── 3. Retry on 500 ──────────────────────────────────────────────────

  it('retries up to 3 times on 500 errors', async () => {
    setupSupabaseChain({
      data: [{ id: '1', url: 'https://example.com/hook', encrypted_secret: 's' }],
      error: null,
    });

    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(errorResponse(500))
      .mockResolvedValueOnce(errorResponse(502))
      .mockResolvedValueOnce(errorResponse(503));

    const promise = sendWebhookEvent('job.created', { jobId: '1' });
    await vi.runAllTimersAsync();
    await promise;

    expect(fetch).toHaveBeenCalledTimes(3);
    expect(mockLogWebhookDelivery).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });

  // ── 4. No retry on 4xx (non-429) ─────────────────────────────────────

  it('does not retry on 4xx errors (except 429)', async () => {
    setupSupabaseChain({
      data: [{ id: '1', url: 'https://example.com/hook', encrypted_secret: 's' }],
      error: null,
    });

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(errorResponse(403));

    const promise = sendWebhookEvent('job.created', { jobId: '1' });
    await vi.runAllTimersAsync();
    await promise;

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(mockLogWebhookDelivery).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, statusCode: 403 })
    );
  });

  // ── 5. 429 triggers retry ────────────────────────────────────────────

  it('retries on 429 status', async () => {
    setupSupabaseChain({
      data: [{ id: '1', url: 'https://example.com/hook', encrypted_secret: 's' }],
      error: null,
    });

    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(errorResponse(429))
      .mockResolvedValueOnce(okResponse());

    const promise = sendWebhookEvent('job.created', { jobId: '1' });
    await vi.runAllTimersAsync();
    await promise;

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  // ── 6. Network error retry ──────────────────────────────────────────

  it('retries on network errors (fetch throwing)', async () => {
    setupSupabaseChain({
      data: [{ id: '1', url: 'https://example.com/hook', encrypted_secret: 's' }],
      error: null,
    });

    (fetch as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockRejectedValueOnce(new Error('ETIMEDOUT'))
      .mockRejectedValueOnce(new Error('ECONNRESET'));

    const promise = sendWebhookEvent('job.created', { jobId: '1' });
    await vi.runAllTimersAsync();
    await promise;

    expect(fetch).toHaveBeenCalledTimes(3);
    expect(mockLogWebhookDelivery).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });

  // ── 7. Successful delivery stops retries ─────────────────────────────

  it('stops retrying after a successful 200 response', async () => {
    setupSupabaseChain({
      data: [{ id: '1', url: 'https://example.com/hook', encrypted_secret: 's' }],
      error: null,
    });

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(okResponse());

    const promise = sendWebhookEvent('job.created', { jobId: '1' });
    await vi.runAllTimersAsync();
    await promise;

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('stops retrying once a retry attempt succeeds', async () => {
    setupSupabaseChain({
      data: [{ id: '1', url: 'https://example.com/hook', encrypted_secret: 's' }],
      error: null,
    });

    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(errorResponse(500))
      .mockResolvedValueOnce(okResponse());

    const promise = sendWebhookEvent('job.created', { jobId: '1' });
    await vi.runAllTimersAsync();
    await promise;

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  // ── 8. Multiple subscriptions ────────────────────────────────────────

  it('delivers to all matching subscriptions in parallel', async () => {
    setupSupabaseChain({
      data: [
        { id: '1', url: 'https://a.example.com/hook', encrypted_secret: 'sa' },
        { id: '2', url: 'https://b.example.com/hook', encrypted_secret: 'sb' },
        { id: '3', url: 'https://c.example.com/hook', encrypted_secret: 'sc' },
      ],
      error: null,
    });

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(okResponse());

    const promise = sendWebhookEvent('quote.accepted', { quoteId: '42' });
    await vi.runAllTimersAsync();
    await promise;

    expect(fetch).toHaveBeenCalledTimes(3);

    const urls = (fetch as ReturnType<typeof vi.fn>).mock.calls.map(
      (call: unknown[]) => call[0] as string
    );
    expect(urls).toContain('https://a.example.com/hook');
    expect(urls).toContain('https://b.example.com/hook');
    expect(urls).toContain('https://c.example.com/hook');
  });

  // ── 9. No subscriptions ─────────────────────────────────────────────

  it('returns gracefully when no subscriptions match', async () => {
    setupSupabaseChain({ data: [], error: null });

    const promise = sendWebhookEvent('job.created', { jobId: '1' });
    await vi.runAllTimersAsync();
    await promise;

    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns gracefully when data is null', async () => {
    setupSupabaseChain({ data: null, error: null });

    const promise = sendWebhookEvent('job.created', { jobId: '1' });
    await vi.runAllTimersAsync();
    await promise;

    expect(fetch).not.toHaveBeenCalled();
  });

  // ── 10. Supabase query error ─────────────────────────────────────────

  it('handles Supabase query errors gracefully', async () => {
    setupSupabaseChain({ data: null, error: { message: 'DB down' } });

    const promise = sendWebhookEvent('job.created', { jobId: '1' });
    await vi.runAllTimersAsync();
    await promise;

    expect(fetch).not.toHaveBeenCalled();
  });

  it('handles thrown exceptions from Supabase client gracefully', async () => {
    mockFrom.mockImplementation(() => {
      throw new Error('Service client init failed');
    });

    const promise = sendWebhookEvent('job.created', { jobId: '1' });
    await vi.runAllTimersAsync();
    await promise;

    // Should not throw — non-blocking
    expect(fetch).not.toHaveBeenCalled();
  });

  // ── 11. Request headers ──────────────────────────────────────────────

  it('sends all required headers on delivery', async () => {
    const requestId = 'custom-req-id-999';
    setupSupabaseChain({
      data: [{ id: '1', url: 'https://example.com/hook', encrypted_secret: 'sec' }],
      error: null,
    });

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(okResponse());

    const promise = sendWebhookEvent('payment.completed', { amount: 100 }, requestId);
    await vi.runAllTimersAsync();
    await promise;

    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const headers = init.headers as Record<string, string>;

    expect(url).toBe('https://example.com/hook');
    expect(init.method).toBe('POST');
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['X-WorkMate-Event']).toBe('payment.completed');
    expect(headers['X-WorkMate-Timestamp']).toBe(FIXED_TIMESTAMP_SECS);
    expect(headers['X-WorkMate-Signature']).toMatch(/^sha256=[a-f0-9]{64}$/);
    expect(headers['X-Request-Id']).toBe(requestId);
  });

  it('generates a UUID for X-Request-Id when none is provided', async () => {
    setupSupabaseChain({
      data: [{ id: '1', url: 'https://example.com/hook', encrypted_secret: 'sec' }],
      error: null,
    });

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(okResponse());

    const promise = sendWebhookEvent('provider.approved', { providerId: '7' });
    await vi.runAllTimersAsync();
    await promise;

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const headers = init.headers as Record<string, string>;

    expect(headers['X-Request-Id']).toBe(FIXED_UUID);
  });

  // ── 12. Body payload structure ───────────────────────────────────────

  it('sends correctly structured JSON body', async () => {
    const event = 'document.verified';
    const payload = { documentId: 'doc-55', status: 'approved' };

    setupSupabaseChain({
      data: [{ id: '1', url: 'https://example.com/hook', encrypted_secret: 's' }],
      error: null,
    });

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(okResponse());

    const promise = sendWebhookEvent(event, payload);
    await vi.runAllTimersAsync();
    await promise;

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const parsed = JSON.parse(init.body);

    expect(parsed.event).toBe(event);
    expect(parsed.data).toEqual(payload);
    expect(parsed.timestamp).toBe(Number(FIXED_TIMESTAMP_SECS));
  });
});
