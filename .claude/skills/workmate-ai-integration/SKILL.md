---
name: workmate-ai-integration
description: WorkMate AI integration guardrails — model config, prompt sanitization, cost guards, rate limiting, and output validation patterns for all AI (Groq) API routes. Use when creating, reviewing, or debugging any file under app/api/ai/ or lib/ai/.
metadata:
  severity: standard
  last_synced: 2026-03-13
  synced_with: FD-01, FD-27, DR-010
---

# WorkMate AI Integration

Activate this skill when touching `app/api/ai/**` or `lib/ai/**`.

## Pre-Change Checklist

Before writing or changing any AI route, verify all items:

- [ ] `liveServices.ai` guard present (returns 503 if disabled)
- [ ] `withRateLimit(RATE_LIMITS.AI_ENDPOINT, handler)` wrapping the export
- [ ] All user-supplied strings sanitized with `sanitizeForPrompt()` or `sanitizeListForPrompt()`
- [ ] Model ID from `AI_MODELS` config — never hardcoded string
- [ ] `max_tokens` set to a reasonable ceiling for the use case
- [ ] AI output validated before use (non-empty check, JSON parse guard)
- [ ] Errors handled gracefully — `apiServerError()`, not a bare throw
- [ ] Auth + RBAC checked before AI call (never allow anonymous AI calls)

## Key Files

| File | Purpose |
|------|---------|
| `lib/ai/config.ts` | Model IDs — override via `AI_MODEL_JOB_DESC`, `AI_MODEL_ALERTS` env vars |
| `lib/ai/groq.ts` | `groqGenerate()` — Groq API via native fetch (OpenAI-compatible) |
| `lib/ai/sanitize.ts` | `sanitizeForPrompt(str, maxLen)` + `sanitizeListForPrompt(arr)` |
| `lib/live-services.ts` | `liveServices.ai` — false in dev unless `AI_CALLS_ENABLED=true` |
| `lib/rate-limit/middleware.ts` | `withRateLimit(RATE_LIMITS.AI_ENDPOINT, handler)` |

## Canonical Route Pattern

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { AI_MODELS } from '@/lib/ai/config';
import { groqGenerate } from '@/lib/ai/groq';
import { sanitizeForPrompt } from '@/lib/ai/sanitize';
import { liveServices } from '@/lib/live-services';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit/middleware';
import { apiError, apiUnauthorized, apiServerError } from '@/lib/api/error-response';

async function handler(request: NextRequest): Promise<NextResponse> {
  // 1. Cost guard
  if (!liveServices.ai) return apiError('AI endpoints disabled. Set LIVE_SERVICES_ENABLED=true to enable.', 503);

  // 2. Auth
  const supabase = await getSupabaseRouteClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return apiUnauthorized();

  // 3. Validate input
  let rawBody: unknown;
  try { rawBody = await request.json(); } catch { return apiError('Invalid JSON body', 400); }
  const parsed = mySchema.safeParse(rawBody);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Invalid', 400);

  // 4. Sanitize for prompt
  const safeInput = sanitizeForPrompt(parsed.data.userText, 500);

  // 5. Call Groq
  try {
    const text = await groqGenerate({
      model: AI_MODELS.JOB_DESCRIPTION,   // ← from config, never hardcoded
      max_tokens: 300,
      messages: [{ role: 'user', content: `... ${safeInput}` }],
    });

    if (!text) return apiServerError('No output generated');

    return NextResponse.json({ result: text });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI generation failed';
    return apiServerError(message);
  }
}

export const POST = withRateLimit(RATE_LIMITS.AI_ENDPOINT, handler);
```

## NEVER DO

| Anti-pattern | Why |
|-------------|-----|
| `model: 'llama-3.3-70b-versatile'` hardcoded in route | Breaks on model deprecation — use `AI_MODELS.*` |
| `content: \`... ${userInput}\`` without sanitize | Prompt injection risk |
| AI call without `liveServices.ai` guard | Accidental cost in dev/staging |
| Anonymous AI call (no auth check) | Abuse vector |
| Treating AI output as trusted data | LLM can hallucinate — always validate |
| Catching error silently without `apiServerError()` | Swallows errors, debug nightmare |

## Cost Controls

- Rate limit: `AI_ENDPOINT` = 5 req/min per user/IP
- Dev cost: `AI_CALLS_ENABLED=true` required (never on by default)
- Provider: Groq (free tier, OpenAI-compatible) — requires `GROQ_API_KEY` env var

## Prompt Safety Levels

| Input type | Sanitize function | Max length |
|-----------|-------------------|-----------|
| Short labels (category, urgency) | `sanitizeForPrompt(str, 100)` | 100 chars |
| Medium fields (title, scope) | `sanitizeForPrompt(str, 300)` | 300 chars |
| Long text (description) | `sanitizeForPrompt(str, 500)` | 500 chars |
| List of items | `sanitizeListForPrompt(arr, 80)` | 80 chars/item |

## Adding a New AI Route

1. Create `app/api/ai/<feature>/route.ts`
2. Follow the canonical pattern above
3. Add model key to `lib/ai/config.ts` if a new use case
4. Add Zod schema to `lib/validation/<domain>.ts` (DR-010 — `api.ts` is barrel only)
5. Test with `AI_CALLS_ENABLED=true` and `GROQ_API_KEY` set in `.env.local`
6. Confirm `max_tokens` is appropriate (8b-instant is fast; use 70b-versatile for quality-critical tasks)
