# System Architecture Summary

This document describes what OpenClaw does at runtime and how its components interact. It complements the structural overview in `docs/architecture/repo-map.md` with runtime behavior and data flows.

## What OpenClaw Does at Runtime

OpenClaw is a long-running Node.js daemon that:

1. **Receives messages** from 40+ messaging platforms (Telegram, Discord, Slack, WhatsApp, Signal, iMessage, LINE, MS Teams, and extensions)
2. **Routes messages** to configured AI agents based on channel, account, and peer bindings
3. **Executes agent logic** — sends prompts to LLM providers (OpenAI, Anthropic, Ollama, Bedrock, etc.), runs tools, and manages conversation sessions
4. **Sends responses** back through the originating channel
5. **Serves a control plane** — HTTP/WebSocket server for native apps (macOS/iOS/Android) and the Lit web UI

## Component Inventory

### Entry Point Chain

```
openclaw.mjs (Node version guard)
  → src/entry.ts (env normalization, respawn for warnings, profile parsing)
    → src/cli/run-main.ts → runCli() (dotenv, runtime guard, CLI routing)
      → src/cli/program.ts → buildProgram() (Commander.js wiring)
        → src/cli/program/command-registry.ts (registers all subcommands)
```

The `gateway` subcommand starts the main daemon. Other commands (`agent`, `channels`, `config`, `status`, `models`, `onboard`) are utility CLIs that may connect to a running gateway.

### Gateway Server (`src/gateway/`)

The gateway is the central orchestration hub:

- **`server/http-listen.ts`** — `listenGatewayHttpServer()`: Binds HTTP with EADDRINUSE retry (4 attempts, 500ms intervals). Throws `GatewayLockError` if port is occupied.
- **`server/ws-connection.ts`** — WebSocket connection handling for native app IPC
- **`server/plugins-http.ts`** — Registers plugin HTTP endpoints (webhooks, OAuth callbacks)
- **`server/readiness.ts`** — `createReadinessChecker()`: Channel-backed readiness probes with cached health evaluation and grace periods for restart cycles
- **`server/health-state.ts`** — Aggregated health monitoring
- **`server/http-auth.ts`** — Gateway credential verification
- **`server/hooks.ts`** — Lifecycle hooks (pre/post channel start)

### Channel Adapters

Each channel follows the **monitor/probe/send** pattern:

| Function                   | Signature                                  | Purpose                                         |
| -------------------------- | ------------------------------------------ | ----------------------------------------------- |
| `monitorXxxProvider(opts)` | Returns `{ account, handleWebhook, stop }` | Long-running connection/webhook listener        |
| `probeXxx(token)`          | Returns `{ ok, error?, bot? }`             | Health check without starting a full connection |
| `sendXxxReply(...)`        | Returns message IDs                        | Send response back to channel                   |

Channels register webhooks via `registerPluginHttpRoute()` and manage lifecycle through `recordChannelRuntimeState()`.

### Routing Engine (`src/routing/resolve-route.ts`)

`resolveAgentRoute(input)` takes `{ cfg, channel, accountId, peer, parentPeer, guildId, teamId, memberRoleIds }` and returns `{ agentId, sessionKey, matchedBy }`.

Binding match priority (highest to lowest):

1. `binding.peer` — exact peer ID match
2. `binding.peer.parent` — parent thread peer match
3. `binding.guild+roles` — Discord guild + member roles
4. `binding.guild` — Discord guild
5. `binding.team` — Slack team
6. `binding.account` — channel account
7. `binding.channel` — channel type
8. `default` — fallback to default agent

### Agent Runtime (`src/agents/`)

- **`agent-scope.ts`** — Agent context and lifecycle
- **`models-config.providers.ts`** — LLM provider definitions (OpenAI, Anthropic, Ollama, Bedrock, Copilot, and many more)
- **`api-key-rotation.ts`** — Rotates API keys across configured providers
- **`tools/`** — Agent tool implementations
- **`skills/`** — Skill definitions (community-managed)
- **`sandbox/`** — Code execution sandboxing

### Plugin System (`src/plugins/`)

- **`discovery.ts`** — Scans `extensions/` for packages with `openclaw.extensions` in `package.json`
- **`enable.ts`** — `enablePluginInConfig()`: Validates against deny list, updates config
- **`config-state.ts`** / **`config-schema.ts`** — Plugin configuration management
- **`runtime/`** — Plugin lifecycle management

## Integration Points

| System                  | Protocol                    | Direction     | Module                  |
| ----------------------- | --------------------------- | ------------- | ----------------------- |
| Telegram                | Bot API (Grammy)            | Bidirectional | `src/telegram/`         |
| Discord                 | Gateway + REST (Carbon)     | Bidirectional | `src/discord/`          |
| Slack                   | Events API + Web API (Bolt) | Bidirectional | `src/slack/`            |
| WhatsApp                | Baileys (WebSocket)         | Bidirectional | `src/web/`              |
| Signal                  | signal-cli bridge           | Bidirectional | `src/signal/`           |
| iMessage                | AppleScript/BlueBubbles     | Bidirectional | `src/imessage/`         |
| LINE                    | Messaging API (Bot SDK)     | Bidirectional | `src/line/`             |
| 35+ others              | Various (via extensions)    | Bidirectional | `extensions/`           |
| OpenAI, Anthropic, etc. | REST API                    | Outbound      | `src/providers/`        |
| Native apps             | HTTP/WS (gateway protocol)  | Bidirectional | `src/gateway/protocol/` |
| Web UI                  | HTTP/WS                     | Bidirectional | `ui/` → gateway         |
| SQLite                  | Embedded                    | Local         | Sessions, sqlite-vec    |

## Configuration Surface

| What                | Where                          | Format                        |
| ------------------- | ------------------------------ | ----------------------------- |
| Main config         | `~/.openclaw/config.yml`       | YAML                          |
| Agent definitions   | `agents.list[]` in config      | YAML                          |
| Channel bindings    | `bindings[]` in config         | YAML                          |
| Secrets/credentials | `~/.openclaw/credentials/`     | Encrypted files               |
| Plugin config       | `plugins.*` in config          | YAML                          |
| Sessions            | `~/.openclaw/sessions/`        | JSONL per conversation        |
| Gateway protocol    | `src/gateway/protocol/schema/` | TypeBox → JSON Schema → Swift |
