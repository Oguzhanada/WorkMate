import { z } from 'zod';

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

export const availabilityDaySchema = z.object({
  day_of_week:  z.number().int().min(0).max(6),
  start_time:   z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format'),
  end_time:     z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format'),
  is_available: z.boolean(),
});

export const updateAvailabilitySchema = z.array(availabilityDaySchema).min(1).max(7);

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

export const appointmentCalendarQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'month must be in YYYY-MM format'),
  role:  z.enum(['customer', 'provider']).optional(),
});
