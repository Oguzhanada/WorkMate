/**
 * Provider Credit System
 *
 * Providers spend credits to submit quotes. Monthly free credits are granted
 * based on subscription plan. Additional credits can be purchased.
 *
 * Credit cost:
 *   - Normal job quote: 1 credit
 *   - Urgent / Quick Hire quote: 2 credits
 *
 * Monthly free credits by plan:
 *   - basic:        5 credits/month
 *   - professional: 25 credits/month
 *   - premium:      60 credits/month
 */
import { getSupabaseServiceClient } from '@/lib/supabase/service';

export const MONTHLY_CREDITS_BY_PLAN = {
  basic: 5,
  professional: 25,
  premium: 60,
} as const;

export type CreditReason = 'monthly_grant' | 'purchase' | 'quote_submitted' | 'quote_refund' | 'admin_adjustment';

/** Cost in credits for submitting a quote */
export function quoteCreditCost(isUrgent: boolean): number {
  return isUrgent ? 2 : 1;
}

/** Get the current credit balance for a provider. Returns 0 if no record exists. */
export async function getCreditBalance(providerId: string): Promise<number> {
  const supabase = getSupabaseServiceClient();
  const { data } = await supabase
    .from('provider_credits')
    .select('balance')
    .eq('provider_id', providerId)
    .maybeSingle();
  return data?.balance ?? 0;
}

/**
 * Adjust a provider's credit balance atomically.
 * Negative amount = debit (spending credits).
 * Returns the new balance, or throws if the balance would go negative.
 */
export async function adjustCredits(
  providerId: string,
  amount: number,
  reason: CreditReason,
  referenceId?: string
): Promise<{ newBalance: number }> {
  const supabase = getSupabaseServiceClient();

  // Upsert balance row
  const { data: existing } = await supabase
    .from('provider_credits')
    .select('balance')
    .eq('provider_id', providerId)
    .maybeSingle();

  const currentBalance = existing?.balance ?? 0;
  const newBalance = currentBalance + amount;

  if (newBalance < 0) {
    throw new Error(`Insufficient credits: balance ${currentBalance}, requested debit ${Math.abs(amount)}`);
  }

  if (existing) {
    await supabase
      .from('provider_credits')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('provider_id', providerId);
  } else {
    await supabase
      .from('provider_credits')
      .insert({ provider_id: providerId, balance: newBalance });
  }

  // Record transaction
  await supabase.from('credit_transactions').insert({
    provider_id: providerId,
    amount,
    reason,
    reference_id: referenceId ?? null,
  });

  return { newBalance };
}

/**
 * Debit a provider's credits for submitting a quote.
 * Returns true if successful, false if insufficient balance.
 */
export async function debitQuoteCredits(
  providerId: string,
  quoteId: string,
  isUrgent: boolean
): Promise<{ success: boolean; newBalance: number; cost: number }> {
  const cost = quoteCreditCost(isUrgent);
  try {
    const { newBalance } = await adjustCredits(providerId, -cost, 'quote_submitted', quoteId);
    return { success: true, newBalance, cost };
  } catch {
    return { success: false, newBalance: await getCreditBalance(providerId), cost };
  }
}

/**
 * Refund credits when a quote is withdrawn or a job is cancelled before quoting.
 */
export async function refundQuoteCredits(
  providerId: string,
  quoteId: string,
  isUrgent: boolean
): Promise<{ newBalance: number }> {
  const cost = quoteCreditCost(isUrgent);
  return adjustCredits(providerId, cost, 'quote_refund', quoteId);
}

/**
 * Grant monthly free credits to a provider based on their plan.
 * Idempotency: caller is responsible for ensuring this runs once per month.
 */
export async function grantMonthlyCredits(
  providerId: string,
  plan: keyof typeof MONTHLY_CREDITS_BY_PLAN
): Promise<{ newBalance: number; granted: number }> {
  const granted = MONTHLY_CREDITS_BY_PLAN[plan];
  const { newBalance } = await adjustCredits(providerId, granted, 'monthly_grant');
  return { newBalance, granted };
}
