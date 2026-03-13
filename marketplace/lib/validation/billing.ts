import { z } from 'zod';
import { pgUuid } from './jobs';

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

export const createStripeIdentitySchema = z.object({
  return_url: z.string().trim().url().optional(),
});

// Stripe SDK v20: subscription ID is no longer a top-level field on Invoice.
// It lives at invoice.parent.subscription_details.subscription.
// The webhook handler reads sub ID directly from the typed Stripe.Invoice object.
// This schema covers the minimal fields we validate before any DB write.
export const stripeSubscriptionObjectSchema = z.object({
  id: z.string().min(1),                         // Stripe subscription ID
  customer: z.string().min(1),                   // Stripe customer ID
  status: z.string().min(1),
  current_period_start: z.number().int(),        // Unix timestamp
  current_period_end: z.number().int(),          // Unix timestamp
  cancel_at_period_end: z.boolean(),
  metadata: z.record(z.string(), z.string()).optional().default({}),
});

export const stripeInvoiceObjectSchema = z.object({
  id: z.string().min(1),                         // Stripe invoice ID
  customer: z.string().min(1),                   // Stripe customer ID
  amount_paid: z.number().int().min(0).optional().default(0),
  metadata: z.record(z.string(), z.string()).optional().default({}),
});
