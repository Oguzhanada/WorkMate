# Onboarding States (WorkMate)

## Core fields

- `profiles.verification_status`: provider workflow layer
- `profiles.id_verification_status`: identity state (`none | pending | approved | rejected`)
- `pro_documents.verification_status`: document review state (`pending | verified | rejected | request_resubmission`)

## Expected transitions

1. New provider onboarding submit
- `verification_status`: `pending`
- `id_verification_status`: `pending` if new ID uploaded

2. Verified-ID user resubmits onboarding without new ID upload
- `id_verification_status` remains `approved`
- no forced duplicate ID upload

3. Admin approves profile
- `verification_status`: `verified`

4. Admin rejects profile
- `verification_status`: `rejected`

## Regression traps

- Approved ID accidentally downgraded to pending
- Non-UUID fallback category value blocks submit
- Admin decision updates profile but not document state consistency
