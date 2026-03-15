# Provider Onboarding Regression Checklist

## User-facing onboarding

- `/[locale]/become-provider` opens and categories load
- Verified-ID user is not asked for duplicate ID upload without new file
- Submit path returns clear English-only errors
- County/Eircode/phone validations behave as expected

## Admin review

- `/[locale]/dashboard/admin` lists applications correctly
- Document Open/Download links work for PDF/JPG/PNG
- Per-document approve/reject/request_resubmission actions persist
- Profile approve/reject actions persist with notes
- Bulk approve/reject and notification paths are stable

## Navigation and state

- Locale-safe routes are preserved
- Action buttons prevent duplicate submit while pending
- No placeholder flicker in key shell/navigation after auth refresh
