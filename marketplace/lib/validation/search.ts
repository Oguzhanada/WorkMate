import { z } from 'zod';

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

export const publicJobsQuerySchema = z.object({
  limit:    z.preprocess((v) => (v === '' || v == null ? '20' : v), z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(100))),
  offset:   z.preprocess((v) => (v === '' || v == null ? '0' : v), z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(0))),
  status:   z.string().trim().max(30).optional(),
  county:   z.string().trim().max(120).optional(),
  category: z.string().trim().max(120).optional(),
});
