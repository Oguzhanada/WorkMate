# CSP Architecture

## Why this exists

WorkMate uses two CSP tiers:

- `baseline` for public and marketing pages
- `strict` for authenticated and higher-risk pages

This split exists because Next.js strict CSP requires a request-scoped nonce.
If `script-src` includes `strict-dynamic` without a nonce or hash, the browser
can block Next/Turbopack bundles and the UI will fall back to SSR shells or
loading skeletons.

## Implementation

- Static security headers live in [next.config.ts](/C:/Users/Ada/Git/Python/WorkMate/marketplace/next.config.ts).
- CSP is generated in [middleware.ts](/C:/Users/Ada/Git/Python/WorkMate/marketplace/middleware.ts).
- Route classification lives in [csp-routes.ts](/C:/Users/Ada/Git/Python/WorkMate/marketplace/lib/security/csp-routes.ts).
- Directive construction lives in [csp.ts](/C:/Users/Ada/Git/Python/WorkMate/marketplace/lib/security/csp.ts).

## Guardrails

1. Do not add a global `Content-Security-Policy` header in `next.config.ts`.
2. Do not add `strict-dynamic` to baseline pages.
3. If a route moves into the strict tier, make sure it renders dynamically so the nonce can flow through.
4. Prefer removing inline scripts over widening the policy.
5. When adding third-party scripts, update the CSP builder and verify both a baseline page and a strict page in the browser.

## Validation

- Unit coverage: [csp.test.ts](/C:/Users/Ada/Git/Python/WorkMate/marketplace/tests/unit/csp.test.ts)
- Manual smoke: open `/` and `/login`, confirm no CSP console errors and full render
