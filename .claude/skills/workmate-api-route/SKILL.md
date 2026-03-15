---
name: workmate-api-route
description: Activate when creating, reviewing, or modifying any file under app/api/. Enforces Supabase client selection, Zod validation, RBAC checks, error handling, and webhook patterns.
metadata:
  severity: critical
  status: active
  synced_with: agents.md section 6
---

# WorkMate API Route Pattern

## File Location

```
app/api/<resource>/route.ts           # collection: GET, POST
app/api/<resource>/[id]/route.ts      # item: GET, PATCH, DELETE
```

## Route Structure

Every route handler must follow this order:

```typescript
// 1. Auth — always first
const supabase = getSupabaseRouteClient();
const { data: { user }, error: authError } = await supabase.auth.getUser();
if (!user || authError) return apiUnauthorized();

// 2. RBAC — when role-restricted
const roles = await getUserRoles(supabase, user.id);
if (!roles.includes('verified_pro')) return apiForbidden();

// 3. Validate — Zod schema from lib/validation/<domain>.ts
const parsed = MySchema.safeParse(await req.json());
if (!parsed.success) return apiValidationError(parsed.error.issues);

// 4. DB operation
const { data, error } = await supabase.from('table').insert({...}).select().single();
if (error) return apiServerError(error.message);

// 5. Webhook — fire AFTER successful DB op only
await sendWebhook(user.id, 'resource.created', data);

// 6. Return
return NextResponse.json(data, { status: 201 });
```

Explicit return type annotations required on all exported functions (FD-31):
`export async function POST(req: NextRequest): Promise<NextResponse>`

## Zod Schema Rules (DR-010)

- Define schemas in `lib/validation/<domain>.ts` (e.g., `jobs.ts`, `auth.ts`, `quotes.ts`).
- `lib/validation/api.ts` is a re-export barrel only — never add definitions there.
- Use `z.record(z.string(), z.string())` — single-arg `z.record()` errors in Zod 4.
- Money fields: always `_amount_cents` as `z.number().int().positive()`.

## Supabase Client Selection

Read `lib/supabase/` directory — each file documents its use case in header comments.

**Service role restrictions (FD-08):** `getSupabaseServiceClient()` bypasses RLS. Only use in: admin routes behind `ensureAdminRoute()`, webhook handlers after signature verification, system background tasks, public API v1 routes behind `authenticatePublicRequest()`, read-only public endpoints with non-sensitive fields. Log all service-role operations via `lib/logger.ts` with `requestId`.

## RBAC Helpers

Read `lib/auth/rbac.ts` for available functions.

## Error Responses (FD-27)

Use helpers from `lib/api/error-response.ts` — never raw `NextResponse.json` for errors.

| Status | When |
|--------|------|
| 400 | Validation failed |
| 401 | Not authenticated |
| 403 | Authenticated but wrong role |
| 404 | Resource not found |
| 409 | Conflict (duplicate, state mismatch) |
| 500 | DB or internal error |

## Webhooks

Fire `sendWebhook()` from `lib/webhook/send.ts` after successful state changes only. Delivery is HTTPS-only, HMAC-SHA256 signed via `X-WorkMate-Signature`.

## NEVER DO

- Never define Zod schemas inline in route files — use `lib/validation/<domain>.ts`
- Never use a module-scope Supabase singleton — never re-create `lib/supabase.ts`
- Never return raw `NextResponse.json` for errors — use `lib/api/error-response.ts` helpers
- Never mix Supabase client types within a single handler
- Never fire webhooks before the DB operation succeeds

## Checklist Before Committing

- [ ] `getSupabaseRouteClient()` used (not browser or server client)
- [ ] `auth.getUser()` called and user checked
- [ ] Role checked if route is role-restricted
- [ ] Zod schema validates all input fields
- [ ] Money fields use `_amount_cents` (integer)
- [ ] Error responses use helpers from `lib/api/error-response.ts`
- [ ] Webhook fired only after successful state change
- [ ] No raw user data passed to HTML (XSS prevention)
- [ ] Explicit return type annotations on all exported functions (FD-31)
