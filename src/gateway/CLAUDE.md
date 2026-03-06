<!-- This supplements the root CLAUDE.md. Read that first. -->

# Gateway

HTTP/WebSocket server orchestrating channels, agents, plugins, and native app IPC.

## Key Entry Points

- `server/http-listen.ts` → `listenGatewayHttpServer()` — HTTP server with TLS and retry
- `server/ws-connection.ts` — WebSocket connection handling
- `server/plugins-http.ts` — plugin HTTP endpoint registration
- `server/readiness.ts` — channel-backed readiness probes
- `server/health-state.ts` — health monitoring
- `protocol/` — IPC protocol schema (TS → JSON Schema → Swift)
- `server-methods/` — RPC handler implementations
- `credentials.ts` — credential management

## Unique Conventions

- **ALWAYS** write Pi transcript messages via `SessionManager.appendMessage(...)` — never raw JSONL writes (missing `parentId` breaks compaction/history)
- Protocol models are generated: run `pnpm protocol:gen` (TS schema) then `pnpm protocol:gen:swift` (Swift models). Verify with `pnpm protocol:check`
- Gateway tests use `--pool=forks` for process isolation: `pnpm test:gateway`
- Probe routes must stay reachable even with root-mounted control UI

## Commands

```bash
pnpm test:gateway           # gateway tests (vitest, forks pool)
pnpm gateway:dev            # dev mode, skip channel init
pnpm gateway:watch          # file watching mode
pnpm protocol:gen           # regenerate protocol JSON schema
pnpm protocol:gen:swift     # regenerate Swift protocol models
pnpm protocol:check         # verify generated files match source
```
