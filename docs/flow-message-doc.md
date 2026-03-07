# Flow: Inbound Message → LLM Reply → Outbound Response

This documents the complete lifecycle of a message received from a channel, processed through the agent runtime, and returned as a response.

## Overview

```
Channel (webhook/socket) → Monitor → Allowlist/Gating → Route → Agent → LLM Provider → Send Reply
```

## Step 1: Channel Receives Message

Each channel adapter has a `monitorXxxProvider()` function that registers a webhook or maintains a socket connection.

**Example (Telegram):** `src/telegram/bot-handlers.ts`

- Grammy bot receives update via webhook or polling
- Message is extracted and normalized into a `MsgContext`

**Example (WhatsApp):** `src/web/inbound/monitor.ts`

- Baileys WebSocket receives message event
- Raw message is parsed and normalized

The normalized `MsgContext` contains:

```typescript
type MsgContext = {
  Channel: string; // "telegram", "discord", etc.
  AccountId: string; // Bot/account identifier
  SessionKey: string; // Routing session key
  Text: string; // Message text
  SenderName: string; // Display name
  ChatType: "direct" | "group" | "channel";
  Attachments?: MediaAttachment[];
  // ... more fields
};
```

## Step 2: Allowlist and Command Gating

Before routing, the message passes through access controls:

**`src/channels/allow-from.ts`** — `isAllowedFrom(cfg, channel, accountId, peerId)`

- Checks if the sender is in the allowlist for this channel/account
- DM policy: `open`, `allowlist`, `pairing`, `disabled`
- Group policy: `open`, `allowlist`, `disabled`

**`src/channels/command-gating.ts`** — Command authorization

- Certain commands (reset, config, admin) are gated by role/permission
- Commands resolved via `resolveCommandAuthorization()` in `src/auto-reply/command-auth.ts`

If the sender is not allowed, the message is silently dropped (no error response).

## Step 3: Route to Agent

**`src/routing/resolve-route.ts`** — `resolveAgentRoute(input)`

Input:

```typescript
{
  (cfg, channel, accountId, peer, parentPeer, guildId, teamId, memberRoleIds);
}
```

Output:

```typescript
{
  (agentId, channel, accountId, sessionKey, mainSessionKey, matchedBy);
}
```

The router evaluates bindings from config in priority order:

1. **Peer match** — exact sender ID in binding
2. **Parent peer** — thread parent peer (for inherited bindings)
3. **Guild + roles** — Discord server + member roles
4. **Guild** — Discord server alone
5. **Team** — Slack workspace
6. **Account** — channel account
7. **Channel** — channel type
8. **Default** — `resolveDefaultAgentId(cfg)` fallback

The `sessionKey` determines which conversation session to use (format: `agent:channel:account:peer`).

## Step 4: Dispatch to Agent Runtime

**`src/auto-reply/dispatch.ts`** — `dispatchInboundMessage()`

This wraps the reply workflow with a `ReplyDispatcher` that manages:

- Typing indicators (sent at configurable intervals, default 6s)
- Reply buffering and chunking for channel message limits
- Completion tracking (`markComplete()` / `waitForIdle()`)

The dispatch calls `dispatchReplyFromConfig()` → `getReplyFromConfig()`.

## Step 5: Prepare and Execute Agent Reply

**`src/auto-reply/reply/get-reply.ts`** — `getReplyFromConfig(ctx, opts)`

This is the core orchestration function. It:

1. **Resolves the agent** — `resolveSessionAgentId({ sessionKey, config })`
2. **Resolves the model** — `resolveDefaultModel({ cfg, agentId })` → provider + model
3. **Prepares workspace** — `ensureAgentWorkspace()` creates/validates agent working directory
4. **Applies media understanding** — `applyMediaUnderstanding()` processes attachments (images, audio, documents) through vision/audio providers
5. **Applies link understanding** — `applyLinkUnderstanding()` fetches and summarizes linked content
6. **Emits pre-agent hooks** — `emitPreAgentMessageHooks()` for plugin preprocessing
7. **Initializes session state** — `initSessionState()` loads conversation history from JSONL session file
8. **Resolves directives** — `resolveReplyDirectives()` processes inline commands (model switching, verbose, think mode)
9. **Runs the agent** — `runPreparedReply()` calls the LLM provider with the assembled prompt, tools, and conversation history

## Step 6: LLM Provider Call

**`src/providers/`** — Provider abstraction layer

The agent runtime calls the configured provider (OpenAI, Anthropic, Ollama, Bedrock, etc.) with:

- System prompt (from agent config + skills)
- Conversation history (from session)
- Current message (with media understanding results)
- Available tools (from `src/agents/tools/`)

The provider returns a streaming or complete response.

## Step 7: Session Persistence

**`src/config/sessions/`** — JSONL session files at `~/.openclaw/sessions/`

After the LLM responds:

- User message is appended via `SessionManager.appendMessage()` with `parentId`
- Assistant response is appended via `SessionManager.appendMessage()` with `parentId`
- The `parentId` chain maintains a DAG for compaction and history tracing

**Critical rule:** Never write raw JSONL — always use `SessionManager.appendMessage()`.

## Step 8: Send Response

The `ReplyDispatcher` sends the response back through the originating channel:

- **Chunking** — Long responses are split at message boundaries (channel-specific limits)
- **Formatting** — Markdown rendering adapted per channel (Telegram HTML, Discord markdown, Slack blocks)
- **Media** — Generated images/files attached via channel-specific media APIs
- **Typing** — Typing indicator dismissed after final chunk sent

Each channel's `send.ts` handles the actual API call:

- `src/telegram/send.ts` — `sendTelegramReply()`
- `src/discord/send.ts` — Discord message send
- `src/slack/send.ts` — Slack Web API post
- `src/web/send.ts` — WhatsApp Baileys send
- etc.

## Error Handling

- **Channel errors** — Logged via `createSubsystemLogger()`, message delivery retried per channel config
- **Provider errors** — Formatted via `formatErrorMessage()`, returned as error reply to user
- **Session errors** — Logged, session state preserved (append-only JSONL is crash-safe)
- **Timeout** — `resolveAgentTimeoutMs()` enforces max agent execution time

## Key Files in the Flow

| Step      | File                                    | Function                         |
| --------- | --------------------------------------- | -------------------------------- |
| Receive   | `src/{channel}/monitor.ts`              | `monitorXxxProvider()`           |
| Allowlist | `src/channels/allow-from.ts`            | `isAllowedFrom()`                |
| Route     | `src/routing/resolve-route.ts`          | `resolveAgentRoute()`            |
| Dispatch  | `src/auto-reply/dispatch.ts`            | `dispatchInboundMessage()`       |
| Reply     | `src/auto-reply/reply/get-reply.ts`     | `getReplyFromConfig()`           |
| Agent run | `src/auto-reply/reply/get-reply-run.ts` | `runPreparedReply()`             |
| Session   | `src/config/sessions/`                  | `SessionManager.appendMessage()` |
| Send      | `src/{channel}/send.ts`                 | `sendXxxReply()`                 |
