# Data Model Documentation

This documents the core data structures, their relationships, and persistence patterns in OpenClaw.

## Configuration Model

### OpenClawConfig (`src/config/types.openclaw.ts`)

The root configuration type loaded from `~/.openclaw/config.yml`:

```
OpenClawConfig
├── meta              # Version tracking (lastTouchedVersion, lastTouchedAt)
├── auth              # Authentication mode and tokens
├── env               # Environment variable overrides
├── logging           # Log levels and output config
├── cli               # CLI-specific settings
├── update            # Auto-update channel (stable/beta/dev)
├── browser           # Headless browser config for agent tools
├── ui                # UI customization (accent color, assistant name/avatar)
├── secrets           # Secret storage config
├── skills            # Skill definitions and filters
├── plugins           # Plugin enable/deny, extension config
├── models            # Model aliases, defaults, provider config
├── agents            # Agent definitions and defaults
├── tools             # Agent tool configuration
├── bindings[]        # Agent routing bindings (AgentBinding[])
├── channels          # Per-channel configuration
├── session           # Session behavior (typing intervals, etc.)
├── hooks             # Lifecycle hooks (Gmail watcher, etc.)
├── gateway           # Gateway server settings (port, TLS, etc.)
├── memory            # SQLite-based memory/indexing config
└── ...               # Additional sections (cron, broadcast, audio, etc.)
```

### Agent Bindings (`src/config/types.agents.ts`)

Bindings map inbound messages to agents. Two types:

**AgentRouteBinding** — Standard routing:

```typescript
{
  type?: "route",       // Default, can be omitted
  agentId: string,      // Target agent ID
  match: {
    channel: string,    // "telegram", "discord", etc.
    accountId?: string, // Bot account identifier
    peer?: {
      kind: ChatType,   // "direct" | "group" | "channel"
      id: string,       // Sender/chat identifier
    },
    guildId?: string,   // Discord server ID
    teamId?: string,    // Slack workspace ID
    roles?: string[],   // Discord role IDs
  }
}
```

**AgentAcpBinding** — ACP (Agent Control Plane) routing with session mode overrides.

### Agent Config (`src/config/types.agents.ts`)

```typescript
{
  id: string,                    // Unique agent identifier
  default?: boolean,             // Is this the default agent?
  name?: string,                 // Display name
  workspace?: string,            // Working directory path
  agentDir?: string,             // Agent-specific config directory
  model?: AgentModelConfig,      // Provider + model selection
  skills?: string[],             // Skill allowlist (omit = all, [] = none)
  heartbeat?: {...},             // Periodic health check settings
  identity?: IdentityConfig,     // Agent persona
  groupChat?: GroupChatConfig,   // Group chat behavior
  sandbox?: AgentSandboxConfig,  // Code execution sandboxing
}
```

## Session Model

### Session Storage

Sessions are stored as **append-only JSONL files** at `~/.openclaw/sessions/`.

Each session file is identified by a session key derived from the routing result:

```
{agentId}:{channel}:{accountId}:{peerKind}:{peerId}
```

### Session Entry Structure

Each line in the JSONL file is a message entry:

```typescript
{
  type: "message",
  parentId: string,        // REQUIRED — links to previous message, forms a DAG
  role: "user" | "assistant" | "system",
  content: string,
  timestamp: string,       // ISO 8601
  // ... additional metadata
}
```

**Critical invariant:** Every entry MUST have a `parentId` linking it to the previous message in the conversation. Missing `parentId` breaks:

- Session compaction (garbage collection of old messages)
- History tracing (conversation threading)
- Native app display (broken conversation view)

### Session Key Resolution

**`src/routing/session-key.ts`** defines key construction:

- `buildAgentPeerSessionKey()` — Full key with peer scope
- `buildAgentMainSessionKey()` — Collapsed key for DM sessions
- DM scope options: `main`, `per-peer`, `per-channel-peer`, `per-account-channel-peer`

## Routing Model

### ResolvedAgentRoute (`src/routing/resolve-route.ts`)

The output of message routing:

```typescript
{
  agentId: string,          // Resolved target agent
  channel: string,          // Originating channel
  accountId: string,        // Bot account used
  sessionKey: string,       // Session file identifier
  mainSessionKey: string,   // Collapsed DM key
  matchedBy: string,        // How the binding was matched (for debugging)
}
```

`matchedBy` values (priority order): `binding.peer` → `binding.peer.parent` → `binding.guild+roles` → `binding.guild` → `binding.team` → `binding.account` → `binding.channel` → `default`

## Plugin Model

### Plugin Package Metadata

Extensions declare themselves in `package.json`:

```json
{
  "name": "@openclaw/ext-msteams",
  "openclaw": {
    "extensions": true,
    "channel": "msteams"
  }
}
```

### Plugin Enable State (`src/plugins/enable.ts`)

```typescript
type PluginEnableResult = {
  config: OpenClawConfig; // Updated config
  enabled: boolean; // Whether plugin was enabled
  reason?: string; // Why it wasn't enabled
};
```

A plugin is blocked if:

- `cfg.plugins.enabled === false` (global toggle)
- `cfg.plugins.deny` includes the plugin ID

## Channel Account Snapshot

### ChannelAccountSnapshot (`src/channels/plugins/types.ts`)

Runtime state for a monitored channel account:

```typescript
{
  channelId: string,       // Channel identifier
  accountId: string,       // Account identifier
  running: boolean,        // Is the monitor active?
  restartPending: boolean, // Is a restart scheduled?
  lastEventAt?: number,    // Timestamp of last received event
  // ... health and connection state
}
```

Used by `createReadinessChecker()` to evaluate channel health.

## Secret Storage

### Credential Files (`src/secrets/`)

Secrets are stored at `~/.openclaw/credentials/` as individual encrypted files. The secrets module provides:

- `getSecret(key)` — Retrieve a credential
- `setSecret(key, value)` — Store a credential
- `deleteSecret(key)` — Remove a credential
- `auditSecrets()` — List all stored secret keys without values

47 files in `src/secrets/` handle the full lifecycle including API key rotation (`src/agents/api-key-rotation.ts`).

## Media Model

### Media Pipeline (`src/media/`)

Processes media attachments from channel messages:

- Image processing via sharp (resize, format conversion)
- Audio transcoding
- MIME type validation from content bytes (NOT from declared Content-Type)
- Media understanding via vision/audio LLM providers (`src/media-understanding/`)

### MsgContext Media Fields

```typescript
{
  Attachments?: [{
    url?: string,
    localPath?: string,
    mimeType: string,       // Validated from content, not headers
    size?: number,
    // ... per-channel metadata
  }],
  MediaUnderstanding?: string,  // LLM-generated description of media
}
```

## Gateway Protocol

### IPC Schema (`src/gateway/protocol/schema/`)

TypeBox-based schema definitions for native app communication:

- 23+ schema files covering agents, channels, config, sessions, frames, errors
- Compiled to JSON Schema via `pnpm protocol:gen`
- Generated to Swift models via `pnpm protocol:gen:swift`
- Validated at runtime using AJV

Protocol models live at `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift` (generated — do not edit).
