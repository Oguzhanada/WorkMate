# Decision Records Index

| ID | Date | Title | Rationale (one-line) | FDs Affected | Status |
|---|---|---|---|---|---|
| DR-001 | 2026-03-08 | AI context consolidation to `ai-context/` | Single source of truth for all canonical AI context | — | Accepted |
| DR-002 | 2026-03-09 | Hybrid UI strategy with wrapper boundary | Shadcn/Radix in `components/ui/*` only; page-level uses `--wm-*` tokens | FD-03, FD-04, FD-05 | Accepted |
| DR-003 | 2026-03-09 | Cancellation and refund policy contract | 0% pre-acceptance, 15% after, dispute-gated post-in_progress | — | Accepted |
| DR-004 | 2026-03-09 | Provider funnel standardization | Canonical lifecycle: discover → quote → accepted → in_progress → completed → paid | — | Accepted |
| DR-005 | 2026-03-09 | Flow maturity consolidation | Customer + provider + admin flows share one state contract | — | Accepted |
| DR-006 | 2026-03-09 | MCP read-only pilot | 3-week GitHub + Supabase MCP pilot with zero-tolerance write policy | — | Accepted |
| DR-007 | 2026-03-12 | Dark mode support | `[data-theme="dark"]` toggle replaces light-only lock | FD-14 | Accepted |
| DR-008 | 2026-03-12 | loading.tsx scope clarification | Static pages with only `getTranslations()` exempt from loading.tsx | FD-02 | Accepted |
| DR-009 | 2026-03-12 | Temporary AI analysis files | Gitignored `ai-reports/` allowed; committed report files still banned | FD-24 | Accepted |
| DR-010 | 2026-03-13 | Zod schema domain-driven split | Monolithic `api.ts` → 14 domain files; `api.ts` becomes re-export barrel | FD-01 | Accepted |
| DR-011 | 2026-03-13 | Layout rules scope narrowed | PageHeader + grid defaults apply to top-level pages only; modals/wizards/dashboards exempt | FD-05, FD-07 | Accepted |
| DR-012 | 2026-03-14 | Token system expansion | 5 new `--wm-*` families (status, admin, chart, neutral, social) to eliminate hardcoded hex | FD-03 | Accepted |
| DR-013 | 2026-03-14 | Critical route test coverage mandatory | Payment, webhook, Stripe, idempotent routes must have unit tests | FD-32 (new) | Accepted |
| DR-014 | 2026-03-14 | Production distributed state health | Rate limiter + circuit breaker must expose health; Redis required in prod | FD-33 (new) | Accepted |
| DR-015 | 2026-03-14 | Supabase browser singleton clarification | Browser singleton correct; server/route must be per-request | FD-08 | Accepted |

## Record Format
- Create one file per decision: `DR-XXX-short-title.md`.
- Keep records append-only; never rewrite historical rationale.
- If superseded, mark old record as `Superseded` and reference the new ID.
