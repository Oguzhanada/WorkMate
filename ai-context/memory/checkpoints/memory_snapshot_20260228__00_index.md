---
VERSION: 1.0
LAST_UPDATED: 2026-02-28
UPDATED_BY: AI Assistant
CHANGES:
- Initial memory index created
- Added document ownership and update cadence
---

# Memory Index

This folder stores operational project memory for WorkMate.

## Files and Purpose

- `01_project_brief.md`: Product purpose, users, scope, and constraints.
- `02_tech_stack.md`: Runtime stack, tooling, scripts, and environment.
- `03_architecture.md`: Codebase structure and system-level design.
- `04_database_schema.md`: Core schema, migrations, and RLS highlights.
- `05_api_routes.md`: Key API routes and edge function mapping.
- `06_ui_components.md`: Component domains and UX modules.
- `07_business_rules.md`: Domain rules, validations, and role behavior.
- `08_checkpoints.md`: Session-to-session progress log and major updates.
- `09_next_steps.md`: Prioritized execution plan with status.
- `decisions.md`: Decision log with rationale and alternatives.

## Update Rules

- Daily update:
  - `08_checkpoints.md`
  - `09_next_steps.md`
- Weekly consistency pass:
  - Review all files for drift against `marketplace/` source.
- Trigger-based update:
  - Update affected files after major PR merges or migration batches.

