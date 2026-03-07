# Repository Map

## What This Repository Is

OpenClaw is a multi-channel AI gateway that bridges messaging platforms (Telegram, Discord, Slack, Signal, iMessage, WhatsApp, LINE, MS Teams, and 30+ others) to LLM providers (OpenAI, Anthropic, Ollama, Bedrock, and many more). It runs as a Node.js CLI/gateway daemon with native companion apps for macOS (SwiftUI), iOS (SwiftUI), and Android (Kotlin Compose), plus a Lit-based web control UI. The core is a modular monolith with a plugin architecture for adding channels and capabilities via workspace extensions.

## Technology Stack

| Layer             | Technology                         | Version           |
| ----------------- | ---------------------------------- | ----------------- |
| Language          | TypeScript (ESM, strict)           | 5.9.3             |
| Runtime           | Node.js                            | >=22.12.0         |
| Package manager   | pnpm (workspaces)                  | 10.23.0           |
| Build             | tsdown                             | 0.21.0-beta.2     |
| Type checker      | tsgo (native TS preview)           | 7.0.0-dev         |
| Tests             | Vitest + V8 coverage               | 4.0.18            |
| Linter            | Oxlint (typescript/unicorn/oxc)    | 1.50.0            |
| Formatter         | Oxfmt                              | 0.35.0            |
| CLI framework     | Commander.js                       | 14.0.3            |
| HTTP server       | Express 5                          | 5.2.1             |
| WebSocket         | ws                                 | 8.19.0            |
| Web UI            | Lit + Vite                         | 3.3.2             |
| Schema validation | Zod 4, Typebox 0.34, AJV 8         |                   |
| macOS/iOS         | Swift 6.2, SwiftUI (Observation)   | Xcode             |
| Android           | Kotlin, Jetpack Compose            | Gradle, SDK 31-36 |
| Database          | SQLite (sqlite-vec), LanceDB (ext) | embedded          |

## Major Domains

| Domain             | Path                                                                                      | Responsibility                                          |
| ------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| CLI                | `src/cli/`, `src/commands/`                                                               | Command parsing, user-facing CLI interface              |
| Gateway            | `src/gateway/`                                                                            | HTTP/WS server, health, protocol, plugin HTTP           |
| Agents             | `src/agents/`                                                                             | Agent runtime, model configs, tools, skills, sandboxing |
| Channels (core)    | `src/telegram/`, `src/discord/`, `src/slack/`, `src/signal/`, `src/imessage/`, `src/web/` | Built-in messaging channel adapters                     |
| Channels (routing) | `src/channels/`, `src/routing/`                                                           | Cross-channel routing, allowlists, transport            |
| Extensions         | `extensions/` (42 packages)                                                               | Plugin channel adapters and capabilities                |
| Plugin SDK         | `src/plugin-sdk/`                                                                         | Public API surface for extensions                       |
| Plugins runtime    | `src/plugins/`                                                                            | Plugin discovery, loading, lifecycle                    |
| Config             | `src/config/`, `src/secrets/`                                                             | YAML config, sessions, secret management                |
| Providers          | `src/providers/`                                                                          | LLM provider abstraction and routing                    |
| Media              | `src/media/`, `src/media-understanding/`                                                  | Media pipeline, transcoding, analysis                   |
| Infra              | `src/infra/`                                                                              | Network, TLS, port management, env normalization        |
| Web UI             | `ui/`                                                                                     | Lit web components for gateway control plane            |
| macOS app          | `apps/macos/`                                                                             | SwiftUI menubar app with IPC bridge                     |
| iOS app            | `apps/ios/`                                                                               | SwiftUI app + Watch + Share extension                   |
| Android app        | `apps/android/`                                                                           | Kotlin Compose app                                      |
| Skills             | `skills/`                                                                                 | Agent skill definitions (community-managed)             |
| Docs               | `docs/`                                                                                   | Mintlify documentation (26 sections + i18n)             |

## Navigation Guide

| To change...               | Look in...                                                     |
| -------------------------- | -------------------------------------------------------------- |
| CLI commands or flags      | `src/commands/` (implementation), `src/cli/program/` (wiring)  |
| Gateway server behavior    | `src/gateway/server/` (HTTP/WS), `src/gateway/protocol/`       |
| A specific channel adapter | `src/telegram/`, `src/discord/`, etc. or `extensions/<name>/`  |
| Channel routing logic      | `src/routing/resolve-route.ts`, `src/channels/`                |
| LLM provider config        | `src/agents/models-config.providers.ts`                        |
| Agent tools or skills      | `src/agents/tools/`, `src/agents/skills/`                      |
| Plugin SDK exports         | `src/plugin-sdk/` (types and re-exports)                       |
| Plugin loading             | `src/plugins/discovery.ts`, `src/plugins/enable.ts`            |
| Configuration schema       | `src/config/`, `src/plugins/config-schema.ts`                  |
| Secret management          | `src/secrets/`                                                 |
| Media processing           | `src/media/` (pipeline), `src/media-understanding/` (analysis) |
| Web control UI             | `ui/src/` (Lit components)                                     |
| macOS app                  | `apps/macos/Sources/` (SwiftUI)                                |
| iOS app                    | `apps/ios/Sources/` (SwiftUI)                                  |
| Android app                | `apps/android/app/` (Kotlin)                                   |
| Build/bundler config       | `tsdown.config.ts`, `tsconfig.json`                            |
| Linter/formatter rules     | `.oxlintrc.json`, `.oxfmtrc.jsonc`                             |
| Test configuration         | `vitest.config.ts` and variant configs                         |
| CI workflows               | `.github/workflows/`                                           |
| Documentation              | `docs/` (English), `docs/zh-CN/` (generated Chinese)           |

## Dependency Flow

```
CLI (src/cli/, src/commands/)
  └─→ Gateway (src/gateway/)
        ├─→ Channels core (src/telegram/, src/discord/, src/slack/, ...)
        ├─→ Plugins runtime (src/plugins/) ─→ Extensions (extensions/*)
        │     └─→ Plugin SDK (src/plugin-sdk/)
        ├─→ Agents (src/agents/) ─→ Providers (src/providers/)
        ├─→ Routing (src/routing/, src/channels/)
        ├─→ Media (src/media/)
        ├─→ Config (src/config/) ─→ Secrets (src/secrets/)
        └─→ Infra (src/infra/)

Native Apps (apps/macos, apps/ios, apps/android)
  └─→ Gateway (HTTP/WS IPC, protocol-gen'd models)

Web UI (ui/)
  └─→ Gateway (HTTP/WS)
```

The gateway is the central orchestration point. Native apps and the web UI communicate with the gateway over HTTP/WebSocket using a protocol defined in `src/gateway/protocol/` with generated Swift models (`apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`).
