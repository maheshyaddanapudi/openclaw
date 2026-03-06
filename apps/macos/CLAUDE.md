<!-- This supplements the root CLAUDE.md. Read that first. -->

# macOS App

SwiftUI menubar application. Entirely different language and toolchain from core.

## Technology

- **Language**: Swift 6.2 with SwiftUI
- **State**: Observation framework (`@Observable`, `@Bindable`) — NOT `ObservableObject`/`@StateObject`
- **Formatting**: SwiftFormat (`.swiftformat` at repo root) — 4-space indent, 120 char width
- **Linting**: SwiftLint (`.swiftlint.yml` at repo root)
- **Build**: Xcode

## Key Patterns

- **ALWAYS** use `@Observable` (Observation framework) for new state — migrate `ObservableObject` when touching related code
- **NEVER** rebuild over SSH — builds must run directly on the Mac
- Central state: `apps/macos/Sources/OpenClaw/AppState.swift`
- Protocol models are **generated**: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift` — regenerate via `pnpm protocol:gen:swift`
- IPC with Node.js gateway over HTTP/WebSocket

## Commands

```bash
pnpm mac:package        # package app (scripts/package-mac-app.sh)
pnpm mac:open           # open built app
pnpm mac:restart        # restart via scripts/restart-mac.sh
pnpm format:swift       # SwiftFormat lint
pnpm lint:swift         # SwiftLint check
pnpm protocol:check     # verify generated protocol models are up to date
```

## Gateway Interaction

- Start/stop gateway via the app, not ad-hoc tmux sessions
- Verify with: `launchctl print gui/$UID | grep openclaw`
- Logs: `./scripts/clawlog.sh` (unified log query, expects passwordless sudo)
