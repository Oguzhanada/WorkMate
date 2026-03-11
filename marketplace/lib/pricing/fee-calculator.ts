import {getSupabaseServiceClient} from '@/lib/supabase/service';
import type {FeeCalculation, RebookingInfo} from '@/lib/types/airtasker';

/* ─── Fee constants ─── */

/**
 * Customer service fee tiers (applied to job subtotal in euros):
 *   €0–€49   → 0%
 *   €50–€99  → 5%
 *   €100–€299 → 7%
 *   €300+    → 5%
 * Rebooking (same customer+provider worked before): rate halved per tier.
 */
export const CUSTOMER_FEE_TIERS = [
  {min: 0,   max: 49,   rate: 0,    rebookingRate: 0},
  {min: 50,  max: 99,   rate: 0.05, rebookingRate: 0.03},
  {min: 100, max: 299,  rate: 0.07, rebookingRate: 0.04},
  {min: 300, max: Infinity, rate: 0.05, rebookingRate: 0.03},
] as const;

/** Provider-side commission by plan */
const PROVIDER_COMMISSION_BASIC = 0.05;     // was 0.03
const PROVIDER_COMMISSION_PRO = 0.03;       // was 0.015
const PROVIDER_COMMISSION_PREMIUM = 0.015;  // unchanged

/** Discounted provider commission for repeat bookings */
const REBOOKING_COMMISSION_BASIC = 0.03;    // was 0.015
const REBOOKING_COMMISSION_PRO = 0.015;     // was 0.0075
const REBOOKING_COMMISSION_PREMIUM = 0.0075;

/** @deprecated Use CUSTOMER_FEE_TIERS. Kept for type compatibility. */
export const PLATFORM_FEE_THRESHOLD = 50;
/** @deprecated Use CUSTOMER_FEE_TIERS. */
const CUSTOMER_SERVICE_FEE = 0.05;
/** @deprecated Use CUSTOMER_FEE_TIERS. */
const REBOOKING_CUSTOMER_FEE = 0.03;

function getCustomerFeeRate(subtotalEur: number, isRebooking: boolean): number {
  const tier = CUSTOMER_FEE_TIERS.find(t => subtotalEur >= t.min && subtotalEur <= t.max);
  if (!tier) return 0;
  return isRebooking ? tier.rebookingRate : tier.rate;
}

export type ProviderPlan = 'basic' | 'professional' | 'premium';

/** Look up a provider's active subscription plan. Returns 'basic' if no active subscription. */
export async function getProviderPlan(providerId: string): Promise<ProviderPlan> {
  const supabase = getSupabaseServiceClient();
  const {data} = await supabase
    .from('provider_subscriptions')
    .select('plan')
    .eq('provider_id', providerId)
    .eq('status', 'active')
    .order('created_at', {ascending: false})
    .limit(1)
    .maybeSingle();

  if (!data?.plan) return 'basic';
  const plan = data.plan as string;
  if (plan === 'professional' || plan === 'premium') return plan;
  return 'basic';
}

function getCommissionRates(plan: ProviderPlan, isRebooking: boolean) {
  const rates: Record<ProviderPlan, {normal: number; rebooking: number}> = {
    basic:        {normal: PROVIDER_COMMISSION_BASIC,   rebooking: REBOOKING_COMMISSION_BASIC},
    professional: {normal: PROVIDER_COMMISSION_PRO,     rebooking: REBOOKING_COMMISSION_PRO},
    premium:      {normal: PROVIDER_COMMISSION_PREMIUM, rebooking: REBOOKING_COMMISSION_PREMIUM},
  };
  const r = rates[plan];
  return {providerRate: isRebooking ? r.rebooking : r.normal};
}

/** Stripe processing cost estimate (for internal calculations only) */
export const STRIPE_PROCESSING_RATE = 0.0175;
export const STRIPE_FIXED_FEE = 0.25;
export const STRIPE_CONNECT_FEE = 0.0025;

export async function getRebookingInfo(
  customerId: string,
  providerId: string
): Promise<RebookingInfo> {
  const supabase = getSupabaseServiceClient();

  const {data} = await supabase
    .from('customer_provider_history')
    .select('jobs_completed,last_job_at,total_spent_cents,is_favorite')
    .eq('customer_id', customerId)
    .eq('provider_id', providerId)
    .maybeSingle();

  if (!data) {
    return {
      hasWorkedBefore: false,
      jobsCompleted: 0,
      totalSpent: 0,
      isFavorite: false,
      discountRate: CUSTOMER_SERVICE_FEE
    };
  }

  const jobsCompleted = Number(data.jobs_completed ?? 0);
  const totalSpent = Number(data.total_spent_cents ?? 0) / 100;

  return {
    hasWorkedBefore: jobsCompleted > 0,
    jobsCompleted,
    lastJobAt: data.last_job_at ?? undefined,
    totalSpent,
    isFavorite: Boolean(data.is_favorite),
    discountRate: jobsCompleted > 0 ? REBOOKING_CUSTOMER_FEE : CUSTOMER_SERVICE_FEE
  };
}

export async function calculateFees(
  priceCents: number,
  customerId: string,
  providerId: string
): Promise<FeeCalculation> {
  const [rebookingInfo, providerPlan] = await Promise.all([
    getRebookingInfo(customerId, providerId),
    getProviderPlan(providerId),
  ]);
  const subtotal = Math.max(priceCents, 0) / 100;
  const isRebooking = rebookingInfo.hasWorkedBefore;

  const customerFeeRate = getCustomerFeeRate(subtotal, isRebooking);
  const {providerRate} = getCommissionRates(providerPlan, isRebooking);

  const serviceFee = subtotal * customerFeeRate;
  const transactionFee = subtotal * providerRate;
  const total = subtotal + serviceFee;

  // Savings = difference between standard rate and rebooking rate for this tier
  const standardRate = getCustomerFeeRate(subtotal, false);
  const savings = isRebooking && standardRate > customerFeeRate
    ? subtotal * (standardRate - customerFeeRate)
    : undefined;

  return {
    subtotal,
    serviceFee,
    transactionFee,     // provider-side commission (deducted from payout)
    total,              // customer pays: subtotal + serviceFee
    savings,
    isRebooking,
  };
}

export async function updateCustomerProviderHistory(
  customerId: string,
  providerId: string,
  priceCents: number
): Promise<void> {
  const supabase = getSupabaseServiceClient();
  await supabase.rpc('increment_customer_history', {
    p_customer_id: customerId,
    p_provider_id: providerId,
    p_price_cents: Math.max(priceCents, 0)
  });
}
