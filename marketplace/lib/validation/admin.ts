import { z } from 'zod';

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

export const adminJobDecisionSchema = z.object({
  note: z.string().trim().max(400).optional().default(''),
});

export const patchApiKeyRateLimitSchema = z.object({
  api_rate_limit: z.number().int().min(1).max(500000),
});

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

export const bulkNotificationSchema = z.object({
  profile_ids: z.array(z.string().uuid()).min(1).max(200),
  message: z.string().trim().min(2).max(300),
  type: z
    .enum(['admin_bulk_notice', 'admin_verification_update'])
    .optional()
    .default('admin_bulk_notice'),
});

export const batchVerificationSchema = z.object({
  profile_ids: z.array(z.string().uuid()).min(1).max(50),
  action: z.enum(['approve', 'reject']),
  reason: z.string().max(500).optional(),
});

export const bulkReviewRiskSchema = z.object({
  profile_ids: z.array(z.string().uuid()).min(1).max(200),
});

export const processGdprDeletionSchema = z.object({
  profile_id: z.string().uuid(),
});

export const auditLogQuerySchema = z.object({
  limit:    z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(200)).optional(),
  offset:   z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(0)).optional(),
  action:   z.string().trim().max(120).optional(),
  admin_id: z.string().uuid().optional(),
  days:     z.enum(['7', '30', 'all']).optional().default('30'),
});

export const adminStatsQuerySchema = z.object({
  monthly: z.enum(['true', 'false']).optional().default('false'),
});

export const patchFeatureFlagSchema = z.object({
  flag_key: z.string().trim().min(2).max(100),
  enabled: z.boolean(),
});

export const complianceRecalcSchema = z.object({
  providerId: z.string().uuid().optional().nullable(),
});
