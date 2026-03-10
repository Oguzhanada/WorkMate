import {getSupabaseServiceClient} from '@/lib/supabase/service';
import type {FeeCalculation, RebookingInfo} from '@/lib/types/airtasker';

/* ─── Fee constants ─── */

/** Minimum job value for platform fees to apply (in euros) */
export const PLATFORM_FEE_THRESHOLD = 100;

/** Customer-side service fee (% of subtotal) */
const CUSTOMER_SERVICE_FEE = 0.05;

/** Provider-side commission by plan: basic/none = 3%, professional/premium = 1.5% */
const PROVIDER_COMMISSION_BASIC = 0.03;
const PROVIDER_COMMISSION_PRO = 0.015;

/** Discounted customer fee for repeat bookings */
const REBOOKING_CUSTOMER_FEE = 0.03;

/** Discounted provider commission for repeat bookings (applied on top of plan rate) */
const REBOOKING_COMMISSION_BASIC = 0.015;
const REBOOKING_COMMISSION_PRO = 0.0075;

type ProviderPlan = 'basic' | 'professional' | 'premium';

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
  const isPro = plan === 'professional' || plan === 'premium';
  return {
    providerRate: isRebooking
      ? (isPro ? REBOOKING_COMMISSION_PRO : REBOOKING_COMMISSION_BASIC)
      : (isPro ? PROVIDER_COMMISSION_PRO : PROVIDER_COMMISSION_BASIC),
  };
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

  // Under threshold: no platform fees — customer pays exact amount, provider receives full amount
  if (subtotal < PLATFORM_FEE_THRESHOLD) {
    return {
      subtotal,
      serviceFee: 0,
      transactionFee: 0,
      total: subtotal,
      savings: undefined,
      isRebooking: rebookingInfo.hasWorkedBefore
    };
  }

  const customerFeeRate = rebookingInfo.hasWorkedBefore
    ? REBOOKING_CUSTOMER_FEE
    : CUSTOMER_SERVICE_FEE;

  const {providerRate} = getCommissionRates(providerPlan, rebookingInfo.hasWorkedBefore);

  const serviceFee = subtotal * customerFeeRate;
  const transactionFee = subtotal * providerRate;
  const total = subtotal + serviceFee;
  const savings = rebookingInfo.hasWorkedBefore
    ? subtotal * (CUSTOMER_SERVICE_FEE - REBOOKING_CUSTOMER_FEE)
    : undefined;

  return {
    subtotal,
    serviceFee,
    transactionFee,     // provider-side commission (deducted from payout)
    total,              // customer pays: subtotal + serviceFee
    savings,
    isRebooking: rebookingInfo.hasWorkedBefore
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
