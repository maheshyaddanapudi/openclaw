# Module Reference

## Core Modules

### CLI — `src/cli/`
Wires Commander.js program, registers commands, manages pre-action hooks and context.
- Entry: `src/cli/program/build-program.ts` → `buildProgram()`
- Key files: `command-registry.ts` (registers all subcommands), `context.ts` (program context), `help.ts`
- Submodules: `gateway-cli/`, `daemon-cli/`, `node-cli/`, `cron-cli/`, `update-cli/`, `nodes-cli/`
- Imports from: `src/commands/`, `src/config/`, `src/infra/`
- Imported by: `src/entry.ts`

### Commands — `src/commands/`
Implements each CLI subcommand (agent, channels, config, gateway, login, onboard, message, status).
- Key files: `agent/`, `channels/`, `gateway-status/`, `models/`, `onboarding/`, `onboard-non-interactive/`
- Imports from: `src/gateway/`, `src/config/`, `src/channels/`, `src/agents/`, `src/secrets/`
- Imported by: `src/cli/program/command-registry.ts`

### Gateway — `src/gateway/`
HTTP/WebSocket server that orchestrates channels, agents, plugins, and IPC with native apps.
- Entry: `src/gateway/server/http-listen.ts` → `listenGatewayHttpServer()`
- Key dirs: `server/` (HTTP/WS setup, health, hooks), `protocol/` (IPC schema), `server-methods/` (RPC handlers)
- Key files: `server/ws-connection.ts`, `server/plugins-http.ts`, `server/readiness.ts`, `credentials.ts`
- Imports from: `src/agents/`, `src/channels/`, `src/plugins/`, `src/config/`, `src/infra/`
- Imported by: `src/cli/gateway-cli/`, `src/commands/`

### Agents — `src/agents/`
Agent runtime: model configuration, tool execution, skills, sandboxing, provider auth profiles.
- Key files: `models-config.providers.ts` (all LLM providers), `agent-scope.ts`, `api-key-rotation.ts`
- Key dirs: `tools/`, `skills/`, `schema/`, `sandbox/`, `auth-profiles/`, `cli-runner/`, `pi-embedded-runner/`
- Imports from: `src/providers/`, `src/config/`, `src/secrets/`, `src/infra/`
- Imported by: `src/gateway/`, `src/commands/agent/`

### Providers — `src/providers/`
LLM provider abstraction layer (OpenAI, Anthropic, Ollama, Bedrock, Copilot, etc.).
- Imports from: `src/config/`, `src/infra/`
- Imported by: `src/agents/`

### Channels Core — `src/telegram/`, `src/discord/`, `src/slack/`, `src/signal/`, `src/imessage/`, `src/web/`, `src/line/`
Built-in messaging channel adapters. Each has a `monitor/` subdir for connection lifecycle.
- Telegram: Grammy-based bot (`src/telegram/bot/`)
- Discord: Carbon-based (`src/discord/`, `src/discord/voice/`)
- Slack: Bolt-based (`src/slack/`, `src/slack/http/`)
- WhatsApp: Baileys-based (`src/web/`, `src/web/inbound/`)
- Signal: signal-cli bridge (`src/signal/`)
- iMessage: AppleScript/BlueBubbles bridge (`src/imessage/`)
- LINE: LINE Bot SDK (`src/line/`, `src/line/flex-templates/`)
- Imports from: `src/channels/`, `src/routing/`, `src/config/`, `src/media/`
- Imported by: `src/gateway/`, `src/plugins/`

### Channels Infrastructure — `src/channels/`
Cross-channel routing utilities: allowlists, transport, command gating, config, account snapshots.
- Key files: `allow-from.ts`, `command-gating.ts`, `channel-config.ts`, `chat-type.ts`
- Key dirs: `allowlists/`, `plugins/`, `transport/`, `web/`
- Imports from: `src/config/`, `src/routing/`
- Imported by: all channel modules, `src/gateway/`

### Routing — `src/routing/`
Message routing and account resolution across channels.
- Key files: `resolve-route.ts`, `account-id.ts`, `account-lookup.ts`, `bindings.ts`
- Imports from: `src/config/`, `src/channels/`
- Imported by: `src/channels/`, `src/gateway/`

### Plugin SDK — `src/plugin-sdk/`
Public API surface exported to extension plugins via `openclaw/plugin-sdk` subpath imports.
- 52+ subpath exports (core, telegram, discord, slack, signal, imessage, whatsapp, line, msteams, etc.)
- Imports from: `src/channels/`, `src/config/`, `src/agents/`
- Imported by: `extensions/*/`

### Plugins Runtime — `src/plugins/`
Plugin discovery, loading, lifecycle, config schema, and HTTP handler registration.
- Key files: `discovery.ts`, `enable.ts`, `config-state.ts`, `config-schema.ts`, `bundled-sources.ts`
- Key dir: `runtime/`
- Imports from: `src/plugin-sdk/`, `src/config/`
- Imported by: `src/gateway/`

### Config — `src/config/`
YAML-based configuration, session management, agent directories, channel capabilities.
- Key files: `bindings.ts`, `agent-dirs.ts`, `agent-limits.ts`, `allowed-values.ts`
- Key dir: `sessions/`
- Imports from: `src/infra/`
- Imported by: nearly all modules

### Secrets — `src/secrets/`
Secret storage, retrieval, and audit (47 files). Runtime credentials at `~/.openclaw/credentials/`.
- Imports from: `src/config/`, `src/infra/`
- Imported by: `src/agents/`, `src/commands/`, `src/gateway/`

### Media — `src/media/`, `src/media-understanding/`
Media pipeline (transcoding, image processing via sharp) and media analysis (providers for vision/audio).
- Key dir: `src/media-understanding/providers/`
- Imports from: `src/config/`, `src/infra/`
- Imported by: `src/channels/`, `src/agents/`

### Infra — `src/infra/`
Low-level utilities: environment normalization, network helpers, TLS, port management, outbound HTTP.
- Key dirs: `net/`, `tls/`, `outbound/`, `format-time/`
- Imported by: nearly all modules

### Terminal — `src/terminal/`
CLI output formatting: ANSI tables, color palette, progress spinners.
- Key files: `table.ts`, `palette.ts`
- Imports from: `src/infra/`
- Imported by: `src/cli/`, `src/commands/`

## App Modules

### Web UI — `ui/`
Lit web component control plane. Vite build, Lit Signals for state.
- Entry: `ui/src/` → built to `dist/control-ui/`
- Key dirs: `ui/src/ui/` (components), `ui/src/i18n/`, `ui/src/styles/`
- Communicates with gateway over HTTP/WS

### macOS App — `apps/macos/`
SwiftUI menubar application using Observation framework. IPC bridge to Node.js gateway.
- Entry: `apps/macos/Sources/OpenClaw/`
- Key file: `AppState.swift` (@Observable)
- Protocol models: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift` (generated)

### iOS App — `apps/ios/`
SwiftUI app with Share extension, Watch app, Activity widgets. XcodeGen project.
- Entry: `apps/ios/Sources/`
- Config: `apps/ios/Config/`

### Android App — `apps/android/`
Kotlin + Jetpack Compose. Gradle build with ktlint.
- Entry: `apps/android/app/`
- Benchmark: `apps/android/benchmark/`

## Workspace Packages

### Extensions — `extensions/`
42 plugin packages (`@openclaw/<name>`). Each declares `openclaw.extensions` and `openclaw.channel` in its `package.json`. Runtime deps in `dependencies`; `openclaw` in `devDependencies` or `peerDependencies`.

### Compatibility Shims — `packages/clawdbot/`, `packages/moltbot/`
Forwarding shims for legacy package names. Not actively developed.

### Swabble — `Swabble/`
Swift 6.2 utility library (Swift Package Manager). Used by macOS/iOS apps.

### Vendor — `vendor/a2ui/`
Vendored a2ui (canvas host). Bundled via `scripts/bundle-a2ui.sh`.
