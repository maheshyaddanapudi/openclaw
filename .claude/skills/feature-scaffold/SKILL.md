---
name: feature-scaffold
description: |
  Generate boilerplate for new features following project patterns. Use when user says:
  "scaffold a new channel", "add a new extension", "create new command",
  "new feature boilerplate", "scaffold", "generate template"
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
---

# Feature Scaffold

Generate boilerplate following existing project patterns.

## Supported Scaffolds

### New Channel Extension
1. Read an existing extension for pattern (e.g., `extensions/msteams/`):
   - `package.json` with `openclaw.extensions` and `openclaw.channel` metadata
   - `src/index.ts` exporting monitor, probe, send, credentials functions
   - `src/monitor.ts`, `src/probe.ts`, `src/send.ts`, `src/token.ts`
2. Create `extensions/<name>/` with:
   - `package.json` (set version to match root, add `openclaw` metadata)
   - `src/index.ts` (canonical exports)
   - `src/monitor.ts`, `src/probe.ts`, `src/send.ts`, `src/token.ts`
3. Add plugin SDK export in root `package.json` (`./plugin-sdk/<name>`)
4. Add entry in `tsdown.config.ts`
5. Update `.github/labeler.yml`
6. Create `docs/channels/<name>.md`

### New CLI Command
1. Read an existing command in `src/commands/` for pattern
2. Create `src/commands/<name>.ts` with Commander.js action
3. Register in `src/cli/program/command-registry.ts`
4. Create colocated `src/commands/<name>.test.ts`

### New Agent Tool
1. Read `src/agents/tools/` for pattern (e.g., `browser-tool.ts` + `browser-tool.schema.ts`)
2. Create tool implementation and schema using `stringEnum`/`optionalStringEnum`
3. Create colocated test file
4. Register in the tool catalog

## Rules
- ALWAYS read existing patterns first — never use hardcoded templates
- ALWAYS create colocated `*.test.ts` files
- Follow naming conventions: **OpenClaw** for headings, `openclaw` for CLI/paths
