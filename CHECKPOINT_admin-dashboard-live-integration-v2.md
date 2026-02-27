# Checkpoint: Admin Dashboard Live Integration (Snapshot v2)
> Date: 2026-02-27 03:41:53
> Branch: `main`
> Base commit: `d691e52`
> Status: In progress

## Current State
- Admin dashboard is wired to live API flows in the localized route.
- Document actions now support both open and download from signed Supabase URLs.
- Build/type gate is green (`npm run lint` passed in current session).

## Completed in This Block
1. [x] Localized admin page now renders shell-based dashboard:
   - `marketplace/app/[locale]/dashboard/admin/page.tsx`
2. [x] Added signed/open/download URL output in provider applications API:
   - `marketplace/app/api/admin/provider-applications/route.ts`
3. [x] Added `download_url` in profile documents API:
   - `marketplace/app/api/admin/provider-applications/[profileId]/documents/route.ts`
4. [x] Added Open/Download controls in applications table expand panel:
   - `marketplace/components/dashboard/AdminApplicationsPanel.tsx`
   - `marketplace/components/dashboard/admin-panel.module.css`
5. [x] Added Open/Download controls in application detail screen:
   - `marketplace/components/dashboard/AdminApplicationDetail.tsx`
6. [x] `next-env.d.ts` import path reverted to stable route-types path.

## Workspace Snapshot (Uncommitted)
### Modified tracked files
- `marketplace/app/[locale]/become-provider/page.tsx`
- `marketplace/app/[locale]/dashboard/admin/page.tsx`
- `marketplace/app/api/admin/provider-applications/[profileId]/documents/route.ts`
- `marketplace/app/api/admin/provider-applications/route.ts`
- `marketplace/components/dashboard/AdminApplicationDetail.tsx`
- `marketplace/components/dashboard/AdminApplicationsPanel.tsx`
- `marketplace/components/dashboard/admin-panel.module.css`
- `marketplace/next-env.d.ts`

### Untracked files
- `CHECKPOINT_admin-dashboard-live-integration.md`
- `admin-dashboard-part1.html`
- `marketplace/lib/onboarding/provider-verification.ts`
- `marketplace/tests/unit/provider-verification.test.ts`

## Remaining
1. Run real-data admin E2E verification on:
   - document open/download links
   - per-document review action
   - profile approve/reject flow
2. Replace `window.prompt` based admin notes with inline modal inputs.
3. Add loading/disabled states to row-level actions to prevent duplicate submissions.

## Next Session Start Line
"Continue from admin dashboard QA on live/seeded data, then harden decision UX (inline notes + action state locks)."
