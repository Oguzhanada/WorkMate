# DR-009: Temporary AI Analysis Files — FD-24 Relaxation

- **Date:** 2026-03-12
- **Status:** Accepted
- **Owner:** WorkMate maintainers
- **Refines:** FD-24

## Decision

AI agents may write temporary analysis files to the `ai-reports/` directory. This directory is gitignored; files are never committed.

## Rationale

FD-24 was written to prevent AI from accumulating unnecessary report files in `docs/` and the repo root. However, the user needs temporary analysis output for local review. The `ai-reports/` gitignored directory separates the two concerns: local review is possible, the repo stays clean.

## New Rule (refines FD-24)

**Forbidden (preserved):** Creating files of the type `*REPORT*.md`, `*COMPLETION*.md`, `*GUIDE*.md` under `docs/`, the repo root, or `ai-context/`.

**Permitted (new):** Writing temporary analysis files to the `ai-reports/` directory.
- This directory is declared in `.gitignore`
- Files are never committed or included in CI
- Can be cleaned up at the end of a session

## Implementation

Line added to `.gitignore`: `ai-reports/`
