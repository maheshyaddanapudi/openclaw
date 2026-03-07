# OpenClaw Security Audit Report — Consolidated (Rounds 1–7)

**Date**: 2026-03-07
**Auditor**: Claude Code (security-auditor, general-purpose, planner, Explore agents)
**Scope**: Full codebase — all channels (core + 42 extensions), gateway, agents, routing, sessions, infrastructure, UI, protocol, dependencies
**Methodology**: 7 rounds of static code analysis, completeness verification, dependency CVE research, web research (12 agents total)

---

## Executive Summary

Seven rounds of security auditing identified **66 actionable findings** across the OpenClaw codebase, extensions, and dependency tree:

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 1 | Remediation planned (Phase 8) |
| HIGH | 18 | Remediation planned (Phases 1-2, 9-10, 16-20, 28-35) |
| MEDIUM | 30 | Remediation planned (Phases 3-7, 11-15, 21-27, 36-47) |
| LOW | 17 | Accepted risk / deferred |

Additionally, **45+ positive security findings** confirmed mature practices across SSRF guards, path traversal protection, timing-safe comparisons, body size limits, ReDoS protection, sandbox validation, and more.

All 20+ known OpenClaw product CVEs (through ClawJacked, 2026.2.25) are patched in the current version (2026.3.3).

---

## Finding Index

### Rounds 1-5: Core Channel PII, Gateway, Routing

| ID | Severity | Category | Summary | Phase |
|----|----------|----------|---------|-------|
| SEC-HIGH-1 | HIGH | PII Leakage | WhatsApp phone numbers in deliver-reply.ts logs | 1 |
| SEC-HIGH-2 | HIGH | PII Leakage | WhatsApp phone numbers in process-message.ts + on-message.ts logs | 1 |
| SEC-HIGH-3 | HIGH | PII Leakage | WhatsApp phone numbers in access-control.ts logs | 1 |
| SEC-HIGH-4 | HIGH | Info Disclosure | Gateway logs.tail serves unredacted log content | 2 |
| SEC-MED-1 | MEDIUM | PII Leakage | LINE user IDs in log statements (all instances) | 3 |
| SEC-MED-2 | MEDIUM | PII Leakage | LINE sender identity in message context logs | 3 |
| SEC-MED-3 | MEDIUM | PII Leakage | Discord user ID sent to LLM in direct label | 4 |
| SEC-MED-4 | MEDIUM | PII Leakage | Discord user IDs in reaction summaries + verbose logs | 4 |
| SEC-MED-5 | MEDIUM | Info Disclosure | Full filesystem paths in gateway snapshot | 5 |
| SEC-MED-6 | MEDIUM | Info Disclosure | Hostname/IP in SystemPresence (default-on) | 5 |
| SEC-MED-7 | MEDIUM | Path Traversal | Session export path not validated against workspace | 6 |
| SEC-MED-8 | MEDIUM | Info Disclosure | chat.history returns full message content | 7 (accepted) |
| SEC-MED-9 | MEDIUM | PII Leakage | Raw peer IDs in routing debug logs | 7 |
| SEC-R5-CRIT-1 | CRITICAL | Auth Bypass | `isSecureWebSocketUrl` allows `ws://` to any hostname | 8 |
| SEC-R5-HIGH-1 | HIGH | Session Isolation | `x-openclaw-session-key` header unsanitized | 9 |
| SEC-R5-HIGH-2 | HIGH | Code Execution | Browser tool console action + eval in interactions | 10 |
| SEC-R5-MED-1 | MEDIUM | Secret Exposure | API key passed to onRetry callback | 11 |
| SEC-R5-MED-2 | MEDIUM | Token Weakness | Canvas capability token 144-bit entropy | 12 |
| SEC-R5-MED-3 | MEDIUM | Input Validation | Subagent session key depth unlimited | 13 |
| SEC-R5-MED-4 | MEDIUM | Auth Config | `mode: none` allows unauthenticated gateway access | 14 |
| SEC-R5-MED-5 | MEDIUM | Log Injection | WS handshake failure logs unsanitized headers (5 locations) | 15 |

### Round 6: SSRF, Plugins, Media, Config

| ID | Severity | Category | Summary | Phase |
|----|----------|----------|---------|-------|
| SEC-R6-HIGH-1 | HIGH | Auth Bypass | Plugin HTTP routes bypass gateway auth with `auth: "none"` | 16 |
| SEC-R6-HIGH-2 | HIGH | SSRF | TTS fetch calls bypass SSRF guard | 17 |
| SEC-R6-HIGH-3 | HIGH | SSRF | PDF native provider fetch calls bypass SSRF guard | 17 |
| SEC-R6-HIGH-4 | HIGH | SSRF | `withTrustedWebToolsEndpoint` has `dangerouslyAllowPrivateNetwork: true` | 17 |
| SEC-R6-MED-1 | MEDIUM | Input Validation | Session topic ID no length validation | 21 |
| SEC-R6-MED-2 | MEDIUM | DoS | Media `downloadToFile` no Content-Length pre-check | 22 |
| SEC-R6-MED-3 | MEDIUM | TOCTOU | Copilot token cache file permissions race | 23 |
| SEC-R6-MED-4 | MEDIUM | Input Validation | AJV `strict: false` in plugin schema validator | 24 |
| SEC-R6-MED-5 | MEDIUM | Input Validation | Discord user ID in `new RegExp()` without escaping | 25 |
| SEC-R6-MED-6 | MEDIUM | Command Injection | `shell: true` fallback in qmd-manager Windows spawn | 26 |
| SEC-R6-MED-7 | MEDIUM | Command Injection | Bash command from chat — command text unsanitized flow | 27 |

### Round 7: Remaining Channels, Extensions, Crypto, UI

| ID | Severity | Category | Summary | Phase |
|----|----------|----------|---------|-------|
| SEC-R7-HIGH-1 | HIGH | PII Leakage | Telegram chat/sender IDs + names in logs | 28 |
| SEC-R7-HIGH-2 | HIGH | PII Leakage | Signal phone numbers/UUIDs in logs | 29 |
| SEC-R7-HIGH-3 | HIGH | PII Leakage | iMessage phone/email handles in logs | 30 |
| SEC-R7-HIGH-4 | HIGH | Client Security | Device private key stored in localStorage unencrypted | 31 |
| SEC-R7-HIGH-5 | HIGH | Client Security | Gateway auth token in localStorage plaintext | 31 |
| SEC-R7-HIGH-6 | HIGH | CSRF | `dangerouslyAllowHostHeaderOriginFallback` enables WS hijacking | 32 |
| SEC-R7-HIGH-7 | HIGH | Timing Attack | Hooks/gateway token comparison uses `!==` not `safeEqualSecret` | 33 |
| SEC-R7-HIGH-8 | HIGH | Command Injection | Tlon extension: LLM-controlled command args unvalidated | 34 |
| SEC-R7-HIGH-9 | HIGH | PII Leakage | Voice-call extension: speech transcripts in logs | 35 |
| SEC-R7-HIGH-10 | HIGH | MIME Confusion | Tlon extension: MIME from header not content bytes | 35 |
| SEC-R7-MED-1 | MEDIUM | PII Leakage | Telegram dm-access structured logger exposes full PII | 36 |
| SEC-R7-MED-2 | MEDIUM | Integrity | Session fork writes raw JSONL bypassing SessionManager | 37 |
| SEC-R7-MED-3 | MEDIUM | Command Injection | Docker sandbox `shell: true` on Windows | 38 |
| SEC-R7-MED-4 | MEDIUM | Info Disclosure | iMessage RPC raw line in error log | 39 |
| SEC-R7-MED-5 | MEDIUM | Input Validation | Gateway system-event accepts unsanitized host/IP | 40 |
| SEC-R7-MED-6 | MEDIUM | TLS Bypass | Synology Chat TLS verification disabled by default | 41 |
| SEC-R7-MED-7 | MEDIUM | PII Leakage | Synology Chat user IDs + message previews in logs | 42 |
| SEC-R7-MED-8 | MEDIUM | CSS Injection | Diffs extension `unsafeCSS` field | 43 |
| SEC-R7-MED-9 | MEDIUM | SSRF | Mattermost/Matrix/Nextcloud SSRF on configurable base URLs | 44 |
| SEC-R7-MED-10 | MEDIUM | SSRF | Thread-ownership SSRF via configurable forwarderUrl | 44 |
| SEC-R7-MED-11 | MEDIUM | Credential Storage | Zalouser credentials stored without restrictive permissions | 45 |
| SEC-R7-MED-12 | MEDIUM | Auth Scope | OpenAI-compat endpoints hardcode `senderIsOwner: true` | 46 |
| SEC-R7-MED-13 | MEDIUM | CSP | CSP allows `ws:` and `https:` wildcard in img-src | 46 |
| SEC-R7-MED-14 | MEDIUM | Content Safety | `allowUnsafeExternalContent` bypasses sanitization | 46 |
| SEC-R7-MED-15 | MEDIUM | TOCTOU | Device identity directory created without explicit mode | 47 |
| SEC-R7-MED-16 | MEDIUM | Timing Attack | Extension relay auth uses `===` not `safeEqualSecret` | 47 |

### Dependency Findings

| ID | Severity | Category | Summary | Phase |
|----|----------|----------|---------|-------|
| SEC-DEP-HIGH-1 | HIGH | Supply Chain | pnpm 10.23.0 — CVE-2025-69264 + CVE-2025-69262 + CVE-2025-69263 | 18 |
| SEC-DEP-HIGH-2 | HIGH | Runtime | Node.js < 22.22.0 multiple CVEs | 19 |
| SEC-DEP-MED-1 | MEDIUM | Dev Tooling | Vite dev server multiple CVEs (actively exploited) | 20 |
| SEC-DEP-MED-2 | MEDIUM | Transitive | protobufjs transitive — verify >= 7.2.5 (CVE-2023-36665) | — (verify) |
| SEC-DEP-MED-3 | MEDIUM | Supply Chain | Verify chalk/strip-ansi not at compromised versions | — (verify) |
| SEC-DEP-MED-4 | MEDIUM | Transitive | @discordjs/opus — verify patched (CVE-2024-21521) | — (verify) |

### LOW / Accepted Risk

| ID | Severity | Summary |
|----|----------|---------|
| SEC-R5-LOW-1 | LOW | Plugin packages not integrity-checked |
| SEC-R5-LOW-2 | LOW | Rate limiter loopback exemption |
| SEC-R5-LOW-3 | LOW | Firecrawl API key via env var |
| SEC-R5-LOW-4 | LOW | Telegram healthz endpoint unauthenticated |
| SEC-R6-LOW-1 | LOW | Temp media file cleanup best-effort |
| SEC-R6-LOW-2 | LOW | Plugin auto-load when allowlist empty |
| SEC-R6-LOW-3 | LOW | Plugin path safety checks skipped on Windows |
| SEC-R6-LOW-4 | LOW | Error body snippets in MediaFetchError |
| SEC-R6-LOW-5 | LOW | `Math.random()` for session slug (non-security) |
| SEC-R6-LOW-6 | LOW | Media server no explicit auth (UUID+TTL mitigates) |
| SEC-R7-LOW-1 | LOW | Voice-call metadata logged extensively |
| SEC-R7-LOW-2 | LOW | Extension pairing approval messages log user IDs |
| SEC-R7-LOW-3 | LOW | Hardcoded OAuth client IDs in MiniMax/Qwen extensions |
| SEC-R7-LOW-4 | LOW | Gemini CLI auth reads from third-party install |
| SEC-R7-LOW-5 | LOW | No rate limit on OpenAI-compat HTTP endpoints |
| SEC-R7-LOW-6 | LOW | Auth profile credentials plaintext JSON (0o600 mitigates) |
| SEC-R7-LOW-7 | LOW | No memory zeroing for secrets (JS platform limitation) |

---

## Detailed Findings — Rounds 1-6

*See previous report sections. All findings from Rounds 1-6 remain unchanged and are fully described in the remediation plan below.*

---

## Detailed Findings — Round 7 (New)

### SEC-R7-HIGH-1: Telegram PII in logs

**Files**:
- `src/telegram/bot-message-context.ts` — lines 332, 341, 380, 715, 735, 951 (`chatId` in error/debug logs)
- `src/telegram/bot-handlers.ts` — lines 524, 575, 708, 715 (`chatId`, `senderId` in access-control blocks)
- `src/telegram/dm-access.ts` — lines 84-95 (`chatId`, `senderUserId`, `username`, `firstName`, `lastName` in structured logger), line 116 (`sender.candidateId`)
- `src/telegram/send.ts` — lines 836, 947 (`chatId`, `messageId` in delete/edit operations)

Telegram numeric user IDs are stable PII identifiers. The structured logger at `dm-access.ts:84-95` is especially concerning as it persists to external logging systems.

### SEC-R7-HIGH-2: Signal phone numbers/UUIDs in logs

**Files**:
- `src/signal/monitor/event-handler.ts` — lines 555, 705, 713 (`senderDisplay` contains E.164 phone numbers)
- `src/signal/monitor.ts` — line 323 (`target` contains phone number e.g. `signal:+15551234567`)

### SEC-R7-HIGH-3: iMessage phone/email handles in logs

**Files**:
- `src/imessage/monitor/monitor-provider.ts` — lines 276, 293 (`decision.senderId` is phone/email)
- `src/imessage/monitor/inbound-processing.ts` — lines 178, 190 (`sender` is full phone/email handle)

### SEC-R7-HIGH-4 + HIGH-5: Client credentials in localStorage

**Files**:
- `ui/src/ui/device-identity.ts:103` — Ed25519 private key stored as plain JSON string
- `ui/src/ui/storage.ts:9` — Gateway auth token in plaintext
- `ui/src/ui/device-auth.ts:35` — Device auth tokens

Any XSS vulnerability (including browser extensions) can exfiltrate these permanently. localStorage has no expiry, no access control, persists across sessions.

### SEC-R7-HIGH-6: CSRF via Host header origin fallback

**File**: `src/gateway/origin-check.ts` (lines 50-54)

When `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback` is `true`, origin check accepts any WS connection where Origin host matches Host header. Enables cross-site WebSocket hijacking on non-loopback deployments.

### SEC-R7-HIGH-7: Timing-unsafe token comparison

**File**: `src/gateway/startup-auth.ts` (line 337)

```typescript
if (hooksToken !== gatewayToken) { return; }
```

Uses `!==` instead of `safeEqualSecret()`. An attacker who can set `hooks.token` (config injection) could reconstruct gateway token via timing analysis.

### SEC-R7-HIGH-8: Tlon command injection

**File**: `extensions/tlon/index.ts` (lines 156-174)

LLM-controlled `command` parameter only validates first token (subcommand) against allowlist. Subsequent arguments passed unvalidated to `spawn(binary, args)`. Crafted args like `--config /etc/passwd` could exploit tlon CLI.

### SEC-R7-HIGH-9: Voice-call transcripts in logs

**File**: `extensions/voice-call/src/webhook.ts` (lines 106, 432, 464)

Full user speech transcripts logged via `console.log`. Voice content is among the most sensitive PII (medical, financial, legal conversations).

### SEC-R7-HIGH-10: Tlon MIME confusion

**Files**: `extensions/tlon/src/monitor/media.ts:83-84`, `extensions/tlon/src/urbit/upload.ts:38`

MIME type derived from Content-Type header instead of content bytes. Malicious server could serve SVG (with embedded JS) while claiming `image/png`.

### SEC-R7-MED-1 through MED-16

**SEC-R7-MED-1**: Telegram dm-access structured logger — `src/telegram/dm-access.ts:84-95` — logs `chatId`, `senderUserId`, `username`, `firstName`, `lastName` via `logger.info()` (structured, not just verbose)

**SEC-R7-MED-2**: Session fork raw JSONL — `src/auto-reply/reply/session-fork.ts:58` — `fs.writeFileSync` bypassing `SessionManager` abstraction

**SEC-R7-MED-3**: Docker sandbox shell:true — `src/agents/sandbox/docker.ts:55-56,72-76` — Windows fallback with `allowShellFallback: true`

**SEC-R7-MED-4**: iMessage RPC raw line — `src/imessage/client.ts:192` — malformed JSON from RPC process logged with full raw content

**SEC-R7-MED-5**: System-event host/IP — `src/gateway/server-methods/system.ts:43-44,102-106` — client-supplied host/IP enqueued without sanitization

**SEC-R7-MED-6**: Synology TLS disabled — `extensions/synology-chat/src/client.ts:46,96,126,201,240` — `allowInsecureSsl` defaults to `true` in function signatures

**SEC-R7-MED-7**: Synology PII — `extensions/synology-chat/src/webhook-handler.ts:304,311,330` — user_id, username, message preview in logs

**SEC-R7-MED-8**: Diffs unsafeCSS — `extensions/diffs/src/viewer-client.ts:230` — CSS injection via `unsafeCSS` field

**SEC-R7-MED-9/10**: Extension SSRF — `extensions/mattermost/src/mattermost/client.ts:86-93`, `extensions/matrix/src/directory-live.ts:41`, `extensions/thread-ownership/index.ts:105` — configurable base URLs without SSRF guard

**SEC-R7-MED-11**: Zalouser creds — `extensions/zalouser/src/zalo-js.ts:374-391` — plaintext JSON without `0o600` permissions

**SEC-R7-MED-12**: senderIsOwner — `src/gateway/openai-http.ts:127`, `src/gateway/openresponses-http.ts:265` — hardcoded `true` for all authed callers

**SEC-R7-MED-13**: CSP gaps — `src/gateway/control-ui-csp.ts:14-15` — `ws:` in connect-src, `https:` wildcard in img-src (tracking pixels)

**SEC-R7-MED-14**: Unsafe content flag — `src/gateway/hooks-mapping.ts:94` — `allowUnsafeExternalContent` bypasses sanitization

**SEC-R7-MED-15**: Device identity dir — `src/infra/device-identity.ts:24-26` — `fs.mkdirSync()` without explicit mode, TOCTOU before 0o600 file write

**SEC-R7-MED-16**: Relay auth timing — `src/browser/extension-relay-auth.ts:78` — `===` instead of `safeEqualSecret()`

---

## Dependency Status

### Verified Correct Overrides (No Action Needed)

| Package | Pinned Version | CVEs Addressed |
|---------|---------------|----------------|
| fast-xml-parser | 5.3.8 | CVE-2026-25896, CVE-2026-25128, CVE-2026-26278, CVE-2026-27942 |
| form-data | 2.5.4 | CVE-2025-7783 |
| hono | 4.12.5 | CVE-2025-62610, CVE-2025-58362, CVE-2026-24771, +3 more |
| tar | 7.5.10 | CVE-2026-23745, CVE-2026-24842 |
| tough-cookie | 4.1.3 | CVE-2023-26136 |
| qs | 6.14.2 | CVE-2022-24999 |
| playwright-core | 1.58.2 | CVE-2025-59288 |
| sqlite-vec | 0.1.7-alpha.2 | CVE-2024-46488 |
| undici | ^7.22.0 | CVE-2025-22150 |
| AJV | ^8.18.0 | CVE-2025-69873 |
| pdfjs-dist | ^5.5.207 | CVE-2024-4367 |
| vitest | ^4.0.18 | CVE-2025-24964, CVE-2025-24963 |
| minimatch | 10.2.4 | CVE-2026-26996, CVE-2026-27903, CVE-2026-27904 |
| @hono/node-server | 1.19.10 | CVE-2026-29087 |

### No Known CVEs

Zod 4, TypeBox 0.34, Lit 3.3, Commander.js 14, @line/bot-sdk 10, dotenv 17, chokidar 5, croner 10, tsdown, oxlint, gaxios, linkedom, yaml (eemeli), @clack/prompts, @grammyjs/runner, @homebridge/ciao, signal-utils, tslog, @napi-rs/canvas.

### OpenClaw Product CVEs — All Patched

20+ CVEs disclosed through March 2026 (CVE-2026-25253, CVE-2026-24763, ClawJacked, etc.) are all fixed in version 2026.3.3. No action needed.

---

## Positive Security Findings

The codebase demonstrates mature security practices confirmed across multiple audit rounds:

1. **SSRF protection** — `fetchWithSsrFGuard` with DNS pinning, private IP blocking, redirect credential stripping *(issue: inconsistently applied)*
2. **Path traversal** — `readFileWithinRoot`, `openBoundaryFileSync`, `readLocalFileSafely` with `O_NOFOLLOW`, inode verification
3. **Timing-safe comparisons** — `safeEqualSecret` via `timingSafeEqual` on all critical auth paths *(issue: 2 non-critical paths missed)*
4. **HTTP body limits** — `readRequestBodyWithLimit` with configurable `maxBytes`, timeouts
5. **ReDoS protection** — `compileSafeRegex` with nested repetition detection, 2048-char input bound
6. **Session security** — atomic writes, file locking, strict ID validation
7. **Command injection prevention** — `shouldSpawnWithShell` returns `false`, `execFile` preferred
8. **Plugin security** — ownership checks, boundary file opening, symlink escape prevention
9. **Sandbox validation** — blocks `/etc`, `/proc`, Docker socket, root mounts, validates seccomp/apparmor
10. **Sandbox env sanitization** — blocks API key patterns, base64 credentials, null bytes
11. **Skill scanner** — detects eval, shell exec, crypto-mining, obfuscation
12. **External content** — prompt injection detection, randomized markers, Unicode homoglyph folding
13. **UI sanitization** — DOMPurify with strict allowlists, no raw `unsafeHTML` with user data
14. **WS protocol validation** — AJV schemas on all frames, connect challenge-response nonce
15. **HTTP security headers** — `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, optional HSTS
16. **Extension security** — MSTeams `safeFetch` (exemplary SSRF), BlueBubbles path traversal protection, Nostr atomic writes
17. **No hardcoded secrets** — only test fixtures with obvious synthetic values
18. **Gateway startup** — refuses to bind to network without auth configured

---

## Remediation Plan — 47 Phases

### Phases 1-27: Unchanged from Round 6 report

*With these amendments:*

- **Phase 1**: Now includes `src/web/auto-reply/monitor/on-message.ts` (lines 88, 364) — 4 files total
- **Phase 3**: Now includes 7 additional LINE instances — 17 total across 5 files
- **Phase 4**: Now includes 3 additional Discord files — 5 files total
- **Phase 15**: Now covers 5 log locations instead of 1
- **Phase 18**: pnpm target version updated to **>= 10.27.0** (additional CVE-2025-69262 command injection via .npmrc)

### Phase 28: Telegram PII Redaction (HIGH — SEC-R7-HIGH-1, R7-MED-1)

**Complexity**: Moderate | **Files**: 4 source

1. **`src/telegram/bot-message-context.ts`**: Import `redactIdentifier`. Wrap `chatId` at lines 332, 341, 380, 715, 735, 951.
2. **`src/telegram/bot-handlers.ts`**: Wrap `chatId` and `senderId` at lines 524, 575, 708, 715.
3. **`src/telegram/dm-access.ts`**: Wrap `chatId`, `senderUserId`, `sender.candidateId` at lines 84-95, 116. Replace `username`, `firstName`, `lastName` with `"present"/"none"` indicators in structured log.
4. **`src/telegram/send.ts`**: Wrap `chatId` at lines 836, 947.

**Commit**: `fix(telegram): redact user IDs and names in log statements`

### Phase 29: Signal PII Redaction (HIGH — SEC-R7-HIGH-2)

**Complexity**: Simple | **Files**: 2 source

1. **`src/signal/monitor/event-handler.ts`**: Import `redactIdentifier`. Wrap `senderDisplay` at lines 555, 705, 713.
2. **`src/signal/monitor.ts`**: Wrap `target` at line 323.

**Commit**: `fix(signal): redact phone numbers and UUIDs in log statements`

### Phase 30: iMessage PII Redaction (HIGH — SEC-R7-HIGH-3, R7-MED-4)

**Complexity**: Simple | **Files**: 3 source

1. **`src/imessage/monitor/monitor-provider.ts`**: Import `redactIdentifier`. Wrap `decision.senderId` at lines 276, 293.
2. **`src/imessage/monitor/inbound-processing.ts`**: Wrap `sender` at lines 178, 190.
3. **`src/imessage/client.ts`**: Truncate/redact raw RPC line in error at line 192 to avoid leaking secrets from subprocess output.

**Commit**: `fix(imessage): redact sender handles and RPC output in logs`

### Phase 31: UI Credential Storage Hardening (HIGH — SEC-R7-HIGH-4, R7-HIGH-5)

**Complexity**: Moderate | **Files**: 3 source

1. **`ui/src/ui/device-identity.ts`**: Encrypt the Ed25519 private key before storing in localStorage using a key derived from the gateway URL + a user-provided passphrase, or use `sessionStorage` instead (cleared on tab close).
2. **`ui/src/ui/storage.ts`**: Move gateway auth token to `sessionStorage` or encrypt before storing.
3. **`ui/src/ui/device-auth.ts`**: Same pattern for device auth tokens.

**Alternative (simpler)**: Switch from `localStorage` to `sessionStorage` for all sensitive values. This limits exposure to the current tab/session lifetime.

**Commit**: `fix(ui): move sensitive credentials from localStorage to sessionStorage`

### Phase 32: CSRF Protection for Host Header Fallback (HIGH — SEC-R7-HIGH-6)

**Complexity**: Moderate | **Files**: 1 source

**`src/gateway/origin-check.ts`** (lines 50-54): When `dangerouslyAllowHostHeaderOriginFallback` is enabled, additionally require a CSRF token or restrict to loopback-only deployments. Add a startup warning.

**Commit**: `fix(gateway): add CSRF protection when Host header origin fallback is enabled`

### Phase 33: Timing-Safe Token Comparisons (HIGH — SEC-R7-HIGH-7, R7-MED-16)

**Complexity**: Trivial | **Files**: 2 source

1. **`src/gateway/startup-auth.ts`** (line 337): Replace `hooksToken !== gatewayToken` with `!safeEqualSecret(hooksToken, gatewayToken)`.
2. **`src/browser/extension-relay-auth.ts`** (line 78): Replace `===` with `safeEqualSecret()`.

**Commit**: `fix(security): use timing-safe comparison for all token checks`

### Phase 34: Tlon Command Argument Validation (HIGH — SEC-R7-HIGH-8)

**Complexity**: Moderate | **Files**: 1 source

**`extensions/tlon/index.ts`** (lines 156-174): Validate all arguments against an allowlist per subcommand, not just the subcommand name. Reject flags like `--config`, `--output` that could read/write arbitrary files. Consider structured parameter schema instead of free-form command string.

**Commit**: `fix(tlon): validate all command arguments against per-subcommand allowlist`

### Phase 35: Voice-Call + Tlon Media Fixes (HIGH — SEC-R7-HIGH-9, R7-HIGH-10)

**Complexity**: Simple | **Files**: 2 source

1. **`extensions/voice-call/src/webhook.ts`** (lines 106, 432, 464): Remove transcript content from log output. Log only metadata (callId, transcript length).
2. **`extensions/tlon/src/monitor/media.ts`** (lines 83-84): Use `detectMime` from content bytes instead of Content-Type header.

**Commit**: `fix(extensions): redact voice transcripts and validate media MIME from content`

### Phase 36: Telegram Structured Logger PII (MEDIUM — SEC-R7-MED-1)

*Covered by Phase 28.*

### Phase 37: Session Fork Raw Write (MEDIUM — SEC-R7-MED-2)

**File**: `src/auto-reply/reply/session-fork.ts:58` — Use `SessionManager` API or document why raw write is necessary with a safety comment.

**Commit**: `fix(sessions): use SessionManager for session fork header writes`

### Phase 38: Docker Sandbox Shell Fallback (MEDIUM — SEC-R7-MED-3)

**File**: `src/agents/sandbox/docker.ts:55-56,72-76` — Remove `shell: true` fallback or escape args for shell context on Windows.

**Commit**: `fix(agents): remove shell fallback in Docker sandbox spawn`

### Phase 39: iMessage RPC Error Redaction (MEDIUM — SEC-R7-MED-4)

*Covered by Phase 30.*

### Phase 40: System-Event Host/IP Validation (MEDIUM — SEC-R7-MED-5)

**File**: `src/gateway/server-methods/system.ts:43-44,102-106` — Sanitize `host` and `ip` from client params (length limit, character allowlist).

**Commit**: `fix(gateway): validate system-event host and IP parameters`

### Phase 41: Synology TLS Default (MEDIUM — SEC-R7-MED-6)

**File**: `extensions/synology-chat/src/client.ts:46,96,126,201,240` — Change function signature defaults from `allowInsecureSsl = true` to `allowInsecureSsl = false`.

**Commit**: `fix(synology-chat): default TLS verification to enabled`

### Phase 42: Synology PII (MEDIUM — SEC-R7-MED-7)

**File**: `extensions/synology-chat/src/webhook-handler.ts:304,311,330` — Redact `user_id` and remove message preview from info-level logs.

**Commit**: `fix(synology-chat): redact user IDs and message content in logs`

### Phase 43: Diffs CSS Injection (MEDIUM — SEC-R7-MED-8)

**File**: `extensions/diffs/src/viewer-client.ts:230` — Sanitize `unsafeCSS` to only allow CSS custom properties or known-safe patterns.

**Commit**: `fix(diffs): sanitize CSS input in viewer payload`

### Phase 44: Extension SSRF Guards (MEDIUM — SEC-R7-MED-9, R7-MED-10)

**Files**: `extensions/mattermost/src/mattermost/client.ts`, `extensions/matrix/src/directory-live.ts`, `extensions/thread-ownership/index.ts` — Add SSRF guards (private IP checks) to configurable base URL fetches.

**Commit**: `fix(extensions): add SSRF guards to configurable base URL fetches`

### Phase 45: Zalouser File Permissions (MEDIUM — SEC-R7-MED-11)

**File**: `extensions/zalouser/src/zalo-js.ts:374-391` — Add `{ mode: 0o600 }` to credential file writes.

**Commit**: `fix(zalouser): set restrictive permissions on credential files`

### Phase 46: Gateway HTTP API Hardening (MEDIUM — SEC-R7-MED-12, R7-MED-13, R7-MED-14)

1. **`src/gateway/openai-http.ts:127`**: Document `senderIsOwner: true` as intentional for current auth model; add TODO for role-based scoping.
2. **`src/gateway/control-ui-csp.ts:14-15`**: Remove `ws:` from `connect-src` (require `wss:` only). Restrict `img-src` to `'self' data:` (remove `https:` wildcard).
3. **`src/gateway/hooks-mapping.ts:94`**: Add startup warning when `allowUnsafeExternalContent` is enabled.

**Commit**: `fix(gateway): tighten CSP and document API auth scope`

### Phase 47: Device Identity + Relay Auth (MEDIUM — SEC-R7-MED-15, R7-MED-16)

1. **`src/infra/device-identity.ts:24-26`**: Add `{ mode: 0o700 }` to `mkdirSync` options.
2. **`src/browser/extension-relay-auth.ts:78`**: Replace `===` with `safeEqualSecret()`. *(Relay auth also covered in Phase 33)*

**Commit**: `fix(infra): set explicit directory permissions for device identity`

---

## Implementation Priority

| Priority | Phases | Severity | Category |
|----------|--------|----------|----------|
| P0 | 8 | CRITICAL | WebSocket MitM |
| P1 | 17, 16, 33 | HIGH | SSRF consistency, plugin auth, timing attacks |
| P1 | 1, 28, 29, 30 | HIGH | PII in all core channels |
| P1 | 9, 31 | HIGH | Session isolation, client credential storage |
| P1 | 2, 10 | HIGH | Log API, browser tool |
| P1 | 18, 19 | HIGH | pnpm + Node.js upgrades |
| P1 | 32, 34, 35 | HIGH | CSRF, tlon injection, voice transcripts |
| P2 | 15, 6, 13 | MEDIUM | Log injection, path traversal, recursion |
| P2 | 20, 23, 25, 26, 38 | MEDIUM | Vite, TOCTOU, RegExp, shell injection |
| P2 | 3, 4, 41, 42 | MEDIUM | Channel PII (LINE, Discord, Synology) |
| P3 | 5, 7, 11-14 | MEDIUM | Info disclosure, config hardening |
| P3 | 21-22, 24, 27 | MEDIUM | Input validation, defense-in-depth |
| P3 | 37, 40, 43-47 | MEDIUM | Session fork, system events, extensions |

---

## Accepted Risks

| ID | Finding | Reason |
|----|---------|--------|
| SEC-MED-8 | `chat.history` returns full content | Required for UI; gated by WS auth |
| SEC-R5-LOW-1–4 | Plugin integrity, rate limiter, Firecrawl, healthz | By design |
| SEC-R6-LOW-1–6 | Temp files, auto-load, Windows, MediaFetchError, Math.random, media server | Mitigated by existing controls |
| SEC-R7-LOW-1–7 | Voice metadata, pairing logs, OAuth IDs, Gemini CLI, rate limit, auth JSON, memory zeroing | Low risk / platform limitation |
| SEC-DEP-MED-2–4 | protobufjs, chalk, @discordjs/opus | Verify-only; likely not affected |

---

## Cross-Cutting Recommendations

1. **CLAUDE.md**: Add "ALWAYS use `redactIdentifier()` when logging user identifiers across ALL channels"
2. **CLAUDE.md**: Add "ALWAYS use `fetchWithSsrFGuard` for any outbound HTTP with configurable base URLs"
3. **CLAUDE.md**: Add "ALWAYS use `safeEqualSecret()` for any secret/token comparison — never `===` or `!==`"
4. **Defense-in-depth**: `logs.tail` redaction (Phase 2) catches PII leaks from any channel
5. **Custom lint rule**: Flag identifier variables in template literals within log calls
6. **Dependency hygiene**: Run `pnpm audit` in CI; maintain override discipline
7. **Plugin security**: Default `auth: "required"` for plugin HTTP routes
8. **Client storage**: Establish pattern for encrypted or session-scoped credential storage in UI

---

## Verification Checklist

After all phases:

1. `pnpm build` passes without `[INEFFECTIVE_DYNAMIC_IMPORT]` warnings
2. `pnpm check` passes
3. `pnpm test:fast` passes
4. All channel tests pass: `pnpm exec vitest run src/web/ src/line/ src/discord/ src/telegram/ src/signal/ src/imessage/`
5. Gateway tests pass: `pnpm exec vitest run src/gateway/`
6. Agent/routing/session tests pass
7. Extension tests pass: `pnpm test:extensions`
8. UI tests pass: `pnpm test:ui`
9. `pnpm audit` shows no unaddressed advisories
10. No raw identifiers in log grep across all channels

---

## Commit Strategy (47 phases, ~35 commits after merging related phases)

| # | Scope | Finding(s) | Files |
|---|-------|-----------|-------|
| 1 | `fix(whatsapp)` | HIGH-1,2,3 | 4 source |
| 2 | `fix(gateway)` | HIGH-4 | 1 source |
| 3 | `fix(line)` | MED-1,2 | 5 source |
| 4 | `fix(discord)` | MED-3,4 + R6-MED-5 | 6 source |
| 5 | `fix(gateway)` | MED-5,6 | 2 source |
| 6 | `fix(agents)` | MED-7 | 1 source + tests |
| 7 | `fix(routing)` | MED-8,9 | 2 source |
| 8 | `fix(gateway)` | R5-CRIT-1 | 1 source + tests |
| 9 | `fix(gateway)` | R5-HIGH-1 | 1 source + tests |
| 10 | `fix(agents)` | R5-HIGH-2 | 1 source |
| 11 | `fix(agents)` | R5-MED-1 | 1 source |
| 12 | `fix(gateway)` | R5-MED-2 | 1 source |
| 13 | `fix(agents)` | R5-MED-3 | 1 source + tests |
| 14 | `fix(gateway)` | R5-MED-4 | 1 source |
| 15 | `fix(gateway)` | R5-MED-5 | 1 source |
| 16 | `fix(gateway)` | R6-HIGH-1 | 2 source |
| 17 | `fix(agents)` | R6-HIGH-2,3,4 | 3 source |
| 18 | `fix(deps)` | DEP-HIGH-1 | 1 source |
| 19 | `fix(infra)` | DEP-HIGH-2 | 2 source |
| 20 | `fix(ui)` | DEP-MED-1 | 1 source |
| 21 | `fix(sessions)` | R6-MED-1 | 1 source |
| 22 | `fix(media)` | R6-MED-2 | 1 source |
| 23 | `fix(infra)` | R6-MED-3 | 1 source |
| 24 | `fix(plugins)` | R6-MED-4 | 1 source |
| 25 | `fix(discord)` | R6-MED-5 | 1 source |
| 26 | `fix(memory)` | R6-MED-6 | 1 source |
| 27 | `docs(agents)` | R6-MED-7 | 1 source |
| 28 | `fix(telegram)` | R7-HIGH-1, R7-MED-1 | 4 source |
| 29 | `fix(signal)` | R7-HIGH-2 | 2 source |
| 30 | `fix(imessage)` | R7-HIGH-3, R7-MED-4 | 3 source |
| 31 | `fix(ui)` | R7-HIGH-4,5 | 3 source |
| 32 | `fix(gateway)` | R7-HIGH-6 | 1 source |
| 33 | `fix(security)` | R7-HIGH-7, R7-MED-16 | 2 source |
| 34 | `fix(tlon)` | R7-HIGH-8 | 1 source |
| 35 | `fix(extensions)` | R7-HIGH-9,10 | 2 source |
| 36 | `fix(sessions)` | R7-MED-2 | 1 source |
| 37 | `fix(agents)` | R7-MED-3 | 1 source |
| 38 | `fix(gateway)` | R7-MED-5 | 1 source |
| 39 | `fix(synology-chat)` | R7-MED-6,7 | 2 source |
| 40 | `fix(diffs)` | R7-MED-8 | 1 source |
| 41 | `fix(extensions)` | R7-MED-9,10 | 3 source |
| 42 | `fix(zalouser)` | R7-MED-11 | 1 source |
| 43 | `fix(gateway)` | R7-MED-12,13,14 | 3 source |
| 44 | `fix(infra)` | R7-MED-15 | 1 source |

**Total**: ~55 source files, ~10-12 test files

---

## Audit Agent Summary

| # | Agent Type | Round | Purpose | Findings |
|---|-----------|-------|---------|----------|
| 1 | `security-auditor` | 5 | Round 5 codebase audit | 1C, 1H, 5M, 4L |
| 2 | `planner` | 5 | Remediation plan (Rounds 1-4) | Plan output |
| 3 | `Explore` | 5 | Round 5 detail gathering | Line verification |
| 4 | `security-auditor` | 6 | Completeness verification | 13 missing instances |
| 5 | `security-auditor` | 6 | Fresh sweep (media, config, plugins) | 2H, 7M, 10L |
| 6 | `security-auditor` | 6 | Edge cases (SSRF, injection, crypto) | 3H, 6M, 8L |
| 7 | `general-purpose` | 6 | Web research (dependency CVEs) | 2H, 3M, 17 safe |
| 8 | `security-auditor` | 7 | Unexplored code (Telegram, Signal, iMessage) | 3H, 5M, 8L |
| 9 | `security-auditor` | 7 | Extension plugins (42 packages) | 3H, 7M, 7L |
| 10 | `security-auditor` | 7 | Secrets, crypto, auth flows | 2H, 5M, 13L |
| 11 | `security-auditor` | 7 | Web UI, protocol, HTTP endpoints | 3H, 5M, 12L |
| 12 | `general-purpose` | 7 | Final web research (long-tail CVEs) | Updates + product CVE history |
