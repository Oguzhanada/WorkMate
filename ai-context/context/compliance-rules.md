# WorkMate Compliance Rules (Canonical)

This file is the canonical source for compliance, jurisdiction, legal-writing, and terminology constraints.

## Jurisdiction and Language
- WorkMate is Ireland-first for legal, payments, onboarding, verification, disputes, and tax-sensitive behavior.
- All user-facing and developer-facing content must be English only.
- If a request conflicts with Ireland compliance, stop and propose a compliant alternative.

## Legal/Policy Writing Safety
- Do not copy competitor legal text verbatim.
- Use neutral policy-safe wording aligned to WorkMate operations.
- Prefer official Irish/EU references for compliance-sensitive statements (DPC, Revenue, Irish consumer guidance).

## Terminology Rules
- Use Ireland terminology accurately (for example PPSN in Irish context).
- If request terminology is incorrect, correct terminology first, then proceed.
- TIN handling must support non-PPSN users where applicable.

## Ireland Validation Baseline
- Enforce Eircode validation in job-posting and address flows.
- Enforce Irish phone normalization to `+353XXXXXXXXX` with valid prefixes `83, 85, 86, 87, 89`.
- Do not accept generic EU/UK postal or phone formats as Irish-valid input.

## Compliance Operations
- Provider verification requirements include identity and business/compliance documentation.
- Treat GDPR obligations and retention workflows as mandatory in architecture decisions.
- For compliance-sensitive releases, require QA + compliance review before merge.
