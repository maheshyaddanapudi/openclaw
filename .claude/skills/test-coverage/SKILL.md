---
name: test-coverage
description: |
  Analyze test coverage for changed code. Use when user says:
  "check coverage", "test coverage", "missing tests", "coverage report",
  "what needs tests", "coverage analysis", "untested code"
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
---

# Test Coverage Analysis

Identify coverage gaps in changed code.

## Steps

1. Identify changed source files (exclude tests):
   ```bash
   git diff --name-only main...HEAD -- '*.ts' | grep -v '\.test\.ts$' | grep -v '\.e2e\.test\.ts$'
   ```

2. For each changed source file, check if a colocated test exists:
   ```bash
   # For src/routing/resolve-route.ts → check src/routing/resolve-route.test.ts
   ```
   Report any source files without a matching `*.test.ts`.

3. Run targeted coverage on changed files:
   ```bash
   pnpm exec vitest run --coverage path/to/file.test.ts
   ```

4. If full coverage is needed:
   ```bash
   pnpm test:coverage
   ```
   Thresholds: 70% lines, 70% functions, 55% branches, 70% statements.
   Coverage scope: `./src/**/*.ts` only (not extensions, apps, or UI).

5. Report:
   - Files missing test coverage entirely
   - Files below the 70% line threshold
   - Specific uncovered functions or branches
   - Suggested test cases for uncovered paths
