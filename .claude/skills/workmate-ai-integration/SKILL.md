---
name: workmate-ai-integration
description: Activate when creating, reviewing, or debugging any file under app/api/ai/ or lib/ai/. Enforces model config, prompt sanitization, cost guards, rate limiting, and output validation.
metadata:
  severity: standard
  status: active
  synced_with: agents.md section 6
---

# WorkMate AI Integration

## Pre-Change Checklist

Before writing or changing any AI route, verify:

- [ ] `liveServices.ai` guard present (returns 503 if disabled)
- [ ] Rate limit wrapper applied — read `lib/rate-limit/index.ts` for `RATE_LIMITS.AI_ENDPOINT` current config
- [ ] All user-supplied strings sanitized with `sanitizeForPrompt()` or `sanitizeListForPrompt()`
- [ ] Model ID from `lib/ai/config.ts` `AI_MODELS` — never hardcode model strings
- [ ] `max_tokens` set to a reasonable ceiling for the use case
- [ ] AI output validated before use (non-empty check, JSON parse guard)
- [ ] Errors handled with `apiServerError()` — not bare throws
- [ ] Auth + RBAC checked before AI call (never allow anonymous AI calls)

## Where to Look

- **Model IDs:** always from `lib/ai/config.ts` `AI_MODELS` — never hardcode model strings
- **Groq client:** `lib/ai/groq.ts` — `groqGenerate()` via native fetch (OpenAI-compatible)
- **Sanitization:** `lib/ai/sanitize.ts` — `sanitizeForPrompt(str, maxLen)` + `sanitizeListForPrompt(arr)`
- **Cost guard:** `lib/live-services.ts` — `liveServices.ai` (false in dev unless `AI_CALLS_ENABLED=true`)
- **Rate limiting:** `lib/rate-limit/middleware.ts` — `withRateLimit(RATE_LIMITS.AI_ENDPOINT, handler)`
- **Error helpers:** `lib/api/error-response.ts`

## Route Structure

Every AI route must follow this order:

1. Cost guard — `if (!liveServices.ai)` return 503
2. Auth — `getSupabaseRouteClient()` + `auth.getUser()`
3. Validate input — Zod schema from `lib/validation/<domain>.ts` (DR-010)
4. Sanitize user text — `sanitizeForPrompt()`
5. Call Groq — `groqGenerate()` with `AI_MODELS.*` config
6. Validate output — non-empty, parse if JSON
7. Return result

Wrap the export: `export const POST = withRateLimit(RATE_LIMITS.AI_ENDPOINT, handler);`

## NEVER DO

- Never hardcode model strings in routes — use `AI_MODELS.*` from config
- Never pass unsanitized user input into prompts — prompt injection risk
- Never call AI without `liveServices.ai` guard — accidental cost in dev/staging
- Never allow anonymous AI calls — abuse vector
- Never treat AI output as trusted data — always validate
- Never catch errors silently without `apiServerError()` — swallows debug info

## Prompt Safety Levels

| Input type | Sanitize function | Max length |
|-----------|-------------------|-----------|
| Short labels (category, urgency) | `sanitizeForPrompt(str, 100)` | 100 chars |
| Medium fields (title, scope) | `sanitizeForPrompt(str, 300)` | 300 chars |
| Long text (description) | `sanitizeForPrompt(str, 500)` | 500 chars |
| List of items | `sanitizeListForPrompt(arr, 80)` | 80 chars/item |

## Adding a New AI Route

1. Create `app/api/ai/<feature>/route.ts`
2. Follow the route structure above
3. Add model key to `lib/ai/config.ts` if a new use case
4. Add Zod schema to `lib/validation/<domain>.ts` (DR-010 — `api.ts` is barrel only)
5. Test with `AI_CALLS_ENABLED=true` and `GROQ_API_KEY` set in `.env.local`
