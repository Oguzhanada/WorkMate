import { z } from 'zod';
import { JOB_BUDGET_OPTIONS } from '@/lib/data/budgets';

// Postgres accepts any UUID format — z.string().uuid() in Zod 4 enforces version nibble [1-8]
// which rejects valid Postgres UUIDs with version 0. Use this helper instead.
const pgUuid = z.string().regex(
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
  'Invalid UUID',
);

// ── Auth schemas ────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().trim().min(1, 'Full name is required').max(120),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
});

// ── Job schemas ─────────────────────────────────────────────────────────────

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
  job_id: pgUuid,
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
  quote_id: pgUuid,
  job_id: pgUuid,
  customer_id: pgUuid,
  pro_id: pgUuid,
});

export const capturePaymentSchema = z.object({
  payment_intent_id: z.string().trim().min(3).max(255),
});

export const finalizeHoldSchema = z.object({
  checkout_session_id: z.string().trim().min(3).max(255),
});

export const acceptQuoteSchema = z.object({
  quote_id: pgUuid,
});

export const addressLookupQuerySchema = z.object({
  eircode: z.string().trim().min(3).max(12),
});

export const redeemReferralSchema = z.object({
  code: z.string().trim().min(3).max(32).toUpperCase(),
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
  cf_turnstile_token: z.string().optional(),
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
    video_link: z.string().trim().url().max(500).optional().nullable(),
    notes: z.string().trim().max(2000).optional().nullable(),
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

export const patchAppointmentSchema = z
  .object({
    status: z.enum(['scheduled', 'completed', 'cancelled']).optional(),
    video_link: z.string().trim().url().max(500).optional().nullable(),
    notes: z.string().trim().max(2000).optional().nullable(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' });

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
  'customer_stats',
  'provider_earnings',
  'admin_pending_jobs',
  'admin_applications',
  'admin_stats',
  'admin_api_keys',
  'admin_feature_flags',
  'provider_subscription',
  'profile_completeness',
  'availability',
  'portfolio',
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

// ─── Admin: API Key Rate Limit ───────────────────────────────────────────────
export const patchApiKeyRateLimitSchema = z.object({
  api_rate_limit: z.number().int().min(1).max(500000),
});

// ─── Admin: Automation Rules ─────────────────────────────────────────────────
export const createAutomationRuleSchema = z.object({
  trigger_event: z.enum([
    'document_verified',
    'document_rejected',
    'job_created',
    'quote_received',
    'job_inactive',
    'provider_approved',
  ]),
  conditions: z.record(z.string(), z.string()).default({}),
  action_type: z.enum(['send_notification', 'change_status', 'create_task']),
  action_config: z.record(z.string(), z.unknown()),
  enabled: z.boolean().default(true),
});

export const patchAutomationRuleSchema = z
  .object({
    enabled: z.boolean().optional(),
    conditions: z.record(z.string(), z.string()).optional(),
    action_type: z.enum(['send_notification', 'change_status', 'create_task']).optional(),
    action_config: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: 'At least one field is required',
  });

// ─── Admin: Bulk Notification ─────────────────────────────────────────────────
export const bulkNotificationSchema = z.object({
  profile_ids: z.array(z.string().uuid()).min(1).max(200),
  message: z.string().trim().min(2).max(300),
  type: z
    .enum(['admin_bulk_notice', 'admin_verification_update'])
    .optional()
    .default('admin_bulk_notice'),
});

// ─── Job: Messages ────────────────────────────────────────────────────────────
export const createJobMessageSchema = z.object({
  message: z.string().min(1).max(4000),
  message_type: z.enum(['text', 'file']).default('text'),
  file_url: z.string().url().optional(),
  file_name: z.string().max(255).optional(),
  receiver_id: z.string().uuid().optional(),
});

// ─── Job: Todos ───────────────────────────────────────────────────────────────
export const createJobTodoSchema = z.object({
  description: z.string().min(1).max(500),
  assigned_to: z.string().uuid().optional(),
  due_date: z.string().datetime({ offset: true }).optional(),
});

export const patchJobTodoSchema = z
  .object({
    completed: z.boolean().optional(),
    description: z.string().min(1).max(500).optional(),
    assigned_to: z.string().uuid().nullable().optional(),
    due_date: z.string().datetime({ offset: true }).nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' });

// ─── Public API: Webhook Subscribe ────────────────────────────────────────────
const webhookEventValues = [
  'job.created',
  'quote.accepted',
  'payment.completed',
  'provider.approved',
  'document.verified',
  'document.rejected',
] as const;

export const webhookSubscribeSchema = z.object({
  url: z.string().url().refine((v) => v.startsWith('https://'), 'Webhook URL must use HTTPS.'),
  events: z.array(z.enum(webhookEventValues)).min(1).max(10),
});

export const submitOfferSchema = z.object({
  jobId: z.string().uuid(),
  priceCents: z.number().int().min(100),
  description: z.string().trim().min(10).max(2000),
  estimatedDuration: z.string().trim().max(120).optional().default(''),
  includes: z.array(z.string().trim().min(1).max(120)).max(12).optional().default([]),
  excludes: z.array(z.string().trim().min(1).max(120)).max(12).optional().default([]),
});

// ─── AI: Suggest Alerts ───────────────────────────────────────────────────────
export const suggestAlertsSchema = z.object({
  max_suggestions: z.number().int().min(1).max(10).optional().default(5),
});

// ─── AI: Job Description ──────────────────────────────────────────────────────
export const jobDescriptionSchema = z.object({
  jobTitle: z.string().trim().min(1).max(120),
  categoryName: z.string().trim().min(1).max(120),
  scope: z.string().trim().max(500).optional(),
  urgency: z.string().trim().max(120).optional(),
  taskType: z.string().trim().max(120).optional(),
});

// ─── Founding Pro: Claim Slot ─────────────────────────────────────────────────
export const claimFoundingProSchema = z.object({
  confirm: z.literal(true),
});

// ─── Favourites: Toggle ───────────────────────────────────────────────────────
export const toggleFavouriteSchema = z.object({
  provider_id: z.string().uuid(),
});

// ─── Reviews: Provider Response ───────────────────────────────────────────────
export const reviewResponseSchema = z.object({
  response: z.string().trim().min(10).max(1000),
});

// ─── Stripe Subscription Webhooks ─────────────────────────────────────────────
// Schemas validate the Stripe event data objects before DB writes.

export const stripeSubscriptionObjectSchema = z.object({
  id: z.string().min(1),                         // Stripe subscription ID
  customer: z.string().min(1),                   // Stripe customer ID
  status: z.string().min(1),
  current_period_start: z.number().int(),        // Unix timestamp
  current_period_end: z.number().int(),          // Unix timestamp
  cancel_at_period_end: z.boolean(),
  metadata: z.record(z.string(), z.string()).optional().default({}),
});

// Stripe SDK v20: subscription ID is no longer a top-level field on Invoice.
// It lives at invoice.parent.subscription_details.subscription.
// The webhook handler reads sub ID directly from the typed Stripe.Invoice object.
// This schema covers the minimal fields we validate before any DB write.
export const stripeInvoiceObjectSchema = z.object({
  id: z.string().min(1),                         // Stripe invoice ID
  customer: z.string().min(1),                   // Stripe customer ID
  amount_paid: z.number().int().min(0).optional().default(0),
  metadata: z.record(z.string(), z.string()).optional().default({}),
});

// ─── Job: Contracts ───────────────────────────────────────────────────────────
export const createContractSchema = z.object({
  terms: z.string().trim().min(10).max(10000),
  quote_id: z.string().uuid().optional().nullable(),
});

export const signContractSchema = z.object({
  action: z.enum(['sign', 'void']),
});

// ─── Admin: Batch Verification ────────────────────────────────────────────────
export const batchVerificationSchema = z.object({
  profile_ids: z.array(z.string().uuid()).min(1).max(50),
  action: z.enum(['approve', 'reject']),
  reason: z.string().max(500).optional(),
});

// ─── Admin: Bulk Risk Review ──────────────────────────────────────────────────
export const bulkReviewRiskSchema = z.object({
  profile_ids: z.array(z.string().uuid()).min(1).max(200),
});

// ─── Admin: GDPR Deletion Processor ──────────────────────────────────────────
export const processGdprDeletionSchema = z.object({
  profile_id: z.string().uuid(),
});

// ─── GDPR: Self-Service Delete ────────────────────────────────────────────────
// Requires explicit { confirm: true } body to prevent accidental calls.
export const gdprDeleteRequestSchema = z.object({
  confirm: z.literal(true),
});

// ─── Analytics: Funnel Telemetry ─────────────────────────────────────────────
export const FUNNEL_NAMES = ['job_posting', 'provider_onboarding', 'booking'] as const;
export type FunnelName = (typeof FUNNEL_NAMES)[number];

export const trackFunnelEventSchema = z.object({
  funnel_name: z.enum(FUNNEL_NAMES),
  step_name:   z.string().trim().min(1).max(100),
  step_number: z.number().int().min(1),
  session_id:  z.string().trim().min(1).max(100),
  metadata:    z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

// ─── Appointments: Calendar Query ────────────────────────────────────────────
export const appointmentCalendarQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'month must be in YYYY-MM format'),
  role:  z.enum(['customer', 'provider']).optional(),
});

// ─── Analytics: Funnel Summary Query ─────────────────────────────────────────
export const funnelSummaryQuerySchema = z.object({
  days: z.enum(['7', '30', 'all']).optional().default('all'),
});

// ─── Provider: Public Search ──────────────────────────────────────────────────
export const IRISH_COUNTIES = [
  'Any',
  'Antrim', 'Armagh', 'Carlow', 'Cavan', 'Clare', 'Cork',
  'Donegal', 'Down', 'Dublin', 'Fermanagh', 'Galway', 'Kerry',
  'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick', 'Longford',
  'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly', 'Roscommon',
  'Sligo', 'Tipperary', 'Tyrone', 'Waterford', 'Westmeath', 'Wexford',
  'Wicklow',
] as const;

export type IrishCounty = (typeof IRISH_COUNTIES)[number];

const pageParamSchema  = z.preprocess(
  (v) => (v === '' || v == null ? '1'  : v),
  z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(1000)),
);

const limitParamSchema = z.preprocess(
  (v) => (v === '' || v == null ? '12' : v),
  z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(48)),
);

export const providerSearchSchema = z.object({
  q:             z.string().trim().max(120).optional().default(''),
  category_id:   z.string().uuid().optional(),
  county:        z.enum(IRISH_COUNTIES).optional().default('Any'),
  verified_only: z.enum(['true', 'false']).optional().default('true'),
  sort:          z.enum(['rating', 'rate_asc', 'rate_desc', 'newest', 'relevance']).optional().default('relevance'),
  page:          pageParamSchema.optional(),
  limit:         limitParamSchema.optional(),
});

// ─── Saved Searches ───────────────────────────────────────────────────────────
export const savedSearchFiltersSchema = z.object({
  category_id:   z.string().uuid().optional(),
  county:        z.string().optional(),
  min_rate:      z.number().optional(),
  max_rate:      z.number().optional(),
  verified_only: z.boolean().optional(),
});

export const createSavedSearchSchema = z.object({
  name:         z.string().trim().min(1).max(100),
  filters:      savedSearchFiltersSchema.optional().default({}),
  notify_email: z.boolean().default(false),
  notify_bell:  z.boolean().default(true),
});

export const updateSavedSearchSchema = z
  .object({
    notify_email: z.boolean().optional(),
    notify_bell:  z.boolean().optional(),
  })
  .refine((d) => d.notify_email !== undefined || d.notify_bell !== undefined, {
    message: 'Provide at least one of notify_email or notify_bell',
  });

// ─── Provider: Weekly Availability Schedule ───────────────────────────────────
export const availabilityDaySchema = z.object({
  day_of_week:  z.number().int().min(0).max(6),
  start_time:   z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format'),
  end_time:     z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format'),
  is_available: z.boolean(),
});

export const updateAvailabilitySchema = z.array(availabilityDaySchema).min(1).max(7);

// ─── Notifications: Bell API ──────────────────────────────────────────────────
export const notificationsQuerySchema = z.object({
  unread: z.enum(['true', 'false']).optional(),
  limit:  z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(50)).optional(),
});

// ─── Admin: Audit Log Query ───────────────────────────────────────────────────
export const auditLogQuerySchema = z.object({
  limit:    z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(200)).optional(),
  offset:   z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(0)).optional(),
  action:   z.string().trim().max(120).optional(),
  admin_id: z.string().uuid().optional(),
  days:     z.enum(['7', '30', 'all']).optional().default('30'),
});

export const markNotificationsReadSchema = z
  .object({
    ids: z.array(z.string().uuid()).min(1).max(100).optional(),
    all: z.boolean().optional(),
  })
  .refine((d) => d.ids !== undefined || d.all === true, {
    message: 'Provide either ids[] or all: true',
  });

// ─── Admin: Platform Stats Query ──────────────────────────────────────────────
export const adminStatsQuerySchema = z.object({
  monthly: z.enum(['true', 'false']).optional().default('false'),
});

// ─── Admin: Feature Flag Toggle ───────────────────────────────────────────────
export const patchFeatureFlagSchema = z.object({
  flag_key: z.string().trim().min(2).max(100),
  enabled: z.boolean(),
});

// ─── Task Alerts: Upsert ──────────────────────────────────────────────────────
const TASK_ALERT_COUNTIES = [
  'Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway',
  'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick',
  'Longford', 'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly',
  'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath',
  'Wexford', 'Wicklow', 'Ireland-wide',
] as const;

export const upsertTaskAlertSchema = z.object({
  keywords: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  categories: z.array(z.string().uuid()).max(20).default([]),
  counties: z.array(z.enum(TASK_ALERT_COUNTIES)).max(27).default([]),
  budget_min: z.number().int().min(0).nullable().default(null),
  enabled: z.boolean().default(true),
});

// ─── Public API: Jobs Query ───────────────────────────────────────────────────
export const publicJobsQuerySchema = z.object({
  limit:    z.preprocess((v) => (v === '' || v == null ? '20' : v), z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(100))),
  offset:   z.preprocess((v) => (v === '' || v == null ? '0' : v), z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(0))),
  status:   z.string().trim().max(30).optional(),
  county:   z.string().trim().max(120).optional(),
  category: z.string().trim().max(120).optional(),
});

// ─── Admin: Compliance Recalculation ─────────────────────────────────────────
export const complianceRecalcSchema = z.object({
  providerId: z.string().uuid().optional().nullable(),
});

// ─── Job: Cancellation ────────────────────────────────────────────────────────
export const cancelJobSchema = z.object({
  reason: z.enum(['changed_mind', 'found_another_provider', 'pricing_dispute', 'other']),
});

// ─── Portfolio: Work Gallery ───────────────────────────────────────────────────
export const createPortfolioItemSchema = z.object({
  title:         z.string().trim().min(1).max(100),
  description:   z.string().trim().max(500).optional(),
  image_url:     z.string().url(),
  display_order: z.number().int().min(0).optional(),
});

export const updatePortfolioItemSchema = z
  .object({
    title:         z.string().trim().min(1).max(100).optional(),
    description:   z.string().trim().max(500).optional(),
    image_url:     z.string().url().optional(),
    display_order: z.number().int().min(0).optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: 'At least one field is required',
  });
