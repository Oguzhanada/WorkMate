# WorkMate Guardrails (Permanent)

These rules are mandatory for every change in this project.

## 1) Language policy
- All user-facing and developer-facing content must be in English only.
- Do not add Turkish or any other language to UI strings, docs, errors, or policies.

## 2) Jurisdiction policy
- WorkMate is Ireland-first. Product, legal, payments, onboarding, verification, and dispute logic must follow Ireland context.
- If a request conflicts with Ireland compliance or introduces legal risk, stop and raise a warning before implementation.

## 3) Safety policy for policy/legal text
- Do not copy competitor legal text verbatim.
- Use policy-safe, neutral wording and adapt to WorkMate operations.
- Prefer official Irish/EU references for compliance-sensitive content (e.g., DPC, Revenue, Irish consumer guidance).

## 4) Verification and tax terminology
- Use correct Ireland terminology:
  - PPSN (Ireland), not generic assumptions.
  - TIN handling must support non-PPSN users via valid alternatives where applicable.
- If terminology in a request is incorrect, correct it first, then proceed.

## 5) Architecture and cleanliness
- Remove dead/unused code paths when safely confirmed.
- Avoid duplicate UI systems and parallel legacy components.
- Keep source of truth centralized (taxonomy, constants, validation, policy links).

## 6) Change quality gates
- Before commit:
  - `npm run lint`
  - `npm run test`
- Keep commit messages explicit and scoped.

## 7) Delivery behavior
- If a requested change is risky/non-compliant:
  - Explain why (short and concrete),
  - Provide a compliant alternative,
  - Ask for confirmation only if needed.

