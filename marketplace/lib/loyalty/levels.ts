/**
 * Loyalty Level System
 *
 * Customer levels: bronze → silver → gold → platinum
 * Provider levels: starter → trusted → expert → elite
 *
 * Levels are updated by a nightly cron job based on:
 * - Number of completed jobs
 * - Average rating
 */

export type CustomerLoyaltyLevel = 'bronze' | 'silver' | 'gold' | 'platinum';
export type ProviderLoyaltyLevel = 'starter' | 'trusted' | 'expert' | 'elite';
export type LoyaltyLevel = CustomerLoyaltyLevel | ProviderLoyaltyLevel;

/** Customer level thresholds */
const CUSTOMER_TIERS: Array<{
  level: CustomerLoyaltyLevel;
  minJobs: number;
  minRating: number;
}> = [
  { level: 'platinum', minJobs: 30, minRating: 4.0 },
  { level: 'gold',     minJobs: 15, minRating: 4.0 },
  { level: 'silver',   minJobs: 5,  minRating: 4.0 },
  { level: 'bronze',   minJobs: 0,  minRating: 0 },
];

/** Provider level thresholds */
const PROVIDER_TIERS: Array<{
  level: ProviderLoyaltyLevel;
  minJobs: number;
  minRating: number;
}> = [
  { level: 'elite',   minJobs: 50, minRating: 4.8 },
  { level: 'expert',  minJobs: 25, minRating: 4.5 },
  { level: 'trusted', minJobs: 5,  minRating: 4.0 },
  { level: 'starter', minJobs: 0,  minRating: 0 },
];

export function computeCustomerLevel(
  jobsCompleted: number,
  avgRating: number
): CustomerLoyaltyLevel {
  for (const tier of CUSTOMER_TIERS) {
    if (jobsCompleted >= tier.minJobs && avgRating >= tier.minRating) {
      return tier.level;
    }
  }
  return 'bronze';
}

export function computeProviderLevel(
  jobsCompleted: number,
  avgRating: number
): ProviderLoyaltyLevel {
  for (const tier of PROVIDER_TIERS) {
    if (jobsCompleted >= tier.minJobs && avgRating >= tier.minRating) {
      return tier.level;
    }
  }
  return 'starter';
}

/** Human-readable perks for display */
export const CUSTOMER_LEVEL_PERKS: Record<CustomerLoyaltyLevel, string> = {
  bronze:   'Access to all providers',
  silver:   '1% service fee discount',
  gold:     '2% service fee discount + priority support',
  platinum: '3% service fee discount + exclusive badge',
};

export const PROVIDER_LEVEL_PERKS: Record<ProviderLoyaltyLevel, string> = {
  starter: 'Standard listing',
  trusted: '"Trusted Pro" badge + ranking boost',
  expert:  'Expert badge + ranking bonus +5',
  elite:   'Elite badge + featured profile slot',
};

export const PROVIDER_LEVEL_RANKING_BONUS: Record<ProviderLoyaltyLevel, number> = {
  starter: 0,
  trusted: 2,
  expert:  5,
  elite:   10,
};
