import { describe, expect, it } from 'vitest';
import {
  createJobSchema,
  createQuoteSchema,
  createReviewSchema,
  webhookSubscribeSchema,
  createProviderAvailabilitySchema,
  createMessageSchema,
  createJobMessageSchema,
  acceptQuoteSchema,
  submitOfferSchema,
  updateJobStatusSchema,
  createDisputeSchema,
  bulkNotificationSchema,
} from '@/lib/validation/api';

// ─── createJobSchema ──────────────────────────────────────────────────────────

describe('createJobSchema', () => {
  const valid = {
    title: 'Boiler repair needed',
    category_id: '11111111-1111-1111-1111-111111111111',
    description: 'My boiler stopped working and needs urgent attention.',
    eircode: 'D02X285',
    county: 'Dublin',
    locality: 'Dublin 2',
    budget_range: 'under_100',
  };

  it('accepts a valid job payload', () => {
    expect(createJobSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a title that is too short', () => {
    const result = createJobSchema.safeParse({ ...valid, title: 'Ab' });
    expect(result.success).toBe(false);
  });

  it('rejects a description shorter than 10 characters', () => {
    const result = createJobSchema.safeParse({ ...valid, description: 'Too short' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid category_id (not a UUID)', () => {
    const result = createJobSchema.safeParse({ ...valid, category_id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('defaults job_mode to get_quotes when omitted', () => {
    const result = createJobSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.job_mode).toBe('get_quotes');
  });

  it('rejects an invalid job_mode value', () => {
    const result = createJobSchema.safeParse({ ...valid, job_mode: 'auction' });
    expect(result.success).toBe(false);
  });

  it('accepts all valid job_mode values', () => {
    for (const mode of ['quick_hire', 'direct_request', 'get_quotes']) {
      const result = createJobSchema.safeParse({ ...valid, job_mode: mode });
      expect(result.success).toBe(true);
    }
  });

  it('rejects more than 20 photo_urls', () => {
    const result = createJobSchema.safeParse({
      ...valid,
      photo_urls: Array.from({ length: 21 }, (_, i) => `https://example.com/${i}.jpg`),
    });
    expect(result.success).toBe(false);
  });
});

// ─── createQuoteSchema ────────────────────────────────────────────────────────

describe('createQuoteSchema', () => {
  const slot = { start: '2026-04-01T09:00:00.000Z', end: '2026-04-01T11:00:00.000Z' };
  const valid = {
    job_id: '22222222-2222-2222-2222-222222222222',
    quote_amount_cents: 15000,
    estimated_duration: '2 hours',
    includes: ['Parts', 'Labour'],
    availability_slots: [slot],
  };

  it('accepts a valid quote payload', () => {
    expect(createQuoteSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a zero or negative price', () => {
    expect(createQuoteSchema.safeParse({ ...valid, quote_amount_cents: 0 }).success).toBe(false);
    expect(createQuoteSchema.safeParse({ ...valid, quote_amount_cents: -500 }).success).toBe(false);
  });

  it('rejects an empty includes array', () => {
    const result = createQuoteSchema.safeParse({ ...valid, includes: [] });
    expect(result.success).toBe(false);
  });

  it('rejects more than 12 includes items', () => {
    const result = createQuoteSchema.safeParse({
      ...valid,
      includes: Array.from({ length: 13 }, (_, i) => `Item ${i}`),
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty availability_slots', () => {
    const result = createQuoteSchema.safeParse({ ...valid, availability_slots: [] });
    expect(result.success).toBe(false);
  });

  it('rejects non-UUID job_id', () => {
    const result = createQuoteSchema.safeParse({ ...valid, job_id: 'bad-id' });
    expect(result.success).toBe(false);
  });
});

// ─── createReviewSchema ───────────────────────────────────────────────────────

describe('createReviewSchema', () => {
  const valid = {
    job_id: '33333333-3333-3333-3333-333333333333',
    rating: 4,
  };

  it('accepts a minimal valid review', () => {
    expect(createReviewSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts all dimension ratings', () => {
    const result = createReviewSchema.safeParse({
      ...valid,
      quality_rating: 5,
      communication_rating: 4,
      punctuality_rating: 3,
      value_rating: 5,
      comment: 'Great work overall.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects rating below 1', () => {
    expect(createReviewSchema.safeParse({ ...valid, rating: 0 }).success).toBe(false);
  });

  it('rejects rating above 5', () => {
    expect(createReviewSchema.safeParse({ ...valid, rating: 6 }).success).toBe(false);
  });

  it('rejects a comment longer than 2000 chars', () => {
    const result = createReviewSchema.safeParse({ ...valid, comment: 'a'.repeat(2001) });
    expect(result.success).toBe(false);
  });

  it('rejects a dimension rating above 5', () => {
    const result = createReviewSchema.safeParse({ ...valid, quality_rating: 6 });
    expect(result.success).toBe(false);
  });
});

// ─── webhookSubscribeSchema ───────────────────────────────────────────────────

describe('webhookSubscribeSchema', () => {
  it('accepts a valid HTTPS webhook subscription', () => {
    const result = webhookSubscribeSchema.safeParse({
      url: 'https://example.com/webhook',
      events: ['job.created', 'quote.accepted'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an HTTP (non-HTTPS) webhook URL', () => {
    const result = webhookSubscribeSchema.safeParse({
      url: 'http://example.com/webhook',
      events: ['job.created'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty events array', () => {
    const result = webhookSubscribeSchema.safeParse({
      url: 'https://example.com/webhook',
      events: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects more than 10 events', () => {
    const allEvents = [
      'job.created', 'quote.accepted', 'payment.completed',
      'provider.approved', 'document.verified', 'document.rejected',
      'job.created', 'quote.accepted', 'payment.completed', 'provider.approved',
      'document.verified',
    ];
    const result = webhookSubscribeSchema.safeParse({
      url: 'https://example.com/webhook',
      events: allEvents,
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown event type', () => {
    const result = webhookSubscribeSchema.safeParse({
      url: 'https://example.com/webhook',
      events: ['unknown.event'],
    });
    expect(result.success).toBe(false);
  });
});

// ─── createProviderAvailabilitySchema ────────────────────────────────────────

describe('createProviderAvailabilitySchema', () => {
  it('accepts a valid recurring availability slot', () => {
    const result = createProviderAvailabilitySchema.safeParse({
      is_recurring: true,
      day_of_week: 1,
      start_time: '09:00',
      end_time: '17:00',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a valid one-time availability slot', () => {
    const result = createProviderAvailabilitySchema.safeParse({
      is_recurring: false,
      specific_date: '2026-04-01',
      start_time: '10:00',
      end_time: '12:00',
    });
    expect(result.success).toBe(true);
  });

  it('rejects when end_time is before start_time', () => {
    const result = createProviderAvailabilitySchema.safeParse({
      is_recurring: true,
      day_of_week: 2,
      start_time: '17:00',
      end_time: '09:00',
    });
    expect(result.success).toBe(false);
  });

  it('rejects recurring slot without day_of_week', () => {
    const result = createProviderAvailabilitySchema.safeParse({
      is_recurring: true,
      start_time: '09:00',
      end_time: '17:00',
    });
    expect(result.success).toBe(false);
  });

  it('rejects one-time slot without specific_date', () => {
    const result = createProviderAvailabilitySchema.safeParse({
      is_recurring: false,
      start_time: '10:00',
      end_time: '12:00',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid time format (missing leading zero)', () => {
    const result = createProviderAvailabilitySchema.safeParse({
      is_recurring: true,
      day_of_week: 1,
      start_time: '9:00',
      end_time: '17:00',
    });
    expect(result.success).toBe(false);
  });
});

// ─── createMessageSchema ──────────────────────────────────────────────────────

describe('createMessageSchema', () => {
  const valid = {
    job_id: '44444444-4444-4444-4444-444444444444',
    visibility: 'public',
    message: 'Hello, is this still available?',
  };

  it('accepts a valid public message', () => {
    expect(createMessageSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts a private message with receiver_id', () => {
    const result = createMessageSchema.safeParse({
      ...valid,
      visibility: 'private',
      receiver_id: '55555555-5555-5555-5555-555555555555',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty message', () => {
    const result = createMessageSchema.safeParse({ ...valid, message: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a message exceeding 2000 characters', () => {
    const result = createMessageSchema.safeParse({ ...valid, message: 'x'.repeat(2001) });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid visibility value', () => {
    const result = createMessageSchema.safeParse({ ...valid, visibility: 'protected' });
    expect(result.success).toBe(false);
  });
});

// ─── acceptQuoteSchema ────────────────────────────────────────────────────────

describe('acceptQuoteSchema', () => {
  it('accepts a valid UUID quote_id', () => {
    const result = acceptQuoteSchema.safeParse({
      quote_id: '66666666-6666-6666-6666-666666666666',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a non-UUID quote_id', () => {
    const result = acceptQuoteSchema.safeParse({ quote_id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });
});

// ─── submitOfferSchema ────────────────────────────────────────────────────────

describe('submitOfferSchema', () => {
  const valid = {
    jobId: '77777777-7777-7777-7777-777777777777',
    priceCents: 5000,
    description: 'I can fix this quickly and efficiently.',
  };

  it('accepts a valid offer', () => {
    expect(submitOfferSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects priceCents below 100 (less than €1)', () => {
    const result = submitOfferSchema.safeParse({ ...valid, priceCents: 99 });
    expect(result.success).toBe(false);
  });

  it('rejects a description shorter than 10 characters', () => {
    const result = submitOfferSchema.safeParse({ ...valid, description: 'Too short' });
    expect(result.success).toBe(false);
  });

  it('rejects a description exceeding 2000 characters', () => {
    const result = submitOfferSchema.safeParse({ ...valid, description: 'x'.repeat(2001) });
    expect(result.success).toBe(false);
  });
});

// ─── updateJobStatusSchema ────────────────────────────────────────────────────

describe('updateJobStatusSchema', () => {
  const validStatuses = ['open', 'quoted', 'accepted', 'in_progress', 'completed', 'cancelled'];

  it('accepts all valid job status values', () => {
    for (const status of validStatuses) {
      const result = updateJobStatusSchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  });

  it('rejects an unknown status', () => {
    const result = updateJobStatusSchema.safeParse({ status: 'suspended' });
    expect(result.success).toBe(false);
  });
});

// ─── createDisputeSchema ──────────────────────────────────────────────────────

describe('createDisputeSchema', () => {
  const valid = {
    job_id: '88888888-8888-8888-8888-888888888888',
    dispute_type: 'quality_issue',
    customer_claim: 'The work was not completed to the agreed standard.',
  };

  it('accepts a valid dispute', () => {
    expect(createDisputeSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects customer_claim shorter than 10 characters', () => {
    const result = createDisputeSchema.safeParse({ ...valid, customer_claim: 'Bad work.' });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown dispute_type', () => {
    const result = createDisputeSchema.safeParse({ ...valid, dispute_type: 'scam' });
    expect(result.success).toBe(false);
  });

  it('accepts all valid dispute types', () => {
    for (const dispute_type of ['quality_issue', 'non_completion', 'damage', 'no_show', 'other']) {
      expect(createDisputeSchema.safeParse({ ...valid, dispute_type }).success).toBe(true);
    }
  });
});

// ─── bulkNotificationSchema ───────────────────────────────────────────────────

describe('bulkNotificationSchema', () => {
  const valid = {
    profile_ids: ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'],
    message: 'Important platform update.',
  };

  it('accepts a valid bulk notification', () => {
    expect(bulkNotificationSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects an empty profile_ids array', () => {
    const result = bulkNotificationSchema.safeParse({ ...valid, profile_ids: [] });
    expect(result.success).toBe(false);
  });

  it('rejects more than 200 profile_ids', () => {
    const result = bulkNotificationSchema.safeParse({
      ...valid,
      profile_ids: Array.from({ length: 201 }, () => 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    });
    expect(result.success).toBe(false);
  });

  it('rejects a message shorter than 2 characters', () => {
    const result = bulkNotificationSchema.safeParse({ ...valid, message: 'x' });
    expect(result.success).toBe(false);
  });

  it('defaults type to admin_bulk_notice when omitted', () => {
    const result = bulkNotificationSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.type).toBe('admin_bulk_notice');
  });
});
