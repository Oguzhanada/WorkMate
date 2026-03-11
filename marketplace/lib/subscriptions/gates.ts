/**
 * Subscription Feature Gates
 *
 * Central source of truth for which features are available on each provider plan.
 * Use `hasFeature(providerId, featureName)` in API routes and server components.
 *
 * Plans: 'basic' (free) | 'professional' (€9.99/mo) | 'premium' (€24.99/mo)
 */
import { getProviderPlan, type ProviderPlan } from '@/lib/pricing/fee-calculator';

/** All gated features and the minimum plan required to access them */
export const FEATURE_PLAN_MAP = {
  // Available to all plans
  basic_listing: 'basic',
  quote_submission: 'basic',
  task_alerts: 'basic',

  // Professional+ features
  pro_verified_badge: 'professional',
  availability_calendar: 'professional',
  advanced_analytics: 'professional',
  direct_job_invites: 'professional',
  ranking_bonus: 'professional',

  // Premium-only features
  custom_profile_url: 'premium',
  priority_support: 'premium',
  featured_profile: 'premium',
} as const;

export type FeatureName = keyof typeof FEATURE_PLAN_MAP;

const PLAN_TIER: Record<ProviderPlan, number> = {
  basic: 0,
  professional: 1,
  premium: 2,
};

/** Returns true if the given plan has access to the feature */
export function planHasFeature(plan: ProviderPlan, feature: FeatureName): boolean {
  const requiredPlan = FEATURE_PLAN_MAP[feature] as ProviderPlan;
  return PLAN_TIER[plan] >= PLAN_TIER[requiredPlan];
}

/**
 * Check if a provider has access to a feature by their provider ID.
 * Fetches their active plan from the database.
 *
 * @example
 * const canUseCalendar = await hasFeature(providerId, 'availability_calendar');
 */
export async function hasFeature(providerId: string, feature: FeatureName): Promise<boolean> {
  const plan = await getProviderPlan(providerId);
  return planHasFeature(plan, feature);
}

/**
 * Returns all features available for a given plan.
 * Useful for displaying feature comparison tables.
 */
export function getFeaturesForPlan(plan: ProviderPlan): FeatureName[] {
  return (Object.keys(FEATURE_PLAN_MAP) as FeatureName[]).filter((f) =>
    planHasFeature(plan, f)
  );
}

/** Ranking score bonus by plan (added to provider's base ranking score) */
export const RANKING_BONUS_BY_PLAN: Record<ProviderPlan, number> = {
  basic: 0,
  professional: 10,
  premium: 20,
};
