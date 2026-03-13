import { z } from 'zod';

export const suggestAlertsSchema = z.object({
  max_suggestions: z.number().int().min(1).max(10).optional().default(5),
});

export const jobDescriptionSchema = z.object({
  jobTitle: z.string().trim().min(1).max(120),
  categoryName: z.string().trim().min(1).max(120),
  scope: z.string().trim().max(500).optional(),
  urgency: z.string().trim().max(120).optional(),
  taskType: z.string().trim().max(120).optional(),
});
