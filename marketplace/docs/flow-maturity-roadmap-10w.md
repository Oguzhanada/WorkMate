# WorkMate Flow Maturity Roadmap (10 Weeks)

## Objective
Ship a realistic flow maturity upgrade without rewriting core systems.

Priority order:
1. Provider funnel clarity
2. Trust and policy certainty
3. Ops reliability and telemetry

## Phase A (Weeks 1-4): Provider Funnel Standardization

### Scope
- Enforce one provider journey:
  - `discover -> quote -> accepted -> in_progress -> completed -> paid`
- Onboarding gates:
  - verification
  - profile completeness
  - first quote sent
- First quote completion trigger:
  - welcome email
  - dashboard tour entry (`/dashboard/pro?tour=1`)
- Quote SLA:
  - visibility and opt-in only
  - no ranking penalty in this phase

### Exit criteria
- Provider first-quote activation increases
- Quote submission rate increases
- Provider persona ambiguity test passes ("what is next?" always clear)

## Phase B (Weeks 5-7): Trust, Policy, and Dispute Certainty

### Policy contract (DR-003)
- Before acceptance: `0%` deduction
- Accepted, not in progress: `15%` platform deduction + remainder refund
- In progress: no auto full refund, dispute + evidence path required

### Scope
- Escrow release states standardized:
  - manual release
  - automation release
  - dispute hold
- Happiness pledge visible in trust-critical UI
- Dispute flow additions:
  - evidence checklist
  - SLA target messaging
  - admin escalation path

### Exit criteria
- Refund/dispute outcomes are policy-consistent
- Release delays and dispute resolution times are measurable

## Phase C (Weeks 8-10): Ops Reliability + Telemetry Lite

### Scope
- Admin incident consolidation:
  - payment_failed
  - chargeback
  - verification rejection
  - escalation queue
- Ownership and retry visibility:
  - who owns incident
  - pending action
  - retry state
- Telemetry (lite):
  - critical funnel drop-offs
  - dispute lifecycle markers
  - payment failure markers

### Exit criteria
- First-response time for critical incidents decreases
- Ops can always answer: what happened, who acts next

## Test and Release Gates

Per phase (mandatory):
- `npm run lint`
- `npm run typecheck`
- 3-5 critical Playwright smoke scenarios
- ambiguity test for customer/provider/admin personas
- walkthrough notes recorded in `ai-context/decisions/` or checkpoint logs

## Scope Fallback Rules

- If Phase A scope drifts:
  - SLA enforcement moves to Phase B automatically
  - provider funnel clarity remains highest priority
- Telemetry starts lite by design; advanced anomaly detection is a later iteration.
