import {getSupabaseServiceClient} from '@/lib/supabase/service';
import type {FeeCalculation, RebookingInfo} from '@/lib/types/airtasker';

const STANDARD_SERVICE_FEE = 0.1;
const REBOOKING_FEE = 0.019;
const TRANSACTION_FEE = 0.019;

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
      discountRate: STANDARD_SERVICE_FEE
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
    discountRate: jobsCompleted > 0 ? REBOOKING_FEE : STANDARD_SERVICE_FEE
  };
}

export async function calculateFees(
  priceCents: number,
  customerId: string,
  providerId: string
): Promise<FeeCalculation> {
  const rebookingInfo = await getRebookingInfo(customerId, providerId);
  const subtotal = Math.max(priceCents, 0) / 100;

  const serviceFee = rebookingInfo.hasWorkedBefore ? 0 : subtotal * STANDARD_SERVICE_FEE;
  const transactionFee = subtotal * TRANSACTION_FEE;
  const total = subtotal + serviceFee + transactionFee;
  const savings = rebookingInfo.hasWorkedBefore ? subtotal * STANDARD_SERVICE_FEE : undefined;

  return {
    subtotal,
    serviceFee,
    transactionFee,
    total,
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
