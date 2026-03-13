import { z } from 'zod';

export const FUNNEL_NAMES = ['job_posting', 'provider_onboarding', 'booking'] as const;
export type FunnelName = (typeof FUNNEL_NAMES)[number];

export const trackFunnelEventSchema = z.object({
  funnel_name: z.enum(FUNNEL_NAMES),
  step_name:   z.string().trim().min(1).max(100),
  step_number: z.number().int().min(1),
  session_id:  z.string().trim().min(1).max(100),
  metadata:    z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export const funnelSummaryQuerySchema = z.object({
  days: z.enum(['7', '30', 'all']).optional().default('all'),
});
