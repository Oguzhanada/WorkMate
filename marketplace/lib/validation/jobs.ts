import { z } from 'zod';
import { JOB_BUDGET_OPTIONS } from '@/lib/data/budgets';

// Postgres accepts any UUID format — z.string().uuid() in Zod 4 enforces version nibble [1-8]
// which rejects valid Postgres UUIDs with version 0. Use this helper instead.
export const pgUuid = z.string().regex(
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
  'Invalid UUID',
);

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

export const cancelJobSchema = z.object({
  reason: z.enum(['changed_mind', 'found_another_provider', 'pricing_dispute', 'other']),
});

export const createMessageSchema = z.object({
  job_id: z.string().uuid(),
  quote_id: z.string().uuid().optional(),
  receiver_id: z.string().uuid().optional(),
  visibility: z.enum(['public', 'private']),
  message: z.string().trim().min(1).max(2000),
});

export const createJobMessageSchema = z.object({
  message: z.string().min(1).max(4000),
  message_type: z.enum(['text', 'file']).default('text'),
  file_url: z.string().url().optional(),
  file_name: z.string().max(255).optional(),
  receiver_id: z.string().uuid().optional(),
});

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

export const createContractSchema = z.object({
  terms: z.string().trim().min(10).max(10000),
  quote_id: z.string().uuid().optional().nullable(),
});

export const signContractSchema = z.object({
  action: z.enum(['sign', 'void']),
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
