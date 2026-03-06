---
paths:
- '**/*.test.ts'
- '**/*.e2e.test.ts'
- '**/*.live.test.ts'
- 'test/**'
---

# Testing Standards

## Hard Rules

- **ALWAYS** name test files `*.test.ts` colocated with the source file they test
- **ALWAYS** name e2e tests `*.e2e.test.ts` and live tests `*.live.test.ts`
- **NEVER** set test worker count above 16
- **NEVER** use prototype mutation (`SomeClass.prototype.method = ...`) for stubs — use per-instance stubs unless explicitly documented why prototype patching is required
- **ALWAYS** use Vitest (`describe`, `it`, `expect`) — not Jest or Mocha
- Gateway tests MUST use `--pool=forks` (configured in `vitest.gateway.config.ts`)

## Coverage

Coverage thresholds are enforced: 70% lines, 70% functions, 55% branches, 70% statements.
Coverage only applies to `./src/**/*.ts` (not extensions, apps, or UI).

## Test Commands

```bash
pnpm exec vitest run path/to/file.test.ts          # single file
pnpm exec vitest run path/to/file.test.ts -t "name" # single test
pnpm test:fast                                       # unit only
pnpm test:gateway                                    # gateway (forks)
```

## Changelog

Pure test additions/fixes do NOT need a changelog entry unless they alter user-facing behavior.
