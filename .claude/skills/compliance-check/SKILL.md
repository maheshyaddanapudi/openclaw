---
name: compliance-check
description: |
  Pre-commit verification and compliance scanning. Use when user says:
  "pre-commit check", "compliance check", "check my changes", "verify before commit",
  "scan for secrets", "check for issues", "ready to commit?"
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
---

# Compliance Check

Run all pre-commit verification steps on changed files.

## Steps

1. **Secret scan** — check staged/changed files for potential secrets:
   ```bash
   git diff --cached --name-only | xargs grep -lE '(api[_-]?key|password|secret|token|credential)\s*[:=]' 2>/dev/null
   ```
   Flag any matches. Never commit `.env` files (only `.env.example` is safe).

2. **Format check**:
   ```bash
   pnpm format:check
   ```
   If it fails, auto-fix with `pnpm format:fix`.

3. **Type check**:
   ```bash
   pnpm tsgo
   ```

4. **Lint**:
   ```bash
   pnpm lint
   ```

5. **Dynamic import safety** (if TS source changed):
   ```bash
   pnpm build 2>&1 | grep "INEFFECTIVE_DYNAMIC_IMPORT"
   ```

6. **Forbidden patterns scan**:
   - No `@ts-nocheck` in changed files
   - No `Type.Union` in `src/agents/tools/**` or `src/agents/schema/**`
   - No real phone numbers or hostnames in docs/tests
   - No prototype mutation (`SomeClass.prototype.method =`)

7. **Commit message format** — verify Conventional Commits: `type(scope): description`

8. Report all findings with severity (blocking vs warning).
