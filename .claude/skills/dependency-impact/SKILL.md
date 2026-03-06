---
name: dependency-impact
description: |
  Analyze blast radius of code changes. Use when user says:
  "what does this affect", "blast radius", "impact analysis", "dependency impact",
  "who uses this", "what imports this", "downstream consumers"
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
---

# Dependency Impact Analysis

Determine what code is affected by changes to a given file or module.

## Steps

1. Identify the changed files:
   ```bash
   git diff --name-only main...HEAD
   ```

2. For each changed file, find all importers:
   ```bash
   # Find files that import from the changed module
   grep -rl "from.*changed-module" src/ extensions/ --include="*.ts"
   ```

3. Map to module boundaries:
   - `src/plugin-sdk/**` changes → ALL extensions affected (42 packages)
   - `src/channels/**` changes → all core channels + routing
   - `src/gateway/protocol/**` → native apps (macOS/iOS/Android) need protocol regen
   - `src/config/**` → nearly all modules depend on config
   - `src/infra/**` → nearly all modules depend on infra

4. Check for cross-boundary impacts:
   - Plugin SDK export changes → run `pnpm build:plugin-sdk:dts` and check for breakage
   - Protocol changes → run `pnpm protocol:check`
   - Channel interface changes → check all `extensions/*/src/index.ts`

5. Produce a risk assessment:
   - **High risk**: changes to `src/plugin-sdk/`, `src/gateway/protocol/`, `src/config/`
   - **Medium risk**: changes to `src/channels/`, `src/routing/`, `src/agents/schema/`
   - **Low risk**: changes isolated to a single channel or extension

6. Report affected modules, downstream consumers, and recommended test commands.
