---
name: deploy-check
description: |
  Pre-deployment and pre-release verification checklist. Use when user says:
  "deploy check", "release check", "ready to release", "pre-deploy",
  "release checklist", "can we ship", "pre-release verification"
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
---

# Deploy / Release Check

Run all verification steps before a release.

## Steps

1. **Release check script**:
   ```bash
   node --import tsx scripts/release-check.ts
   ```

2. **Full quality gate**:
   ```bash
   pnpm check          # format + types + lint + custom rules
   pnpm test           # all tests
   ```

3. **Install smoke test**:
   ```bash
   pnpm test:install:smoke
   # Or for non-root:
   OPENCLAW_INSTALL_SMOKE_SKIP_NONROOT=1 pnpm test:install:smoke
   ```

4. **Protocol consistency** (if gateway/protocol changed):
   ```bash
   pnpm protocol:check
   ```

5. **Version locations** — verify all are in sync:
   - `package.json` (CLI version)
   - `apps/android/app/build.gradle.kts` (versionName/versionCode)
   - `apps/ios/Sources/Info.plist` + `apps/ios/Tests/Info.plist`
   - `apps/macos/Sources/OpenClaw/Resources/Info.plist`
   - `docs/install/updating.md` (pinned npm version)

6. **Changelog review**:
   - `CHANGELOG.md` has entries for this version
   - `### Changes` first, `### Fixes` second
   - User-facing only, deduped, ranked by impact

7. **Docker build** (if Dockerfile changed):
   ```bash
   pnpm test:docker:all
   ```

8. Report pass/fail for each step.

## Do NOT

- Change version numbers without explicit consent
- Run `npm publish` without explicit approval
- Touch `appcast.xml` unless cutting a macOS Sparkle release
