// ── AI model configuration ────────────────────────────────────────────────────
// All model IDs come from here. Never hardcode model strings in route handlers.
//
// Provider: Groq (free tier, OpenAI-compatible)
// Models: https://console.groq.com/docs/models
//
// To override at runtime, set the corresponding env var in Vercel:
//   AI_MODEL_JOB_DESC=llama-3.3-70b-versatile   (higher quality)
//   AI_MODEL_ALERTS=llama-3.1-8b-instant         (faster, cost-sensitive)

export const AI_MODELS = {
  /** Job description writer */
  JOB_DESCRIPTION:
    process.env.AI_MODEL_JOB_DESC ?? 'llama-3.3-70b-versatile',

  /** Alert keyword suggestions */
  SUGGEST_ALERTS:
    process.env.AI_MODEL_ALERTS ?? 'llama-3.1-8b-instant',
} as const;

export type AIModelKey = keyof typeof AI_MODELS;
