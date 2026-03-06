<!-- This supplements the root CLAUDE.md. Read that first. -->

# Android App

Kotlin + Jetpack Compose app. Entirely different language and toolchain from core.

## Technology

- **Language**: Kotlin with Jetpack Compose
- **Build**: Gradle (Android Gradle Plugin)
- **Target**: SDK 31 (min) to 36 (compile/target)
- **ABI**: armeabi-v7a, arm64-v8a, x86, x86_64
- **Linting**: ktlint via Gradle plugin
- **Serialization**: Kotlin Serialization plugin

## Commands

```bash
pnpm android:assemble       # ./gradlew :app:assembleDebug
pnpm android:install        # install on connected device
pnpm android:run            # install and launch
pnpm android:test           # unit tests (testDebugUnitTest)
pnpm android:lint           # ktlint check
pnpm android:format         # ktlint format
```

## Key Patterns

- TLS certificate pinning via custom `TrustManager` with TOFU (Trust On First Use) support
- Gateway communication over HTTPS/WebSocket with pin verification
- Prefer testing on connected real devices over emulators
- "Restart app" means rebuild + reinstall + relaunch, not just kill/launch

## Entry Points

- `apps/android/app/` — main application module
- `apps/android/benchmark/` — performance benchmarks
- Namespace: `ai.openclaw.android`
