---
name: workmate-api-route
description: Standard pattern for writing new API route handlers in WorkMate. Use when creating or reviewing any file under app/api/. Enforces correct Supabase client selection, Zod validation, RBAC checks, error handling format, and webhook trigger pattern.
metadata:
  severity: critical
  status: active
  last_synced: 2026-03-14
  synced_with: FD-01, FD-08, FD-09, FD-12, FD-27, FD-31, DR-010
---

# WorkMate API Route Pattern

Every API route in `app/api/` must follow this exact structure.

## File Location

```
app/api/<resource>/route.ts           # collection: GET, POST
app/api/<resource>/[id]/route.ts      # item: GET, PATCH, DELETE
```

## Standard Route Template

> **FD-01 (DR-010):** Never define Zod schemas inline inside a route handler.
> Add schemas to the appropriate domain file under `lib/validation/<domain>.ts` (e.g., `jobs.ts`, `auth.ts`, `quotes.ts`). `api.ts` is a re-export barrel only — never add new schema definitions there.

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getUserRoles } from '@/lib/auth/rbac';
import { apiUnauthorized, apiForbidden, apiValidationError, apiServerError } from '@/lib/api/error-response';
// 1. Import schema from the shared validation file (never define inline)
import { CreateResourceSchema } from '@/lib/validation/jobs';

export async function POST(req: NextRequest) {
  const supabase = getSupabaseRouteClient();

  // 2. Auth check (always)
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) {
    return apiUnauthorized();
  }

  // 3. RBAC check (when role-restricted)
  const roles = await getUserRoles(supabase, user.id);
  if (!roles.includes('verified_pro')) {
    return apiForbidden();
  }

  // 4. Validate input using shared schema
  const body = await req.json();
  const parsed = CreateResourceSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues);
  }

  // 5. DB operation
  const { data, error } = await supabase
    .from('table_name')
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single();

  if (error) {
    return apiServerError(error.message);
  }

  // 6. Webhook trigger (when applicable)
  // import { sendWebhook } from '@/lib/webhook/send';
  // await sendWebhook(user.id, 'resource.created', data);

  return NextResponse.json(data, { status: 201 });
}
```

### Adding a new schema

Add your schema to the appropriate domain file under `lib/validation/` (DR-010):

```typescript
// lib/validation/jobs.ts  ← domain file, NOT api.ts
export const CreateResourceSchema = z.object({
  field: z.string().min(1),
  amount_cents: z.number().int().positive(), // money always in cents
});
```

Then re-export from `lib/validation/api.ts` (barrel only):

```typescript
// lib/validation/api.ts  ← re-export barrel, never define schemas here
export { CreateResourceSchema } from './jobs';
```

Never add schemas in the route file itself.

## Supabase Client — Which to Use

| Context | Import |
|---|---|
| API route handler | `getSupabaseRouteClient()` from `lib/supabase/route.ts` |
| Server component/page | `getSupabaseServerClient()` from `lib/supabase/server.ts` |
| Client component | `getSupabaseBrowserClient()` from `lib/supabase/client.ts` |
| Admin bypass (service role) | `getSupabaseServiceClient()` from `lib/supabase/service.ts` |

**Service role restrictions (FD-08):** `getSupabaseServiceClient()` bypasses RLS entirely. It is ONLY acceptable in: (a) admin routes behind `ensureAdminRoute()`, (b) webhook handlers after signature verification, (c) system-level background tasks (notifications, audit, idempotency), (d) public API v1 routes behind `authenticatePublicRequest()`, (e) read-only public endpoints returning only non-sensitive fields. For all standard user-facing routes, use `getSupabaseRouteClient()`.

When using service role, log the operation via `lib/logger.ts` with `requestId` for audit trail.

Never use a module-scope singleton. Never re-create `lib/supabase.ts`.

## RBAC Helpers

```typescript
import { getUserRoles, canAccessAdmin, canQuote } from '@/lib/auth/rbac';

const roles = await getUserRoles(supabase, user.id);
// roles: ('customer' | 'verified_pro' | 'admin')[]

canAccessAdmin(roles)  // → boolean
canQuote(roles)        // → boolean (verified_pro or admin)
```

## Zod Rules (Zod 4)

```typescript
// CORRECT — two type args
z.record(z.string(), z.string())

// WRONG — will error in Zod 4
z.record(z.string())
```

## Error Response Format (FD-27)

> **Always use helpers from `lib/api/error-response.ts`** — never raw `NextResponse.json` for errors.

Available helpers: `apiUnauthorized()`, `apiForbidden()`, `apiValidationError(issues)`, `apiNotFound()`, `apiConflict(msg)`, `apiServerError(msg)`, `apiError(msg, status, details?)`.

| Status | When |
|---|---|
| 400 | Validation failed |
| 401 | Not authenticated |
| 403 | Authenticated but wrong role |
| 404 | Resource not found |
| 409 | Conflict (duplicate, state mismatch) |
| 500 | DB or internal error |

## Webhook Events (when to fire)

```typescript
import { sendWebhook } from '@/lib/webhook/send';

// Fire after successful state changes:
await sendWebhook(userId, 'job.created', jobData);
await sendWebhook(userId, 'quote.accepted', quoteData);
await sendWebhook(userId, 'payment.completed', paymentData);
```

Webhook delivery is HTTPS-only, HMAC-SHA256 signed via `X-WorkMate-Signature`.

## TypeScript Strict Mode (FD-31)

TypeScript `strict: true` is enabled project-wide. All route handlers must have explicit return type annotations. Example:

```typescript
export async function POST(req: NextRequest): Promise<NextResponse> {
```

Note: The `RouteHandler` type in `lib/rate-limit/middleware.ts` uses `any` for the ctx parameter. This is intentional for strict mode compatibility with Next.js dynamic route context typing.

## Checklist Before Committing

- [ ] `getSupabaseRouteClient()` used (not browser or server client)
- [ ] `auth.getUser()` called and user checked
- [ ] Role checked if route is role-restricted
- [ ] Zod schema validates all input fields
- [ ] Money fields use `_amount_cents` (integer)
- [ ] Error response uses `{ error: ... }` format
- [ ] Webhook fired for state-change events
- [ ] No raw user data passed to HTML (XSS prevention)
- [ ] Explicit return type annotations on all exported functions (FD-31)
