---
name: code-review
description: |
  Structured code review of changed files. Use when user says:
  "review my code", "code review", "check my changes", "review this PR",
  "review before merge", "quality check"
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
---

# Code Review

Perform a structured review of all changed files.

## Steps

1. Identify scope:
   ```bash
   git diff --stat main...HEAD
   git log --oneline main...HEAD
   ```

2. For each changed file, check against project rules:

   **Build & Types:**
   - Does `pnpm tsgo` pass?
   - Does `pnpm build` pass without `[INEFFECTIVE_DYNAMIC_IMPORT]` warnings?

   **Code Patterns:**
   - No `@ts-nocheck` or disabled `no-explicit-any`
   - No `Type.Union` in tool schemas (use `stringEnum`/`optionalStringEnum`)
   - No prototype mutation for class behavior
   - No mixed static + dynamic imports for same module
   - No hardcoded ANSI colors (use `src/terminal/palette.ts`)
   - No hand-rolled spinners (use `src/cli/progress.ts`)

   **Channel Safety:**
   - If touching `src/channels/` or `src/routing/`, verify all channels considered
   - No streaming replies to external messaging surfaces

   **Plugin Safety:**
   - Extension deps in `dependencies`, not `devDependencies`
   - No `workspace:*` in extension `dependencies`
   - No extension-specific deps in root `package.json`

   **Security:**
   - No secrets, real phone numbers, or personal hostnames
   - Media MIME types validated from content, not declared type
   - Session writes via `SessionManager.appendMessage()` only

3. Check tests:
   - Colocated `*.test.ts` exists for new/changed source files
   - `pnpm test:fast` passes

4. Produce structured review:
   ```
   ## Review: [branch name]
   ### Critical (must fix)
   ### Warnings (should fix)
   ### Suggestions (nice to have)
   ### Verdict: APPROVE | REQUEST_CHANGES
   ```
