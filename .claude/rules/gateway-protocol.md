---
paths:
- 'src/gateway/**'
- 'src/gateway/protocol/**'
- 'src/gateway/server/**'
- 'src/gateway/server-methods/**'
---

# Gateway Protocol Rules

## Hard Rules

- **ALWAYS** write Pi transcript messages via `SessionManager.appendMessage(...)` — never raw JSONL writes. Missing `parentId` severs the leaf path and breaks compaction/history
- **ALWAYS** regenerate protocol models after schema changes: `pnpm protocol:gen` then `pnpm protocol:gen:swift`
- **ALWAYS** verify with `pnpm protocol:check` before committing protocol changes
- Probe routes MUST remain reachable even with root-mounted control UI
- Gateway tests MUST use `--pool=forks` for process isolation

## Protocol Generation Flow

```
src/gateway/protocol/ (TypeScript schema)
  → pnpm protocol:gen → dist/protocol.schema.json
  → pnpm protocol:gen:swift → apps/macos/Sources/OpenClawProtocol/GatewayModels.swift
  → pnpm protocol:check → verify both match source
```
