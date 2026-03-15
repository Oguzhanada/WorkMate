---
paths:
  - "marketplace/app/api/**/*.ts"
---

# API Route Standards

- Zod schemas in `lib/validation/<domain>.ts` — never inline in route files (FD-01)
- Supabase: `getSupabaseRouteClient()` per-request, never module-scope (FD-08)
- Service role restricted to: admin routes, webhook handlers, background tasks, public API v1 (FD-08)
- Error responses: `lib/api/error-response.ts` helpers only — no raw `NextResponse.json` for errors (FD-27)
- Money: `*_amount_cents`, EUR, integer (FD-09)
- TypeScript `strict: true` — explicit return types on all exported functions (FD-31)
- Rate limiting: `withRateLimit` or `withRequestId` wrapper on all routes
- CSP: no `unsafe-eval`, `strict-dynamic` required (FD-30)
- Canonical source: `ai-context/context/agents.md` section 6
