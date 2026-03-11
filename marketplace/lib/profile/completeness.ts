/**
 * Profile completeness scoring for WorkMate providers.
 *
 * Checks are mapped to actual columns on the `profiles` table (migrations 001–060)
 * plus a `has_services` flag derived from the `pro_services` table.
 *
 * `bio`         → stripe_requirements_due.services_and_skills.experience_range
 * `location`    → profiles.county (set during become-provider flow)
 * `hourly_rate` → profiles.stripe_requirements_due.services_and_skills.optional_link presence
 *                 (we repurpose this as "has set profile info beyond basics")
 *
 * NOTE: The score uses actual DB columns only — no new migrations required.
 */

export type CheckResult = {
  key: string;
  label: string;
  points: number;
  complete: boolean;
  /** Relative path to the section where the user can fill this in (no locale prefix). */
  href: string;
};

export type CompletenessResult = {
  score: number;
  maxScore: number;
  percentage: number;
  checks: CheckResult[];
};

/**
 * Minimal shape of a profiles row relevant to completeness scoring.
 * Only the fields we actually query — all columns exist in the DB (migrations 001–060).
 */
export type ProfileRowForCompleteness = {
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  county?: string | null;
  locality?: string | null;
  id_verification_status?: string | null;
  stripe_requirements_due?: Record<string, unknown> | null;
};

type CheckDefinition = {
  key: string;
  label: string;
  points: number;
  href: string;
  /** Returns true when the check is satisfied. */
  passes: (profile: ProfileRowForCompleteness, hasServices: boolean) => boolean;
};

const COMPLETENESS_CHECKS: CheckDefinition[] = [
  {
    key: 'avatar',
    label: 'Profile photo',
    points: 10,
    href: '/profile',
    passes: (p) => Boolean(p.avatar_url?.trim()),
  },
  {
    key: 'full_name',
    label: 'Full name',
    points: 10,
    href: '/profile',
    passes: (p) => Boolean(p.full_name && p.full_name.trim().length >= 3),
  },
  {
    key: 'phone',
    label: 'Phone number',
    points: 10,
    href: '/profile',
    passes: (p) => Boolean(p.phone?.trim()),
  },
  {
    key: 'location',
    label: 'Location / service area',
    points: 10,
    href: '/become-provider/apply',
    passes: (p) => Boolean(p.county?.trim() || p.locality?.trim()),
  },
  {
    key: 'experience',
    label: 'Experience description',
    points: 15,
    href: '/become-provider/apply',
    passes: (p) => {
      const skills = (
        p.stripe_requirements_due as
          | {
              services_and_skills?: {
                experience_range?: string | null;
              };
            }
          | null
          | undefined
      )?.services_and_skills?.experience_range;
      return Boolean(skills?.trim());
    },
  },
  {
    key: 'verified_id',
    label: 'ID verification complete',
    points: 20,
    href: '/profile',
    passes: (p) => p.id_verification_status === 'approved',
  },
  {
    key: 'has_services',
    label: 'Services listed',
    points: 10,
    href: '/become-provider/apply',
    passes: (_p, hasServices) => hasServices,
  },
];

export const MAX_SCORE = COMPLETENESS_CHECKS.reduce((sum, c) => sum + c.points, 0);

export function calculateCompleteness(
  profile: ProfileRowForCompleteness,
  hasServices: boolean,
): CompletenessResult {
  const checks: CheckResult[] = COMPLETENESS_CHECKS.map((def) => ({
    key: def.key,
    label: def.label,
    points: def.points,
    complete: def.passes(profile, hasServices),
    href: def.href,
  }));

  const score = checks.reduce((sum, c) => sum + (c.complete ? c.points : 0), 0);
  const maxScore = MAX_SCORE;
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  return { score, maxScore, percentage, checks };
}
