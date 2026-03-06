# Build, Test, and Development Guide

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | >=22.12.0 | Enforced at startup in `openclaw.mjs` |
| pnpm | 10.23.0 | `packageManager` field in `package.json` |
| Bun | latest | Optional, preferred for TS execution in dev |

For native apps:
- macOS/iOS: Xcode with Swift 6.2, SwiftFormat, SwiftLint
- Android: Android Studio, Gradle, SDK 31-36
- iOS project generation: XcodeGen (`apps/ios/`)

## Install Dependencies

```bash
pnpm install
```

Also supported: `bun install` (keep `pnpm-lock.yaml` in sync when touching deps).

If you see `vitest not found` or similar, run `pnpm install` first, then retry.

## Build

```bash
pnpm build          # Full build: tsdown + plugin SDK DTS + post-build scripts
pnpm build:strict-smoke  # Quick build without post-build scripts
```

Build output goes to `dist/`. The build includes:
- TypeScript compilation via tsdown (52+ entry points)
- Plugin SDK declaration files (`tsc -p tsconfig.plugin-sdk.dts.json`)
- A2UI canvas bundle, hook metadata, HTML templates, build info, CLI metadata

## Type Checking

```bash
pnpm tsgo           # Fast native TypeScript checker
```

## Lint and Format

```bash
pnpm check          # Full check: format + tsgo + lint + custom lint rules
pnpm lint           # Oxlint only (--type-aware)
pnpm lint:fix       # Oxlint fix + format
pnpm format:check   # Oxfmt check only
pnpm format:fix     # Oxfmt write (auto-fix)
```

Swift (macOS/iOS):
```bash
pnpm format:swift   # SwiftFormat lint
pnpm lint:swift     # SwiftLint
```

Pre-commit hooks run `oxlint --fix` and `oxfmt --write` automatically on staged files (configured via `git-hooks/pre-commit`, installed by `pnpm prepare`).

## Running Tests

### All tests (parallel)
```bash
pnpm test           # Runs via scripts/test-parallel.mjs
```

### Unit tests only
```bash
pnpm test:fast      # vitest.unit.config.ts (excludes gateway, channels, agents)
```

### Specific test suites
```bash
pnpm test:gateway       # Gateway tests (vitest.gateway.config.ts, --pool=forks)
pnpm test:channels      # Channel tests
pnpm test:extensions    # Extension plugin tests
pnpm test:e2e           # End-to-end tests
pnpm test:ui            # Web UI tests
```

### Single test file
```bash
pnpm exec vitest run src/routing/resolve-route.test.ts
pnpm exec vitest run extensions/msteams/src/channel.test.ts
```

### Single test by name
```bash
pnpm exec vitest run src/routing/resolve-route.test.ts -t "test name pattern"
```

### Watch mode
```bash
pnpm test:watch     # vitest in watch mode
```

### Coverage
```bash
pnpm test:coverage  # V8 coverage with thresholds: 70% lines/functions/statements, 55% branches
```

### Live tests (real API keys)
```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live          # OpenClaw live tests
LIVE=1 pnpm test:live                        # Includes provider live tests
```

### Docker tests
```bash
pnpm test:docker:all        # Full Docker test suite
pnpm test:install:smoke     # Install script smoke test
```

### Memory-constrained hosts
```bash
OPENCLAW_TEST_PROFILE=low OPENCLAW_TEST_SERIAL_GATEWAY=1 pnpm test
```

## Running the CLI in Development

```bash
pnpm openclaw <command>     # Run via scripts/run-node.mjs
pnpm dev                    # Alias for above
pnpm gateway:dev            # Gateway only (skips channel init)
pnpm gateway:watch          # Gateway with file watching
pnpm tui:dev                # Terminal UI in dev profile
```

## Committing Changes

Use the scoped commit helper instead of manual `git add`/`git commit`:
```bash
scripts/committer "fix(routing): handle edge case" src/routing/resolve-route.ts
```

This script:
- Unstages everything first (`git restore --staged :/`)
- Stages only the listed files
- Rejects `.` (entire repo), `node_modules`, empty messages
- Supports `--force` flag to clear stale git locks

Commit message style: Conventional Commits with scope — `fix(feishu):`, `feat(gateway):`, `docs:`, `chore:`.

## Common Gotchas

1. **Node version**: Must be >=22.12.0. The entry point (`openclaw.mjs`) hard-checks this.
2. **Missing deps**: If `vitest not found` or similar, run `pnpm install` first.
3. **Test workers**: Do not set test workers above 16 (causes issues).
4. **Gateway tests**: Use `--pool=forks` (already configured in `vitest.gateway.config.ts`).
5. **Test timeouts**: Default 120s (180s for hooks on Windows). Tests use process isolation via forks.
6. **Carbon dependency**: Never update the Carbon (Discord) dependency.
7. **Patched deps**: Any dependency in `pnpm.patchedDependencies` must use exact versions (no `^`/`~`).
8. **Dynamic imports**: Don't mix `await import("x")` and static `import x from "x"` for the same module. Check for `[INEFFECTIVE_DYNAMIC_IMPORT]` warnings after build.
9. **Plugin deps**: Extensions use `npm install --omit=dev` at runtime. Keep runtime deps in `dependencies`, not `devDependencies`. Avoid `workspace:*` in `dependencies`.
10. **Format churn**: Pre-commit hooks auto-fix formatting. If you see format-only diffs, just stage them.

## Web UI Development

```bash
pnpm ui:install     # Install UI dependencies
pnpm ui:dev         # Vite dev server
pnpm ui:build       # Production build to dist/control-ui/
```

## Native App Development

### macOS
```bash
pnpm mac:package    # Package macOS app (scripts/package-mac-app.sh)
pnpm mac:open       # Open built app
pnpm mac:restart    # Restart via scripts/restart-mac.sh
```

### iOS
```bash
pnpm ios:gen        # Generate Xcode project (xcodegen)
pnpm ios:build      # Build for simulator
pnpm ios:run        # Build and launch on simulator
pnpm ios:open       # Open in Xcode
```

### Android
```bash
pnpm android:assemble   # Gradle assembleDebug
pnpm android:install    # Install on connected device
pnpm android:run        # Install and launch
pnpm android:test       # Unit tests
pnpm android:lint       # ktlint check
```

## Release Checks

```bash
node --import tsx scripts/release-check.ts   # Pre-release validation
pnpm release:check                           # Same as above
pnpm test:install:smoke                      # Install smoke test
```
