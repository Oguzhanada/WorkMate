# WorkMate Supabase Migration Guardrails

## Blocking rules

- Never use `FOR ALL USING (true)` in policies.
- Never disable RLS by default.
- Prefer least-privilege policy conditions tied to `auth.uid()` and role checks.

## Required review points

1. Validate migration naming and order (`000_name.sql`).
2. Validate policy scope (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) explicitly.
3. Validate index/constraint additions for query paths touched by API routes.
4. Validate compatibility with existing enums and schema names.
5. Validate no unexpected data-loss operations.

## WorkMate-specific expectations

- Preserve Ireland-first domain assumptions.
- Preserve strict RLS behavior across user, provider, and admin paths.
- Keep user-facing errors/messages in English only (implemented at app layer).
