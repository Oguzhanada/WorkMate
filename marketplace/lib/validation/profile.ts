import { z } from 'zod';

export const profileAddressSchema = z.object({
  address_line_1: z.string().trim().min(3).max(160),
  address_line_2: z.string().trim().max(160).optional().default(''),
  locality: z.string().trim().min(2).max(120),
  county: z.string().trim().min(2).max(120),
  eircode: z.string().trim().min(3).max(12),
});

export const addressLookupQuerySchema = z.object({
  eircode: z.string().trim().min(3).max(12),
});

export const redeemReferralSchema = z.object({
  code: z.string().trim().min(3).max(32).toUpperCase(),
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

export const createReviewSchema = z.object({
  job_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional().default(''),
  quality_rating: z.number().int().min(1).max(5).optional().nullable(),
  communication_rating: z.number().int().min(1).max(5).optional().nullable(),
  punctuality_rating: z.number().int().min(1).max(5).optional().nullable(),
  value_rating: z.number().int().min(1).max(5).optional().nullable(),
});

export const reviewResponseSchema = z.object({
  response: z.string().trim().min(10).max(1000),
});

export const toggleFavouriteSchema = z.object({
  provider_id: z.string().uuid(),
});

export const gdprDeleteRequestSchema = z.object({
  confirm: z.literal(true),
});

export const claimFoundingProSchema = z.object({
  confirm: z.literal(true),
});
