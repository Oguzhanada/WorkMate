# Release Checklist For Migration Changes

1. Run static checks:
- `scripts/check_migration_guardrails.ps1 -MigrationPath marketplace/migrations`

2. Apply migration in local/dev database.

3. Validate impacted routes and workflows:
- Auth and role-gated routes
- Provider onboarding
- Admin review paths
- Payments/disputes if touched

4. Re-run project checks:
- `npm run lint`
- Relevant unit/integration/e2e tests

5. Prepare review notes:
- Risk summary
- Rollback plan
- Backfill strategy (if any)
