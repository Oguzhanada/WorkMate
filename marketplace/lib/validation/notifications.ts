import { z } from 'zod';

export const notificationsQuerySchema = z.object({
  unread: z.enum(['true', 'false']).optional(),
  limit:  z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(50)).optional(),
});

export const markNotificationsReadSchema = z
  .object({
    ids: z.array(z.string().uuid()).min(1).max(100).optional(),
    all: z.boolean().optional(),
  })
  .refine((d) => d.ids !== undefined || d.all === true, {
    message: 'Provide either ids[] or all: true',
  });
