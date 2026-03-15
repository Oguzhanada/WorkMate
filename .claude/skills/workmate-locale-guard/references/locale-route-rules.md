# Locale Route Rules

- Prefer locale-aware path helpers in client code.
- Avoid hardcoded `'/dashboard/...` and `'/profile'` in localized views.
- Server redirects in locale routes should include locale when user-facing.
- Public profile routes may remain explicit where intentionally global.
