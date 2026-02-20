import { z } from 'zod';

export const createJobSchema = z.object({
  title: z.string().trim().min(3).max(120),
  category: z.string().trim().min(2).max(80),
  description: z.string().trim().min(10).max(4000),
  eircode: z.string().trim().min(3).max(12),
  budget_range: z.string().trim().min(2).max(120),
  photo_urls: z.array(z.string().trim().min(1)).max(20).optional().default([]),
});

const availabilitySlotSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
});

export const createQuoteSchema = z.object({
  job_id: z.string().uuid(),
  quote_amount_cents: z.number().int().positive().max(100_000_000),
  message: z.string().trim().max(3000).optional().default(''),
  availability_slots: z.array(availabilitySlotSchema).min(1).max(20),
});
