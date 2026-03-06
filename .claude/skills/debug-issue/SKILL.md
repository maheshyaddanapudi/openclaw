---
name: debug-issue
description: |
  Systematic debugging workflow. Use when user says:
  "debug this", "why is this failing", "investigate bug", "trace this error",
  "find the root cause", "this is broken", "help me debug"
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
---

# Debug Issue

Systematic approach to investigating and resolving bugs.

## Step 1: Classify

Determine the issue type:
- **Build failure** → check `pnpm build` output, look for type errors or import issues
- **Test failure** → run the specific test with verbose output: `pnpm exec vitest run path/to/file.test.ts`
- **Runtime error** → check gateway logs: `tail -n 120 /tmp/openclaw-gateway.log` or `./scripts/clawlog.sh`
- **Logic bug** → reproduce with minimal input, trace data flow

## Step 2: Reproduce

- For test failures: run the exact failing test in isolation
- For runtime errors: check if `pnpm gateway:dev` reproduces it
- For channel issues: identify which channel, check its monitor/probe

## Step 3: Isolate

- Read source code of relevant npm dependencies AND all related local code
- Trace the call chain from entry point to failure
- Check recent commits that touched the affected area:
  ```bash
  git log --oneline -10 -- path/to/affected/
  ```

## Step 4: Fix

- Apply the **minimal fix** — fix the bug, don't refactor around it
- Ensure the fix doesn't break other channels (if touching shared code)
- If fixing in `src/gateway/server-methods/`: use `SessionManager.appendMessage()` for session writes

## Step 5: Verify

- Run the specific failing test
- Run related test suite (`pnpm test:fast` or `pnpm test:gateway`)
- Confirm `pnpm tsgo` and `pnpm lint` still pass

## Step 6: Document

- Write a regression test if one doesn't exist
- Use Conventional Commits: `fix(scope): description (#issue)`
