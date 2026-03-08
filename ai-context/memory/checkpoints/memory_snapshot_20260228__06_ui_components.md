---
VERSION: 1.0
LAST_UPDATED: 2026-02-28
UPDATED_BY: AI Assistant
CHANGES:
- Initial UI component map documented
- Added admin and onboarding component focus
---

# UI Components

## Component Library Shape

- Approximate component file count: 87 under `marketplace/components/`.
- Major domains:
  - `home`: landing and discovery modules.
  - `auth`: login/signup/password/security controls.
  - `forms`: onboarding and job posting forms.
  - `dashboard`: admin/pro/customer dashboard panels.
  - `profile`: identity, portfolio, completion, inbox.
  - `payments` and `disputes`: operational user flows.
  - `site` and `ui`: navigation, footer, shared primitives.

## Active UX Areas

- Admin application review panel:
  - `components/dashboard/AdminApplicationsPanel.tsx`
  - `components/dashboard/AdminApplicationDetail.tsx`
  - Supports open/download doc actions, bulk actions, and modal decision notes.
- Provider onboarding:
  - `app/[locale]/become-provider/page.tsx`
  - Handles multi-step form, document uploads, and verification-state reconciliation.
- Navigation reliability:
  - `components/home/Navbar.tsx`
  - Unit tests cover auth refresh flicker behavior.

## Styling Approach

- CSS Modules for scoped component styles.
- Global styles in `app/globals.css`.
- Motion and animation utilities via Framer Motion and local animation helpers.

