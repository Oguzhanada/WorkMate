# MCP Public-Only Checklist (GitMCP Pilot)

Use this checklist before exposing any repository via GitMCP.

## 1) Repository sensitivity check
- [ ] Repository is intentionally public.
- [ ] No private customer/ops/compliance-only data is tracked in repo files.
- [ ] No internal incident runbooks with sensitive operational details are exposed.

## 2) Secrets and credentials hygiene
- [ ] `.env*`, service keys, webhook secrets, tokens are excluded from git.
- [ ] `npm run check:prepublic-security` (or equivalent) completed with no blockers.
- [ ] Recent commits reviewed for accidental secret exposure.

## 3) AI context safety check
- [ ] Agent guardrails are present and current (`ai-context/context/agents.md`).
- [ ] Decision records and policy docs do not leak confidential business/legal details.
- [ ] MCP read-only enforcement is active (`scripts/mcp/read_only_enforce.mjs`).

## 4) Tooling and access check
- [ ] GitMCP endpoint tested on a safe public branch/repo snapshot.
- [ ] Access assumptions documented (public-only, no private support assumed).
- [ ] Fallback plan documented if MCP context is unavailable.

## 5) Approval and audit
- [ ] Security/compliance owner explicitly approved public MCP onboarding.
- [ ] Pilot start date and owner recorded in `docs/mcp-pilot/`.
- [ ] Any blocked/violating action logging is enabled (`logs/mcp-readonly-violations.log`).
