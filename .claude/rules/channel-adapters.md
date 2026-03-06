---
paths:
- 'src/telegram/**'
- 'src/discord/**'
- 'src/slack/**'
- 'src/signal/**'
- 'src/imessage/**'
- 'src/web/**'
- 'src/line/**'
- 'src/channels/**'
- 'src/routing/**'
- 'extensions/*/src/**'
---

# Channel Adapter Rules

## Hard Rules

- **ALWAYS** consider ALL channels (core + extensions) when changing shared logic: routing, allowlists, pairing, command gating, onboarding
- **NEVER** send streaming/partial replies to external messaging surfaces (WhatsApp, Telegram, Discord, etc.) — only final replies. Streaming may go to internal UIs/control channel
- **ALWAYS** update `.github/labeler.yml` and create matching GitHub labels when adding a new channel
- **NEVER** add extension-only dependencies to the root `package.json` — keep them in the extension's own `package.json`

## Core Channel Locations

- Telegram: `src/telegram/` (Grammy)
- Discord: `src/discord/` (Carbon — NEVER update the Carbon dependency)
- Slack: `src/slack/` (Bolt)
- WhatsApp: `src/web/` (Baileys)
- Signal: `src/signal/` (signal-cli bridge)
- iMessage: `src/imessage/` (AppleScript/BlueBubbles bridge)
- LINE: `src/line/` (LINE Bot SDK)
- Extensions: `extensions/*/` (42 plugin packages)

## When Refactoring Shared Logic

Check all of: `src/channels/`, `src/routing/`, every core channel dir above, and `extensions/*/src/`.
