---
name: smart-build
description: |
  Build only affected modules based on changed files. Use when user says:
  "build my changes", "fast build", "incremental build", "build what I changed",
  "build affected modules", "quick build", "smart build"
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
---

# Smart Build

Build only modules affected by recent changes instead of a full `pnpm build`.

## Steps

1. Detect changed files:
   ```bash
   git diff --name-only HEAD~1..HEAD 2>/dev/null || git diff --name-only --cached
   ```

2. Map changed files to build actions:
   - `src/**/*.ts` (not tests) → `pnpm build`
   - `ui/**` → `pnpm ui:build`
   - `extensions/**` → `pnpm build` (plugin SDK DTS needed)
   - `src/gateway/protocol/**` → `pnpm protocol:gen && pnpm protocol:gen:swift`
   - `docs/**` → no build needed (Mintlify is external)
   - `apps/macos/**` → `pnpm mac:package` (requires Mac)
   - `apps/ios/**` → `pnpm ios:build` (requires Xcode)
   - `apps/android/**` → `pnpm android:assemble`
   - `**/*.test.ts` only → no build needed, run `pnpm test:fast`

3. If only TypeScript source changed, run type-check first as a faster gate:
   ```bash
   pnpm tsgo
   ```
   If that passes, proceed to full build only if needed.

4. Report which modules were built and whether they succeeded.

## Fallback

If change detection fails or touches too many areas, fall back to:
```bash
pnpm build
```
