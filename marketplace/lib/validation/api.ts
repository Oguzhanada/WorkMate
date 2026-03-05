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
  task_type: z.enum(['in_person', 'remote', 'flexible']).optional().default('in_person'),
  job_mode: z.enum(['quick_hire', 'direct_request', 'get_quotes']).optional().default('get_quotes'),
  target_provider_id: z.string().uuid().optional().nullable().default(null),
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
  date_range: z.enum(['7d', '30d', '90d', 'all']).optional().default('all'),
  city: z.string().trim().max(120).optional().default(''),
  service: z.string().trim().max(120).optional().default(''),
  q: z.string().trim().max(120).optional().default(''),
  // Advanced filter additions
  start_date: z.string().trim().max(32).optional().default(''),
  end_date: z.string().trim().max(32).optional().default(''),
  id_verification_status: z
    .enum(['none', 'pending', 'approved', 'rejected', 'all'])
    .optional()
    .default('all'),
  has_documents: z.enum(['any', 'yes', 'no']).optional().default('any'),
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
  task_type: z.enum(['in_person', 'remote', 'flexible']).optional().default('in_person'),
  job_mode: z.enum(['quick_hire', 'direct_request', 'get_quotes']).optional().default('get_quotes'),
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

export const updateJobDraftSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(4000),
  eircode: z.string().trim().min(3).max(12),
  county: z.string().trim().min(2).max(120),
  locality: z.string().trim().min(2).max(120),
  budget_range: z.enum(JOB_BUDGET_OPTIONS),
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

export const adminJobDecisionSchema = z.object({
  note: z.string().trim().max(400).optional().default(''),
});

export const createDisputeSchema = z.object({
  job_id: z.string().uuid(),
  dispute_type: z.enum(['quality_issue', 'non_completion', 'damage', 'no_show', 'other']),
  customer_claim: z.string().trim().min(10).max(4000),
});

export const disputeRespondSchema = z.object({
  response: z.string().trim().min(5).max(4000),
});

export const disputeEvidenceSchema = z.object({
  file_url: z.string().trim().min(3).max(2000),
  file_type: z.string().trim().min(2).max(120),
  description: z.string().trim().max(600).optional().default(''),
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

export const createStripeIdentitySchema = z.object({
  return_url: z.string().trim().url().optional(),
});

export const createTimeEntrySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('start'),
    description: z.string().trim().max(2000).optional().default(''),
    hourly_rate: z.number().int().min(1).max(100_000_000).optional().nullable().default(null),
    started_at: z.string().datetime({ offset: true }).optional(),
  }),
  z.object({
    action: z.literal('stop'),
    entry_id: z.string().uuid().optional(),
    ended_at: z.string().datetime({ offset: true }).optional(),
    description: z.string().trim().max(2000).optional(),
  }),
]);

export const patchTimeEntrySchema = z
  .object({
    description: z.string().trim().max(2000).optional(),
    hourly_rate: z.number().int().min(1).max(100_000_000).nullable().optional(),
    started_at: z.string().datetime({ offset: true }).optional(),
    ended_at: z.string().datetime({ offset: true }).nullable().optional(),
    approved: z.boolean().optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, { message: 'At least one field required' });

const scheduleTimeSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Use HH:MM format');

export const createProviderAvailabilitySchema = z
  .object({
    is_recurring: z.boolean().optional().default(true),
    day_of_week: z.number().int().min(0).max(6).optional().nullable(),
    specific_date: z.string().date().optional().nullable(),
    start_time: scheduleTimeSchema,
    end_time: scheduleTimeSchema,
  })
  .superRefine((payload, ctx) => {
    if (payload.start_time >= payload.end_time) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'end_time must be after start_time',
        path: ['end_time'],
      });
    }

    if (payload.is_recurring) {
      if (payload.day_of_week == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'day_of_week is required for recurring availability',
          path: ['day_of_week'],
        });
      }
      if (payload.specific_date != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'specific_date must be empty for recurring availability',
          path: ['specific_date'],
        });
      }
    } else {
      if (!payload.specific_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'specific_date is required for one-time availability',
          path: ['specific_date'],
        });
      }
      if (payload.day_of_week != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'day_of_week must be empty for one-time availability',
          path: ['day_of_week'],
        });
      }
    }
  });

export const createAppointmentSchema = z
  .object({
    start_time: z.string().datetime({ offset: true }),
    end_time: z.string().datetime({ offset: true }),
  })
  .superRefine((payload, ctx) => {
    if (new Date(payload.end_time).getTime() <= new Date(payload.start_time).getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'end_time must be after start_time',
        path: ['end_time'],
      });
    }
  });

export const patchAppointmentSchema = z.object({
  status: z.enum(['scheduled', 'completed', 'cancelled']),
});

const widgetPositionSchema = z.object({
  x: z.number().int().min(0).max(24),
  y: z.number().int().min(0).max(100),
  w: z.number().int().min(1).max(12),
  h: z.number().int().min(1).max(12),
});

const widgetTypeSchema = z.enum([
  'active_jobs',
  'pending_quotes',
  'recent_messages',
  'task_alerts',
  'admin_pending_jobs',
  'admin_applications',
  'admin_stats',
  'admin_api_keys',
]);

export const createDashboardWidgetSchema = z.object({
  widget_type: widgetTypeSchema,
  position: widgetPositionSchema.optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export const patchDashboardWidgetSchema = z
  .object({
    position: widgetPositionSchema.optional(),
    settings: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, { message: 'At least one field required' });

export const createReviewSchema = z.object({
  job_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional().default(''),
  quality_rating: z.number().int().min(1).max(5).optional().nullable(),
  communication_rating: z.number().int().min(1).max(5).optional().nullable(),
  punctuality_rating: z.number().int().min(1).max(5).optional().nullable(),
  value_rating: z.number().int().min(1).max(5).optional().nullable(),
});
