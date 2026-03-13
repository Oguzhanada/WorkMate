import { z } from 'zod';

export const createDisputeSchema = z.object({
  job_id: z.string().uuid(),
  dispute_type: z.enum([
    'quality_issue',
    'non_completion',
    'damage',
    'no_show',
    'no_show_provider',
    'no_show_customer',
    'pricing_dispute',
    'offline_payment',
    'other',
  ]),
  customer_claim: z.string().trim().min(10).max(4000),
});

export const disputeRespondSchema = z.object({
  response: z.string().trim().min(5).max(4000),
});

/** Maximum dispute evidence file size: 5 MB */
export const DISPUTE_EVIDENCE_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const disputeEvidenceSchema = z.object({
  file_url: z.string().trim().min(3).max(2000),
  file_type: z.string().trim().min(2).max(120),
  description: z.string().trim().max(600).optional().default(''),
  /** File size in bytes — must be provided for server-side validation */
  file_size: z
    .number()
    .int()
    .min(1, 'File size must be at least 1 byte')
    .max(DISPUTE_EVIDENCE_MAX_FILE_SIZE, 'File must not exceed 5 MB')
    .optional(),
});

export const disputeResolveSchema = z.object({
  status: z.enum(['resolved', 'cancelled']),
  resolution_type: z.enum(['full_refund', 'partial_refund', 'full_payment', 'custom']),
  resolution_amount_cents: z.number().int().min(0).max(100_000_000).optional(),
  admin_notes: z.string().trim().max(4000).optional().default(''),
});

export const disputeProcessPaymentSchema = z.object({
  action: z.enum(['refund_full', 'refund_partial', 'capture_full', 'capture_partial']),
  amount_cents: z.number().int().min(1).max(100_000_000).optional(),
});
