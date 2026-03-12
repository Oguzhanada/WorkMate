// ── AI model configuration ────────────────────────────────────────────────────
// All model IDs come from here. Never hardcode model strings in route handlers.
//
// To override at runtime, set the corresponding env var in Vercel:
//   AI_MODEL_JOB_DESC=claude-sonnet-4-6  (for higher quality job descriptions)
//   AI_MODEL_ALERTS=claude-haiku-4-5-20251001  (cost-sensitive, keep haiku)

export const AI_MODELS = {
  /** Job description writer — cost-sensitive, haiku default */
  JOB_DESCRIPTION:
    process.env.AI_MODEL_JOB_DESC ?? 'claude-haiku-4-5-20251001',

  /** Alert keyword suggestions — cost-sensitive, haiku default */
  SUGGEST_ALERTS:
    process.env.AI_MODEL_ALERTS ?? 'claude-haiku-4-5-20251001',
} as const;

export type AIModelKey = keyof typeof AI_MODELS;
