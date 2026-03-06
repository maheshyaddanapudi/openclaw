<!-- This supplements the root CLAUDE.md. Read that first. -->

# Plugin Runtime

Plugin discovery, loading, lifecycle management, and hook system.

## Key Files

- `discovery.ts` → `PluginCandidate` — filesystem scanning from workspace + bundled + config dirs
- `manifest.ts` → `OpenClawPackageManifest` — parses `openclaw` field from extension `package.json`
- `enable.ts` — plugin enable/disable with config-driven allowlist/denylist
- `config-state.ts` — plugin config persistence
- `config-schema.ts` — plugin config schema validation
- `hook-runner-global.ts` — global hook runner for plugin lifecycle events
- `bundled-sources.ts` — resolves bundled plugin locations

## Plugin Lifecycle

1. **Discovery**: scan filesystem for candidates (workspace, bundled, user config dir)
2. **Manifest parsing**: read `package.json` → `openclaw.extensions[]` entry points
3. **Enable/disable**: config-driven allowlist with channel normalization
4. **Loading**: resolve entry points via jiti, register with gateway
5. **Hooks**: `before-agent-start`, `before-tool-call`, `after-tool-call`, etc.

## Gotchas

- Plugin entry points resolved via `.ts`, `.js`, `.mts`, `.cts`, `.mjs`, `.cjs` extensions
- Bundled plugins dir resolved from `bundled-dir.ts` — not hardcoded
- Path safety checks (`path-safety.ts`) validate plugin paths are inside allowed directories
- Plugin HTTP handlers registered via `src/gateway/server/plugins-http.ts` — not in this module
