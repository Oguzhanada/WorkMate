# Release Checklist (Payment Changes)

1. Static checks
- `npm run lint`

2. Surface checks
- `scripts/check_payment_surface.ps1 -RepoRoot <repo>`

3. Functional checks
- Create secure hold
- Capture flow
- Refund flow
- Webhook replay/idempotency check

4. Regression checks
- Dispute paths still operational
- Admin/payment status pages still consistent
- English-only payment-facing strings preserved

5. Release notes
- Risk summary
- Rollback plan
- Monitoring signals
