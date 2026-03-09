# DR-002: Hybrid UI Strategy for Premium Consistency

- Date: 2026-03-09
- Status: Accepted
- Owners: WorkMate maintainers

## Decision
Adopt a hybrid UI strategy:
- Allow Shadcn/Radix primitives inside `components/ui/*` only.
- Keep page-level control strict: avoid random utility accumulation and avoid ad-hoc visual patterns in page files.
- Preserve `--wm-*` tokens as the canonical source for color, spacing, radius, shadows, and transitions.
- Keep existing wrapper APIs (`Button`, `Card`, `Badge`, etc.) stable while modernizing internals.
- Require visual quality gates before merge: Backstop and Lighthouse checks must pass on PRs.

## Rationale
- Current bottleneck is not token presence; it is cross-page consistency and component quality drift.
- Rebuilding all primitives from scratch is slow and error-prone for accessibility and interaction parity.
- A wrapper-based hybrid approach improves delivery speed without losing WorkMate visual identity.
- Enforcing visual regression/performance checks on PRs prevents gradual UI quality erosion.

## Consequences
- Frozen decisions FD-03/FD-04/FD-05 now operate under this hybrid boundary.
- UI work must route through shared wrappers in `components/ui/*`.
- PRs that fail Backstop or Lighthouse are merge-blocked until fixed.
