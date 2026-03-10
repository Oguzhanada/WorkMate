---
name: workmate-api-route
description: Standard pattern for writing new API route handlers in WorkMate. Use when creating or reviewing any file under app/api/. Enforces correct Supabase client selection, Zod validation, RBAC checks, error handling format, and webhook trigger pattern.
---

# WorkMate API Route Pattern

Every API route in `app/api/` must follow this exact structure.

## File Location

```
app/api/<resource>/route.ts           # collection: GET, POST
app/api/<resource>/[id]/route.ts      # item: GET, PATCH, DELETE
```

## Standard Route Template

> **Rule 13 (AGENTS.md):** Never define Zod schemas inline inside a route handler.
> Always add schemas to `lib/validation/api.ts` and import from there.

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase/route';
import { getUserRoles } from '@/lib/auth/rbac';
// 1. Import schema from the shared validation file (never define inline)
import { CreateResourceSchema } from '@/lib/validation/api';

export async function POST(req: NextRequest) {
  const supabase = getSupabaseRouteClient();

  // 2. Auth check (always)
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 3. RBAC check (when role-restricted)
  const roles = await getUserRoles(supabase, user.id);
  if (!roles.includes('verified_pro')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 4. Validate input using shared schema
  const body = await req.json();
  const parsed = CreateResourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // 5. DB operation
  const { data, error } = await supabase
    .from('table_name')
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 6. Webhook trigger (when applicable)
  // import { sendWebhook } from '@/lib/webhook/send';
  // await sendWebhook(user.id, 'resource.created', data);

  return NextResponse.json(data, { status: 201 });
}
```

### Adding a new schema

Open `lib/validation/api.ts` and append your schema:

```typescript
// lib/validation/api.ts
export const CreateResourceSchema = z.object({
  field: z.string().min(1),
  amount_cents: z.number().int().positive(), // money always in cents
});
```

Never add schemas in the route file itself.

## Supabase Client — Which to Use

| Context | Import |
|---|---|
| API route handler | `getSupabaseRouteClient()` from `lib/supabase/route.ts` |
| Server component/page | `getSupabaseServerClient()` from `lib/supabase/server.ts` |
| Client component | `getSupabaseBrowserClient()` from `lib/supabase/client.ts` |
| Admin bypass (service role) | `getSupabaseServiceClient()` from `lib/supabase/service.ts` |

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

## Error Response Format

Always return `{ error: string | object }` with appropriate HTTP status:

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

## Checklist Before Committing

- [ ] `getSupabaseRouteClient()` used (not browser or server client)
- [ ] `auth.getUser()` called and user checked
- [ ] Role checked if route is role-restricted
- [ ] Zod schema validates all input fields
- [ ] Money fields use `_amount_cents` (integer)
- [ ] Error response uses `{ error: ... }` format
- [ ] Webhook fired for state-change events
- [ ] No raw user data passed to HTML (XSS prevention)
