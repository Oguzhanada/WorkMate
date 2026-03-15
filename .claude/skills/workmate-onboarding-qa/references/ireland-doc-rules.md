# Ireland Provider Document Rules

## Required baseline

- Identity document
- Public Liability Insurance
- Safe Pass (where applicable)
- Tax Clearance / Tax Clearance Number (where applicable)

## Product constraints

- Ireland-only market assumptions
- Eircode and Irish phone validation must stay enforced
- Do not force PPSN collection in baseline flow

## QA checks

1. Missing required docs must block provider approval path
2. Optional docs (e.g., RGI/RECI/Safe Electric) should not block baseline approval unless explicitly configured
3. Admin note and decision logs should remain visible in review history
