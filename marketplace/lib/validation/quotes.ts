import { z } from 'zod';
import { pgUuid } from './jobs';

const availabilitySlotSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
});

export const createQuoteSchema = z.object({
  job_id: pgUuid,
  quote_amount_cents: z.number().int().positive().max(100_000_000),
  message: z.string().trim().max(3000).optional().default(''),
  estimated_duration: z.string().trim().min(1).max(120),
  includes: z.array(z.string().trim().min(1).max(120)).min(1).max(12),
  excludes: z.array(z.string().trim().min(1).max(120)).max(12).optional().default([]),
  availability_slots: z.array(availabilitySlotSchema).min(1).max(20),
});

export const acceptQuoteSchema = z.object({
  quote_id: pgUuid,
});

export const submitOfferSchema = z.object({
  jobId: z.string().uuid(),
  priceCents: z.number().int().min(100),
  description: z.string().trim().min(10).max(2000),
  estimatedDuration: z.string().trim().max(120).optional().default(''),
  includes: z.array(z.string().trim().min(1).max(120)).max(12).optional().default([]),
  excludes: z.array(z.string().trim().min(1).max(120)).max(12).optional().default([]),
});
