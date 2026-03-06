<!-- This supplements the root CLAUDE.md. Read that first. Also see apps/macos/CLAUDE.md for shared Swift patterns. -->

# iOS App

SwiftUI app with Watch extension, Share extension, and Activity widgets.

## Technology (differs from macOS app)

- **Project generation**: XcodeGen via `project.yml` — NOT a committed `.xcodeproj`
- **Swift version**: 6.0, deployment target iOS 18.0
- **Shared code**: `apps/shared/OpenClawKit` (local SPM package, shared with macOS)
- **State**: Observation framework (`@Observable`, `@Bindable`) — same mandate as macOS

## Commands

```bash
pnpm ios:gen            # xcodegen generate (must run before building)
pnpm ios:build          # build for simulator
pnpm ios:run            # build + launch on simulator
pnpm ios:open           # open generated .xcodeproj in Xcode
```

## Key Differences from macOS

- Project defined in `project.yml` (XcodeGen) — regenerate with `pnpm ios:gen` after changes
- Watch extension in `WatchApp/` + `WatchExtension/` with own `@Observable` models
- Share extension in `ShareExtension/`
- Deep linking via `AgentDeepLinkPrompt` struct
- Prefer connected real devices over simulators for testing
- Signing config: `scripts/ios-configure-signing.sh` runs automatically before builds
