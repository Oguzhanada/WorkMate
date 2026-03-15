# WorkMate Shared Guardrails

> Cross-cutting rules enforced by all WorkMate skills.
> Source of truth: `ai-context/context/agents.md` sections 2-3 and frozen decisions FD-01-FD-33.

---

## 1. Ireland-First Product Rules

- English only in all UI strings, docs, error messages, and policy text.
- EUR is the sole currency. Store and pass money as integer cents (`*_amount_cents`) (FD-09).
- Validate Eircode in all job-posting and address flows.
- Normalise Irish phone numbers to `+353XXXXXXXXX`; valid prefixes: 83, 85, 86, 87, 89.
- Do not accept generic EU/UK postal or phone formats as Irish-valid.
- Product scope: 26 counties of the Republic of Ireland.
- Legal/compliance context is Irish — reference DPC, Revenue, Irish consumer guidance.
- Use PPSN (not generic "tax ID") in Irish tax contexts.

---

## 2. Security Baseline

- **RLS is sacred** — every table must have RLS enabled with explicit policies. Never `FOR ALL USING (true)` (FD-10).
- **No PII in logs** — never log API keys, secrets, payment data, or personal identifiers.
- **Auth on every route** — verify role server-side on every sensitive operation (admin, verified_pro, customer).
- **Webhook validation** — HMAC-SHA256 via `X-WorkMate-Signature`; secrets encrypted at rest with AES-256-GCM (FD-12).
- **TypeScript `strict: true`** — permanently enabled, never disable or override (FD-31).
- **CSP `strict-dynamic`** — no `unsafe-eval` in any CSP directive (FD-30).
- **XSS prevention** — never render raw user-supplied HTML.

---

## 3. Supabase Client Discipline

Use the correct client per context — no exceptions (FD-08):

| Context | Client | Rule |
|---------|--------|------|
| Browser (`'use client'`) | `getSupabaseBrowserClient()` | Singleton; call inside `useEffect`/async, never at module scope |
| Server component / page | `getSupabaseServerClient()` | Per-request; never cached or module-scope |
| Route handler | `getSupabaseRouteClient()` | Per-request |
| Service role (RLS bypass) | `getSupabaseServiceClient()` | Restricted — see below |

**Service role is allowed only in:**
1. Admin routes behind `ensureAdminRoute()`
2. Webhook handlers after signature verification
3. System-level background tasks (notifications, audit, idempotency)
4. Public API v1 routes behind `authenticatePublicRequest()`
5. Read-only public endpoints returning non-sensitive fields only

---

## 4. Code Quality

- **Zod validation** on all API inputs — schemas in `lib/validation/<domain>.ts`, never inline in route files (FD-01, DR-010).
- `z.record()` requires two arguments in Zod 4: `z.record(z.string(), z.string())`.
- **Error responses** via `lib/api/error-response.ts` helpers — no raw `NextResponse.json` for errors (FD-27).
- **Pre-commit hooks** (Husky + lint-staged) must not be bypassed with `--no-verify` (FD-22).
- Run `npm run lint` and `npm run test` before every commit.
- Colors via `--wm-*` CSS tokens only — no hardcoded hex in page/feature code (FD-03).
- `<Button>` wrapper always — no raw `<button className="bg-...">` in pages (FD-04).

---

## 5. Process Rules

- **No report files** — never create `*REPORT*.md`, `*COMPLETION*.md`, `*GUIDE*.md`, `*AUDIT*.md` in `docs/` or repo root (FD-24).
- **Migrations additive only** — never rewrite or renumber existing migration files (FD-10).
- **No premature deletion** of "dead" code — verify it is not pre-built infrastructure awaiting integration before removing (FD-29).
- **Feature branches required** — AI agents must not commit directly to `main` unless explicitly instructed.
- **File deletion protocol** — read the file, check frozen decisions, check git history, and ask the user before deleting.
- **Locale routing** — never hardcode `/en/` in hrefs, redirects, or `router.push`; use `lib/i18n/locale-path` helpers (FD-11).

---

## 6. Quick Reference — Key Paths

| What | Where |
|------|-------|
| Ireland logic | `lib/ireland/` (eircode, phone, coordinates, locations) |
| Zod schemas | `lib/validation/<domain>.ts` |
| Error helpers | `lib/api/error-response.ts` |
| Supabase clients | `lib/supabase/{client,server,route,service}.ts` |
| Webhook delivery | `lib/webhook/send.ts` |
| Public API auth | `lib/api/public-auth.ts` |
| Design tokens | `app/tokens.css` (`--wm-*` families) |
| Migrations | `migrations/` (check highest number before creating) |
