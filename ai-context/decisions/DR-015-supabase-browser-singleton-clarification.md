# DR-015 — Supabase Browser Client Singleton Clarification

| Field | Value |
|-------|-------|
| **ID** | DR-015 |
| **Date** | 2026-03-14 |
| **Author** | Independent Audit + Ada |
| **Decision** | Update FD-08 — browser singleton is correct pattern; server/route must be per-request |
| **Status** | Accepted |
| **Trigger** | Independent audit 2026-03-14 flagged token refresh concern on browser singleton; internal review found FD-08 wording contradicts actual browser client code |

## Context

FD-08 states: "Supabase per-context clients — NEVER module-scope singleton." However, `lib/supabase/client.ts` IS a module-scope singleton:

```ts
let client: ... | null = null;
export function getSupabaseBrowserClient() {
  if (client) return client;
  client = createBrowserClient(...);
  return client;
}
```

The code's own comment calls it "Module-scope singleton with lazy initialization (safe in browser)."

### Why browser singleton is correct

In the browser, multiple Supabase client instances would compete for auth state, creating race conditions on token refresh. `@supabase/ssr`'s `createBrowserClient` internally manages `onAuthStateChange` listeners and automatic token refresh. A singleton is the recommended pattern.

### Why server/route must NOT be singleton

Server-side clients carry request-scoped auth context (cookies). A shared singleton would leak auth state between requests.

### Audit concern: token refresh

The auditor flagged potential stale tokens. While `@supabase/ssr` handles this via `onAuthStateChange`, the singleton has no explicit error recovery if the refresh endpoint itself fails. This is an acceptable risk given Supabase's built-in retry logic, but worth documenting.

## Decision

Update FD-08 wording to:
1. **Browser client**: Module-scope singleton via `getSupabaseBrowserClient()` is correct and required. `@supabase/ssr`'s `createBrowserClient` handles token refresh internally.
2. **Server/route clients**: MUST be per-request — never shared or cached.
3. **Service client**: Restricted to approved contexts (unchanged from S42 update).

## Frozen Decision (updated)

**FD-08** (updated): Supabase client rules:
- **Browser**: singleton via `getSupabaseBrowserClient()` (correct — `createBrowserClient` manages auth state and token refresh internally). Never create multiple browser client instances.
- **Server/Route**: per-request via `getSupabaseServerClient()` / `getSupabaseRouteClient()` — NEVER module-scope or cached.
- **Service role**: restricted to admin routes, webhook handlers, background tasks, public API, and read-only public endpoints (unchanged).
