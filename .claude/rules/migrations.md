---
paths:
  - "marketplace/migrations/**/*.sql"
---

# Migration Rules

- Next migration number: check `marketplace/migrations/` for highest existing + 1
- Additive only — never rewrite or renumber existing files
- RLS: every new table must have RLS enabled, never `FOR ALL USING (true)` (FD-10)
- Functions: include `SET search_path = public, pg_catalog` on every `CREATE OR REPLACE FUNCTION`
- FK: create corresponding index in the same migration
- Boolean/low-cardinality columns: do NOT add btree indexes
- Secrets: never hardcode — use Supabase Vault (`vault.decrypted_secrets`)
- Cron: check `SELECT * FROM cron.job` before adding new jobs
- Apply manually in Supabase SQL Editor — do not attempt CLI apply
- Canonical source: `ai-context/context/agents.md` section 3.4 + `docs/DB_RUNBOOK.md`
