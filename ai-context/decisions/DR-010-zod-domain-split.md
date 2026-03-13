# DR-010 — Zod Schema Domain-Driven Split

| Field | Value |
|-------|-------|
| ID | DR-010 |
| Date | 2026-03-13 |
| Author | Tech Lead / Architecture Team |
| Status | Accepted |
| Changes | FD-01 |
| Approved by | Repository owner |

---

## Context

FD-01 required all Zod API validation schemas to live in `lib/validation/api.ts`.
This served the project well during early development (single source of truth, fast iteration).

By session 40 the file had grown to **760+ lines and 50+ schemas** across unrelated domains
(auth, jobs, billing, admin, disputes, analytics, AI, etc.).
The monolith caused:

- Increasing Git merge conflicts on the single file across parallel feature branches.
- Poor discoverability — developers must scroll the entire file to find one schema.
- Inflated import graphs — importing one auth schema pulled the entire billing + admin set.
- Test file size: unit tests for schemas needed to import the whole module.

---

## Decision

`lib/validation/api.ts` is **deprecated as a schema home**. It is retained as a
**re-export barrel** for backward compatibility while consumers are migrated.

Schemas are split into domain-scoped files under `lib/validation/`:

| File | Domain |
|------|--------|
| `lib/validation/auth.ts` | Login, register, password reset |
| `lib/validation/jobs.ts` | Job CRUD, status, photos, messages, todos, contracts, time tracking |
| `lib/validation/quotes.ts` | Quote creation, acceptance, offer submission |
| `lib/validation/billing.ts` | Stripe secure hold, capture, subscriptions, invoices, identity |
| `lib/validation/disputes.ts` | Dispute creation, response, evidence, resolution, payment |
| `lib/validation/admin.ts` | Provider/document decisions, filters, batch ops, feature flags, GDPR admin, compliance |
| `lib/validation/profile.ts` | Profile address, referral, portfolio, reviews, favourites |
| `lib/validation/search.ts` | Provider search, saved searches, task alerts |
| `lib/validation/availability.ts` | Provider availability slots, appointments |
| `lib/validation/dashboard.ts` | Dashboard widget creation and patching |
| `lib/validation/notifications.ts` | Notification query, mark-read |
| `lib/validation/analytics.ts` | Funnel telemetry, funnel summary query |
| `lib/validation/ai.ts` | AI alert suggestions, job description generation |
| `lib/validation/webhooks.ts` | Public API webhook subscription |

`lib/validation/api.ts` re-exports everything from the above files so existing
`import { ... } from '@/lib/validation/api'` calls continue to work without change.

### Migration path

New code MUST import from the domain file directly, e.g.:
```ts
import { createJobSchema } from '@/lib/validation/jobs';
```

Existing imports from `api.ts` remain valid and will be migrated progressively via
a codemod or PR-by-PR cleanup. `api.ts` barrel will remain until all 78 consumers
have been updated and a final cleanup PR removes it.

---

## Consequences

**Positive**
- Files are small, focused, and easy to navigate.
- PR diffs are domain-scoped — no more merge conflicts on the monolith.
- Tree-shaking improvements (bundlers can drop unused schema modules).
- Test files can import only the domain they cover.

**Negative / Trade-offs**
- `api.ts` barrel re-export must be kept in sync when new schemas are added to domain files.
  CI will catch missing re-exports via type errors in existing consumers.
- Developers must know which domain file to add a new schema to. The table above is the guide.

---

## Updated Rule (replaces FD-01)

New schemas go into the appropriate `lib/validation/<domain>.ts` file.
Never add new schemas directly to `lib/validation/api.ts`.
`api.ts` is a re-export barrel only — **never add schema definitions there**.
