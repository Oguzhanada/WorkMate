# DR-011 — Layout Rules Contextual Scope Narrowing

| Field | Value |
|-------|-------|
| ID | DR-011 |
| Date | 2026-03-13 |
| Author | Tech Lead / Architecture Team |
| Status | Accepted |
| Changes | FD-05, FD-07 |
| Approved by | Repository owner |

---

## Context

FD-05 required `<PageHeader>` on every page.
FD-07 required `sm:grid-cols-2 lg:grid-cols-3` on every card list.

Both rules were introduced to prevent UI drift on standard data-listing pages.
They succeeded at that goal but caused friction in secondary view contexts:

- **Modal sub-views** — a `<PageHeader>` inside a modal is visually wrong (double hierarchy).
- **Multi-step wizard flows** — each wizard step is not an independent page; a step header
  component is appropriate, not the full `<PageHeader>` with breadcrumb/action slots.
- **Analytics / admin dashboards** — dense metric grids need 4-column layouts; forcing
  3-column loses critical at-a-glance density.
- **Single-item focus views** — empty-state and single-record pages benefit from centered,
  constrained layouts not a forced responsive grid.

Forcing FD-05/FD-07 in these contexts led to "hacky" overrides (`mt-[-2rem]`,
dummy wrappers, empty action slots) that introduced more visual inconsistency than the
rules prevented.

---

## Decision

The **scope** of FD-05 and FD-07 is narrowed to **Top-Level Standard Pages only**.

### FD-05 updated rule

`<PageHeader>` is **required** on all top-level page routes
(`app/[locale]/**/(page.tsx, not sub-components)`).

**Exempt contexts** (no `<PageHeader>` required):
- Modal contents and sheet panels
- Multi-step wizard steps
- Dashboard widget inner views
- Full-screen focus / single-item detail overlays
- Sub-route tabs rendered inside a parent page that already has a `<PageHeader>`

### FD-07 updated rule

`sm:grid-cols-2 lg:grid-cols-3` remains the **default** for card listing pages.

Developers may override the grid to suit the context when:
- Dashboard analytics panels require denser columns (e.g., `lg:grid-cols-4`).
- A list contains wide cards where 2 columns is the natural maximum.
- Fluid layout is preferred — use CSS `grid-cols-[repeat(auto-fill,minmax(280px,1fr))]`.

Override requires a **comment** explaining the non-default choice:
```tsx
{/* DR-011: 4-col for admin metric density */}
<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
```

### What does NOT change

- `<Button>` (FD-04) — still required everywhere, no exceptions.
- `<EmptyState>` (FD-06) — still required on every list, no exceptions.
- Color tokens FD-03/FD-13/FD-14/FD-15 — unchanged.
- `<PageHeader>` still required on all top-level pages (scope narrowed, not removed).

---

## Consequences

**Positive**
- Developer experience: no "why do I need a PageHeader inside a modal?" friction.
- UX quality: context-appropriate layouts without hacky overrides.
- Wizard flows can use step-specific headers without fighting the rule.

**Negative / Trade-offs**
- Minor inconsistency risk in exempt contexts.
  **Mitigation**: Code review must verify UI/UX design adherence in PR visual QA.
  The `workmate-visual-qa` skill covers this gate.
