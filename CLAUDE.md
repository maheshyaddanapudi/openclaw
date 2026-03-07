# OpenClaw — Claude Code Guide

OpenClaw is a multi-channel AI gateway (TypeScript ESM, Node 22+, pnpm 10) that bridges 40+ messaging platforms to LLM providers. It ships as a CLI/gateway daemon with native apps (macOS/iOS SwiftUI, Android Kotlin Compose) and a Lit web UI. Extensions live under `extensions/` as pnpm workspace packages.

> **Note:** `AGENTS.md` at the repo root is the project's internal contributor/maintainer guide — it is NOT Claude Code configuration. This `CLAUDE.md` file is the Claude Code configuration.

## Essential Commands

```bash
# Install
pnpm install

# Build (skip tests)
pnpm build

# Full check (format + types + lint + custom rules)
pnpm check

# Type-check only
pnpm tsgo

# Lint/format
pnpm lint                  # oxlint --type-aware
pnpm format:fix            # oxfmt --write

# Tests
pnpm test                  # all tests (parallel)
pnpm test:fast             # unit tests only
pnpm exec vitest run src/routing/resolve-route.test.ts          # single file
pnpm exec vitest run src/routing/resolve-route.test.ts -t "pattern"  # single test
pnpm test:coverage         # V8 coverage (70% threshold)
pnpm test:gateway          # gateway tests (forks pool)
pnpm test:extensions       # extension tests

# Low-memory hosts
OPENCLAW_TEST_PROFILE=low OPENCLAW_TEST_SERIAL_GATEWAY=1 pnpm test

# Dev run
pnpm openclaw <command>
pnpm gateway:dev           # gateway only, skip channel init

# Commit (scoped staging — prefer over git add/commit)
scripts/committer "fix(scope): message" file1.ts file2.ts
```

## Architecture

Modular monolith with plugin architecture. Gateway is the central orchestration hub.

| Directory | Purpose |
|-----------|---------|
| `src/cli/`, `src/commands/` | CLI wiring (Commander.js) and command implementations |
| `src/gateway/` | HTTP/WS server, protocol, health, plugin HTTP endpoints |
| `src/agents/` | Agent runtime, model configs, tools, skills, sandboxing |
| `src/telegram/`, `src/discord/`, `src/slack/`, `src/signal/`, `src/imessage/`, `src/web/`, `src/line/` | Core channel adapters |
| `src/channels/`, `src/routing/` | Cross-channel routing, allowlists, transport |
| `src/plugins/`, `src/plugin-sdk/` | Plugin discovery/loading and SDK exports |
| `src/config/`, `src/secrets/` | YAML config, sessions, secret management |
| `src/providers/` | LLM provider abstraction |
| `src/media/` | Media pipeline and transcoding |
| `src/infra/` | Network, TLS, port mgmt, env normalization |
| `extensions/` | 42 plugin packages (`@openclaw/*`) |
| `ui/` | Lit web components (Vite build) |
| `apps/macos/`, `apps/ios/` | SwiftUI native apps |
| `apps/android/` | Kotlin Compose app |
| `skills/` | Agent skill definitions |
| `docs/` | Mintlify docs (26 sections + i18n) |

## Code Patterns

- **NEVER** add `@ts-nocheck` or disable `no-explicit-any` — fix root causes instead.
- **NEVER** mix `await import("x")` and static `import x from "x"` for the same module. Create a `*.runtime.ts` boundary for lazy loading. After changes, run `pnpm build` and check for `[INEFFECTIVE_DYNAMIC_IMPORT]` warnings.
- **NEVER** share class behavior via prototype mutation (`applyPrototypeMixins`, `Object.defineProperty` on `.prototype`). Use explicit inheritance/composition.
- **NEVER** update the Carbon dependency (Discord).
- **NEVER** use `Type.Union` in tool input schemas — use `stringEnum`/`optionalStringEnum` instead. No `anyOf`/`oneOf`/`allOf`. Avoid raw `format` as a property name in schemas.
- **ALWAYS** use `src/cli/progress.ts` for CLI progress indicators — don't hand-roll spinners.
- **ALWAYS** use `src/terminal/table.ts` for status output and `src/terminal/palette.ts` for colors — no hardcoded ANSI.
- **ALWAYS** keep plugin runtime deps in `dependencies` (not `devDependencies`). Avoid `workspace:*` in plugin `dependencies`; put `openclaw` in `devDependencies` or `peerDependencies`.
- **ALWAYS** consider ALL channels (core + extensions) when refactoring shared logic (routing, allowlists, pairing, command gating, onboarding).
- **ALWAYS** update `.github/labeler.yml` and create matching GitHub labels when adding channels/extensions.
- Patched dependencies (`pnpm.patchedDependencies`) must use exact versions (no `^`/`~`). Patching requires explicit approval.
- Dependency injection: use existing `createDefaultDeps` patterns for CLI options.
- Naming: **OpenClaw** for product/headings; `openclaw` for CLI/package/paths/config keys.
- Files: aim for ~500 LOC max; split when it improves clarity.
- Tests: colocated `*.test.ts`; e2e as `*.e2e.test.ts`. Max 16 test workers.
- Commits: Conventional Commits with scope — `fix(feishu):`, `feat(gateway):`, `docs:`.
- Changelog: user-facing changes only, append to end of target section (`### Changes` or `### Fixes`).
- Docs (Mintlify): internal links root-relative without `.md` extension. `docs/zh-CN/` is generated — do not edit directly.

## Task Delegation

For non-trivial tasks, use the Task tool to delegate to specialized subagents.
Choose the right subagent based on the task type:

- New feature or enhancement → delegate to `planner`, then `implementer`
- Bug investigation and fix → delegate to `debugger`, then `implementer`
- Test creation or coverage gaps → delegate to `test-engineer`
- CI/CD workflow changes → delegate to `devops-specialist`
- Documentation updates → delegate to `docs-writer`
- Security-sensitive changes (auth, secrets, media, input validation) → delegate to `security-auditor`
- Code review → delegate to `reviewer`

For multi-phase feature work, orchestrate this delegation chain:
1. `planner` → produces impact analysis, identifies affected modules and files
2. `implementer` → produces code changes following the plan
3. `test-engineer` → produces/updates colocated `*.test.ts` files with Vitest
4. `reviewer` → produces structured review with verdict (APPROVE or REQUEST_CHANGES)

### Post-Review Decision Gate

After the reviewer completes, read `.claude/workflow-config.yml` and evaluate:

**If reviewer verdict is REQUEST_CHANGES with critical findings:**
- If `human_in_loop_at_handoff` is `true`: present findings and ask whether to remediate
- If `human_in_loop_at_handoff` is `false`: automatically delegate the reviewer's
  critical findings (with their fix instructions) back to `implementer` for remediation,
  then re-delegate to `reviewer` for re-review
- Track remediation cycles. Stop after `max_review_remediate_cycles` (from workflow-config.yml, default: 2).
  If critical findings persist after max cycles, STOP and report to user:
  "Remediation attempted N times but these issues remain: [list]. Human review required."

**If reviewer verdict is APPROVE (with or without suggestions):**
- Proceed to next step (delegate to `security-auditor` if sensitive code changed, or proceed to PR/commit).
  Include any suggestions in the summary for human awareness.

**Important**: Subagents cannot spawn other subagents. You (the main agent) must orchestrate all delegation directly.

**Fallback**: If a subagent is unavailable or the Task tool reports it's not found:
1. Inform the user which subagent failed to load
2. Read that agent's prompt from `.claude/agents/{name}.md`
3. Follow the agent's instructions directly in the main context

## Workflow

Read `.claude/workflow-config.yml` for workflow preferences.
- If `human_in_loop_at_handoff` is `true`: pause between phases and present results
- If `human_in_loop_at_handoff` is `false`: proceed autonomously through the full workflow, including the post-review decision gate (auto-remediate on REQUEST_CHANGES, up to `max_review_remediate_cycles` times)
- If `suggest_next_actions` is `true`: suggest 2-4 relevant next actions after completing tasks

## Verification Checklist

Before any PR or commit:

1. `pnpm build` passes without `[INEFFECTIVE_DYNAMIC_IMPORT]` warnings
2. `pnpm check` passes (format + types + lint + custom rules)
3. `pnpm test` passes (or `pnpm test:fast` for unit-only changes)
4. New/changed code has colocated `*.test.ts` files
5. Coverage meets 70% threshold (`pnpm test:coverage`)
6. Commit message follows Conventional Commits: `type(scope): description`
7. No secrets, real phone numbers, or personal hostnames in code/docs
8. CHANGELOG.md updated for user-facing changes (append to section end)

## Do Not Modify

| Path | Reason |
|------|--------|
| `.github/workflows/` | CI/CD pipelines — changes require maintainer review |
| `Dockerfile*`, `docker-compose.yml` | Container infrastructure |
| `apps/macos/`, `apps/ios/`, `apps/android/` | Native apps — owned by specific maintainers |
| `apps/shared/` | Shared Swift code (OpenClawKit) |
| `Swabble/` | Swift utility library |
| `vendor/` | Vendored third-party code |
| `docs/zh-CN/`, `docs/ja-JP/` | Generated i18n — pipeline-managed |
| `docs/.i18n/` | Translation pipeline config |
| `pnpm-lock.yaml` | Lockfile — auto-generated |
| `src/canvas-host/a2ui/.bundle.hash` | Auto-generated bundle hash |
| `patches/` | pnpm dependency patches — requires approval |
| `node_modules/` | Never edit, any install path |

## Documentation Pointers

@docs/architecture/repo-map.md
@docs/architecture/modules.md
@docs/dev/build.md
@docs/system-summary-doc.md
@docs/flow-message-doc.md
@.claude/workflow-config.yml
