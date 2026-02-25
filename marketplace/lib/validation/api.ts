import { z } from 'zod';
import { JOB_BUDGET_OPTIONS } from '@/lib/constants/job';

export const createJobSchema = z.object({
  title: z.string().trim().min(3).max(120),
  category_id: z.string().uuid(),
  description: z.string().trim().min(10).max(4000),
  eircode: z.string().trim().min(3).max(12),
  county: z.string().trim().min(2).max(120),
  locality: z.string().trim().min(2).max(120),
  budget_range: z.enum(JOB_BUDGET_OPTIONS),
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
  estimated_duration: z.string().trim().min(1).max(120),
  includes: z.array(z.string().trim().min(1).max(120)).min(1).max(12),
  excludes: z.array(z.string().trim().min(1).max(120)).max(12).optional().default([]),
  availability_slots: z.array(availabilitySlotSchema).min(1).max(20),
});

export const createAccountLinkSchema = z.object({
  stripe_account_id: z.string().trim().min(3).max(255),
});

export const createSecureHoldSchema = z.object({
  amount_cents: z.number().int().positive().max(100_000_000),
  connected_account_id: z.string().trim().min(3).max(255),
  quote_id: z.string().uuid(),
  job_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  pro_id: z.string().uuid(),
});

export const capturePaymentSchema = z.object({
  payment_intent_id: z.string().trim().min(3).max(255),
});

export const finalizeHoldSchema = z.object({
  checkout_session_id: z.string().trim().min(3).max(255),
});

export const acceptQuoteSchema = z.object({
  quote_id: z.string().uuid(),
});

export const addressLookupQuerySchema = z.object({
  eircode: z.string().trim().min(3).max(12),
});

export const profileAddressSchema = z.object({
  address_line_1: z.string().trim().min(3).max(160),
  address_line_2: z.string().trim().max(160).optional().default(''),
  locality: z.string().trim().min(2).max(120),
  county: z.string().trim().min(2).max(120),
  eircode: z.string().trim().min(3).max(12),
});

export const adminProviderDecisionSchema = z.object({
  profile_id: z.string().uuid(),
  decision: z.enum(['approve', 'reject', 'request_changes']),
  note: z.string().trim().max(400).optional().default(''),
});

export const adminDocumentDecisionSchema = z.object({
  document_id: z.string().uuid(),
  decision: z.enum(['approve', 'reject', 'request_resubmission']),
  note: z.string().trim().max(400).optional().default(''),
});

export const adminProviderFiltersSchema = z.object({
  status: z.enum(['pending', 'verified', 'rejected', 'all']).optional().default('all'),
  review_type: z
    .enum(['all', 'provider_application', 'customer_identity_review', 'other'])
    .optional()
    .default('all'),
  category: z.string().trim().max(120).optional().default('all'),
  county: z.string().trim().max(120).optional().default('all'),
  date_range: z.enum(['7d', '30d', '90d', 'all']).optional().default('7d'),
  city: z.string().trim().max(120).optional().default(''),
  service: z.string().trim().max(120).optional().default(''),
  q: z.string().trim().max(120).optional().default(''),
});

export const adminRunVerificationSchema = z.object({
  profile_id: z.string().uuid(),
});

export const prescreenVerificationSchema = z.object({
  profile_id: z.string().uuid(),
  document_id: z.string().uuid(),
});

export const createGuestJobIntentSchema = z.object({
  email: z.string().trim().email().max(160),
  title: z.string().trim().min(3).max(120),
  category_id: z.string().uuid(),
  description: z.string().trim().min(10).max(4000),
  eircode: z.string().trim().min(3).max(12),
  county: z.string().trim().min(2).max(120),
  locality: z.string().trim().min(2).max(120),
  budget_range: z.enum(JOB_BUDGET_OPTIONS),
  photo_urls: z.array(z.string().trim().min(1)).max(20).optional().default([]),
});

export const claimGuestJobIntentSchema = z.object({
  intent_id: z.string().uuid(),
});

export const updateJobStatusSchema = z.object({
  status: z.enum(['open', 'quoted', 'accepted', 'in_progress', 'completed', 'cancelled']),
});

export const updateJobPhotosSchema = z.object({
  photo_urls: z.array(z.string().trim().min(1)).min(1).max(10),
});

export const createMessageSchema = z.object({
  job_id: z.string().uuid(),
  quote_id: z.string().uuid().optional(),
  receiver_id: z.string().uuid().optional(),
  visibility: z.enum(['public', 'private']),
  message: z.string().trim().min(1).max(2000),
});

export const upsertPortfolioSchema = z.object({
  id: z.string().uuid().optional(),
  category_id: z.string().uuid().optional().nullable(),
  title: z.string().trim().max(120).optional().default(''),
  before_image_url: z.string().trim().url(),
  after_image_url: z.string().trim().url(),
  experience_note: z.string().trim().max(2000).optional().default(''),
  visibility_scope: z.enum(['public', 'applied_customers']).optional(),
  is_public: z.boolean().optional().default(true),
});
