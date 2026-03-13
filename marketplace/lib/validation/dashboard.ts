import { z } from 'zod';

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
