# Flow: Gateway Startup

This documents the gateway daemon startup sequence — from CLI command to fully operational server.

## Overview

```
CLI "gateway" command → Config load → HTTP/WS server bind → Plugin discovery
  → Channel monitors start → Sidecars start → Readiness check → Operational
```

## Step 1: CLI Entry

**`src/cli/gateway-cli/run.ts`** — Gateway CLI command handler

The `openclaw gateway` command (or just `openclaw` with default action) triggers gateway startup:

1. Parses CLI flags (port, bind host, TLS options, skip-channels)
2. Loads configuration via `loadConfig()`
3. Acquires a gateway lock (prevents duplicate instances)

**Dev shortcuts:**

- `pnpm gateway:dev` — Starts gateway, skips channel initialization
- `pnpm gateway:watch` — Starts with file watching for auto-reload

## Step 2: Server Construction

**`src/gateway/server.impl.ts`** / **`src/gateway/server.ts`** — Server factory

Constructs the Express 5 HTTP server and WebSocket (ws) server:

- Express middleware chain (auth, CORS, body parsing)
- WebSocket upgrade handler for native app IPC
- Plugin HTTP endpoint registration via `src/gateway/server/plugins-http.ts`
- Health and readiness endpoints

## Step 3: HTTP/WS Bind

**`src/gateway/server/http-listen.ts`** — `listenGatewayHttpServer()`

Binds the HTTP server with retry logic:

- Up to 4 retries on `EADDRINUSE` (500ms interval) — handles port still in TIME_WAIT
- TLS configuration via `src/gateway/server/tls.ts` if enabled
- Throws `GatewayLockError` if binding fails after retries

## Step 4: Plugin Discovery and Loading

**`src/plugins/discovery.ts`** — Scans for plugins

Discovers extension packages under `extensions/` by looking for `openclaw.extensions` metadata in `package.json`. Each plugin declares:

- `openclaw.channel` — channel identifier
- Entry point module with monitor/probe/send exports

**`src/plugins/enable.ts`** — `enablePluginInConfig()`

- Checks deny list (`cfg.plugins.deny`)
- Checks global plugins toggle (`cfg.plugins.enabled`)
- Updates config allowlist via `ensurePluginAllowlisted()`

**`src/plugins/services.ts`** — `startPluginServices()`

- Initializes plugin runtime services
- Registers plugin HTTP endpoints (webhooks, OAuth callbacks)

## Step 5: Channel Monitor Startup

For each configured channel account, the gateway starts a monitor:

```
For each channel in (core channels + enabled plugins):
  For each account configured for that channel:
    1. Validate credentials (probe)
    2. Start monitorXxxProvider(opts) → long-running webhook/socket
    3. Register webhook routes via registerPluginHttpRoute()
    4. Record runtime state via recordChannelRuntimeState()
```

Channel monitors run concurrently. Each monitor returns `{ account, handleWebhook, stop }`.

**Skip option:** `pnpm gateway:dev` skips channel initialization for faster local development.

## Step 6: Sidecar Services

**`src/gateway/server-startup.ts`** — `startGatewaySidecars()`

After the main server binds, sidecars initialize:

1. **Session lock cleanup** — `cleanStaleLockFiles()`: Removes lock files older than 30 minutes from all agent session directories
2. **Browser control server** — `startBrowserControlServerIfEnabled()`: Optional headless browser for agent tool use
3. **Gmail watcher** — `startGmailWatcherWithLogs()`: If `hooks.gmail.account` is configured, starts watching for inbound emails
4. **Internal hooks** — `loadInternalHooks()` + `triggerInternalHook()`: Lifecycle hooks for plugin notifications
5. **Memory backend** — `startGatewayMemoryBackend()`: SQLite-based memory for session indexing
6. **Model catalog** — `loadModelCatalog()`: Validates configured model references
7. **Restart sentinel** — `shouldWakeFromRestartSentinel()` / `scheduleRestartSentinelWake()`: Handles graceful restart after updates

## Step 7: Readiness

**`src/gateway/server/readiness.ts`** — `createReadinessChecker()`

The readiness checker evaluates channel health:

- Each channel account's connection state is evaluated via `evaluateChannelHealth()`
- Grace period for initial connection (`DEFAULT_CHANNEL_CONNECT_GRACE_MS`)
- Stale event threshold for detecting zombie connections
- Results cached for 1 second to avoid thundering herd

A channel is considered healthy if:

- Running and receiving events within the stale threshold, OR
- In startup grace period, OR
- Restart pending (backoff before next lifecycle attempt)

Readiness failures are reported at the `/health` endpoint.

## Step 8: Config Reload

**`src/gateway/config-reload.ts`** — Hot reload on config file changes

The gateway watches `~/.openclaw/config.yml` for changes:

- Computes a reload plan via `config-reload-plan.ts`
- Applies changes without full restart when possible (model changes, binding updates)
- Restarts affected channel monitors when channel config changes
- Full restart triggered for structural changes (port, TLS, plugins)

## Key Files

| Step          | File                                | Function                    |
| ------------- | ----------------------------------- | --------------------------- |
| CLI entry     | `src/cli/gateway-cli/run.ts`        | Gateway command handler     |
| Server build  | `src/gateway/server.impl.ts`        | Server factory              |
| HTTP bind     | `src/gateway/server/http-listen.ts` | `listenGatewayHttpServer()` |
| Plugin load   | `src/plugins/discovery.ts`          | Plugin scanning             |
| Plugin enable | `src/plugins/enable.ts`             | `enablePluginInConfig()`    |
| Channel start | `src/gateway/server-channels.ts`    | Channel manager             |
| Sidecars      | `src/gateway/server-startup.ts`     | `startGatewaySidecars()`    |
| Readiness     | `src/gateway/server/readiness.ts`   | `createReadinessChecker()`  |
| Config reload | `src/gateway/config-reload.ts`      | Hot reload handler          |
