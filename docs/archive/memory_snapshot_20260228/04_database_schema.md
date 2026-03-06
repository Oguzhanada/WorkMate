---
VERSION: 1.0
LAST_UPDATED: 2026-02-28
UPDATED_BY: AI Assistant
CHANGES:
- Initial schema summary added from migrations 001-036
- Captured RLS-sensitive tables and recent feature layer
---

# Database Schema

## Migration Baseline

- Migration files present: `001_initial_marketplace_schema.sql` through `036_airtasker_feature_layer.sql`.
- Schema is evolution-driven and heavily policy-backed (RLS + role checks).

## Core Domain Tables

- Identity and roles: `profiles`, `user_roles`.
- Marketplace: `jobs`, `quotes`, `reviews`, `categories`.
- Provider operations: `pro_documents`, `pro_services`, `pro_service_areas`.
- Communication and alerts: `notifications`, `job_messages`, `task_alerts`.
- Payments/disputes: `payments`, `disputes`, `dispute_logs`, `dispute_evidence`.
- Supporting entities: `addresses`, `job_intents`, `customer_provider_history`, `quote_daily_limits`.

## Verification Model

- `profiles.id_verification_status`: `none | pending | approved | rejected`.
- `profiles.verification_status`: provider/account verification layer.
- `pro_documents.verification_status`: `pending | verified | rejected | request_resubmission`.

## Recent Feature Layer (`036`)

- Quote metadata: `expires_at`, `ranking_score`.
- Job metadata: `task_type`, `job_mode`.
- `task_alerts` table + trigger + RLS policies.
- `customer_provider_history` table + increment RPC.
- `provider_rankings` materialized view + refresh function + scheduled refresh support.

## RLS Notes

- RLS enabled on sensitive user-owned tables (including `task_alerts`, history, reviews visibility rules).
- Admin visibility patterns usually implemented via `user_roles` check in policy predicates.

