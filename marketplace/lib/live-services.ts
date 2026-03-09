/**
 * LIVE SERVICES MASTER SWITCH
 * ─────────────────────────────────────────────────────────────
 * Controls all paid/external service calls that cost money.
 *
 * HOW TO USE:
 *   Development (default) → all live services BLOCKED, free to run locally
 *   Production            → set LIVE_SERVICES_ENABLED=true in env vars
 *
 * TO ENABLE A SPECIFIC SERVICE IN DEV (for isolated testing):
 *   EMAIL_SEND_ENABLED=true    → Resend email
 *   AI_CALLS_ENABLED=true      → Anthropic AI
 *
 * PRODUCTION CHECKLIST:
 *   ✅ Set LIVE_SERVICES_ENABLED=true in Vercel / production env
 *   ✅ Verify STRIPE_SECRET_KEY is the live key (sk_live_...)
 *   ✅ Verify RESEND_API_KEY is the production key
 *   ✅ Verify ANTHROPIC_API_KEY is the production key
 * ─────────────────────────────────────────────────────────────
 */

const LIVE_ENABLED =
  process.env.LIVE_SERVICES_ENABLED === 'true' ||
  process.env.NODE_ENV === 'production';

export const liveServices = {
  /** Resend — transactional email. Costs per email sent. */
  email: LIVE_ENABLED || process.env.EMAIL_SEND_ENABLED === 'true',

  /** Anthropic — AI job description + alert suggestions. Costs per token. */
  ai: LIVE_ENABLED || process.env.AI_CALLS_ENABLED === 'true',

  /** Loqate — address lookup. Costs per lookup. */
  addressLookup: LIVE_ENABLED || process.env.ADDRESS_LOOKUP_ENABLED === 'true',
} as const;
