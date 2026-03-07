# OpenClaw Security Audit Report — Consolidated (Rounds 1–6)

**Date**: 2026-03-07
**Auditor**: Claude Code (security-auditor, general-purpose agents)
**Scope**: Full codebase — channels, gateway, agents, routing, sessions, infrastructure, dependencies
**Methodology**: 6 rounds of static code analysis, completeness verification, dependency CVE research (10 agents total)

---

## Executive Summary

Six rounds of security auditing identified **40 findings** across the OpenClaw codebase and its dependency tree:

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 1 | Remediation planned (Phase 8) |
| HIGH | 10 | Remediation planned (Phases 1-2, 9-10, 16-20) |
| MEDIUM | 19 | Remediation planned (Phases 3-7, 11-15, 21-27) |
| LOW | 10 | Accepted risk / deferred |

The findings span three categories:
1. **Code-level** (Rounds 1-5): PII leakage, auth bypass, path traversal, log injection, information disclosure
2. **Code-level** (Round 6): SSRF consistency gaps, plugin auth bypass, shell injection, regex injection
3. **Dependency-level** (Round 6): pnpm script bypass, Node.js CVEs, Vite dev server vulns, supply chain verification

---

## Finding Index

### Code-Level Findings (Rounds 1-5 + Round 6 Completeness Amendments)

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
| SEC-R5-HIGH-2 | HIGH | Code Execution | Browser tool console action lacks output validation | 10 |
| SEC-R5-MED-1 | MEDIUM | Secret Exposure | API key passed to onRetry callback | 11 |
| SEC-R5-MED-2 | MEDIUM | Token Weakness | Canvas capability token 144-bit entropy | 12 |
| SEC-R5-MED-3 | MEDIUM | Input Validation | Subagent session key depth unlimited | 13 |
| SEC-R5-MED-4 | MEDIUM | Auth Config | `mode: none` allows unauthenticated gateway access | 14 |
| SEC-R5-MED-5 | MEDIUM | Log Injection | WS handshake failure logs unsanitized headers (5 locations) | 15 |

### New Code-Level Findings (Round 6)

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

### Dependency Findings (Round 6 Web Research)

| ID | Severity | Category | Summary | Phase |
|----|----------|----------|---------|-------|
| SEC-DEP-HIGH-1 | HIGH | Supply Chain | pnpm 10.23.0 git-hosted script bypass (CVE-2025-69264) | 18 |
| SEC-DEP-HIGH-2 | HIGH | Runtime | Node.js < 22.22.0 multiple CVEs (memory leak, DoS, traversal) | 19 |
| SEC-DEP-MED-1 | MEDIUM | Dev Tooling | Vite dev server multiple CVEs (actively exploited) | 20 |
| SEC-DEP-MED-2 | MEDIUM | XSS | markdown-it highlight callback XSS (CVE-2025-7969) | — (audit) |
| SEC-DEP-MED-3 | MEDIUM | Supply Chain | Verify chalk/strip-ansi not at compromised versions | — (verify) |

### LOW / Accepted Risk

| ID | Severity | Category | Summary |
|----|----------|----------|---------|
| SEC-R5-LOW-1 | LOW | Integrity | Plugin packages not integrity-checked |
| SEC-R5-LOW-2 | LOW | Rate Limiting | Rate limiter loopback exemption |
| SEC-R5-LOW-3 | LOW | Secret Exposure | Firecrawl API key via env var |
| SEC-R5-LOW-4 | LOW | Info Disclosure | Telegram healthz endpoint unauthenticated |
| SEC-R6-LOW-1 | LOW | Cleanup | Temp media file cleanup best-effort only |
| SEC-R6-LOW-2 | LOW | Config | Plugin auto-load when allowlist empty |
| SEC-R6-LOW-3 | LOW | Platform | Plugin path safety checks skipped on Windows |
| SEC-R6-LOW-4 | LOW | Info Disclosure | Error body snippets in MediaFetchError |
| SEC-R6-LOW-5 | LOW | Randomness | `Math.random()` for session slug (non-security) |
| SEC-R6-LOW-6 | LOW | Info Disclosure | Media server route has no explicit auth (UUID bearer + TTL mitigates) |

---

## Detailed Findings

### SEC-HIGH-1: WhatsApp phone numbers in deliver-reply.ts logs

**File**: `src/web/auto-reply/deliver-reply.ts`
**Lines**: 46, 76, 93, 101, 176, 182, 193, 201

`msg.from` (E.164 phone number) is logged in plaintext across debug, info, and error log statements. The codebase already has `redactIdentifier()` in `src/logging/redact-identifier.ts` and uses it in `src/web/outbound.ts:47`, but the auto-reply path was missed. All 8 instances verified accurate.

### SEC-HIGH-2: WhatsApp phone numbers in process-message.ts + on-message.ts logs

**Files**: `src/web/auto-reply/monitor/process-message.ts`, `src/web/auto-reply/monitor/on-message.ts`

**process-message.ts lines**: 223, 232, 235, 423-424, 440
**on-message.ts lines**: 88, 364 *(AMENDMENT: missed in original plan)*

`params.msg.from` flows into structured log objects and `fromDisplay` variables. The `ctxPayload` object (lines 296-331) must remain un-redacted (routing data).

**Amendment**: `on-message.ts:88` logs `msg.from` in same-phone verbose log. `on-message.ts:364` logs `dmRouteTarget` (derived from `normalizeE164(params.msg.from)`) in verbose log. Both need `redactIdentifier()`.

### SEC-HIGH-3: WhatsApp phone numbers in access-control.ts logs

**File**: `src/web/inbound/access-control.ts`
**Lines**: 138, 172, 182, 193, 205

All instances verified accurate. Line 188 is a user-facing message (not a log) and must remain unchanged.

### SEC-HIGH-4: Gateway logs.tail serves unredacted content

**File**: `src/gateway/server-methods/logs.ts` (line ~170)

`readLogSlice` returns raw log content that may contain PII from pre-redaction log entries.

### SEC-MED-1: LINE user IDs in log statements (AMENDED — full instance list)

**Files and ALL instances** (original + 7 missed instances marked with *):

- `src/line/send.ts` — lines 182, 241*, 252*, 304, 322, 343, 356, 372, 419*, 460
- `src/line/bot-handlers.ts` — lines 239, 261, 269, 331, 349, 384, 464*, 473*
- `src/line/rich-menu.ts` — lines 185*, 223
- `src/line/monitor.ts` — lines 189, 264*

### SEC-MED-2: LINE sender identity in message context logs

**File**: `src/line/bot-message-context.ts` (line 357) — verified accurate.

### SEC-MED-3: Discord user ID sent to LLM in direct label

**File**: `src/discord/monitor/reply-context.ts` (line 43) — verified accurate.

### SEC-MED-4: Discord user IDs in reaction summaries + verbose logs (AMENDED)

**Files**: `src/discord/send.reactions.ts` (lines 111-118)

**Amendment — additional Discord user ID verbose log instances**:
- `src/discord/monitor/agent-components.ts` — lines 290, 333, 548 (`user.id` in blocked user logs)
- `src/discord/monitor/listeners.ts` — line 475 (`user.id` in reaction blocked log)
- `src/discord/monitor/message-handler.preflight.ts` — lines 251, 268 (`author.id` in pairing logs)

### SEC-MED-5–9: Unchanged from previous report.

### SEC-R5-CRIT-1: `isSecureWebSocketUrl` allows `ws://` to any hostname

**File**: `src/gateway/net.ts` (lines 411-450)

When `allowPrivateWs=true`, `net.isIP(hostForIpCheck) === 0` at line 447 returns `true` for ANY non-IP hostname including `attacker.com`.

### SEC-R5-HIGH-1: `x-openclaw-session-key` unsanitized

**File**: `src/gateway/http-utils.ts` (lines 66-80) — verified, single entry point covers all consumers.

### SEC-R5-HIGH-2: Browser tool console action lacks output validation

**File**: `src/agents/tools/browser-tool.actions.ts` (lines 236-283)

**Related**: `src/browser/pw-tools-core.interactions.ts:302,309,333,339` uses `new Function()`/`eval()` for Playwright page-context evaluation. While sandboxed in browser context, `fnBody` can be LLM-influenced.

### SEC-R5-MED-1–4: Unchanged from previous report.

### SEC-R5-MED-5: WS handshake failure logs unsanitized (AMENDED — 5 locations)

**File**: `src/gateway/server/ws-connection/message-handler.ts`

**ALL unsanitized log statements** (original + 4 missed):
- Line 424: `forwardedFor`, `requestOrigin`, `requestHost`, `requestUserAgent` in handshake failure
- Line 471*: `remoteAddr` in protocol mismatch log
- Line 524*: `requestHost`, `requestOrigin` in host-header-fallback security warning
- Line 578*: `remoteAddr` in unauthorized connection log
- Line 994*: `remoteAddr` in webchat connected log

### SEC-R6-HIGH-1: Plugin HTTP routes bypass gateway auth

**File**: `src/plugins/http-registry.ts` (line 15)
**Auth check**: `src/gateway/server/plugins-http/route-auth.ts` (line 27)

When a plugin registers a route with `auth: "none"`, `shouldEnforceGatewayAuthForPluginPath` returns `false`, allowing unauthenticated access. A malicious or compromised third-party plugin could register routes under arbitrary paths. Route path is only lightly normalized (leading `/` ensured) with no namespace restriction.

### SEC-R6-HIGH-2: TTS fetch bypasses SSRF guard

**File**: `src/tts/tts-core.ts` — lines 562 (ElevenLabs), 623 (OpenAI TTS)

ElevenLabs and OpenAI TTS endpoints use bare `fetch()` without `fetchWithSsrFGuard`. The `baseUrl` is operator-configurable via config. A misconfigured or compromised config could allow requests to internal network endpoints.

### SEC-R6-HIGH-3: PDF native provider fetch bypasses SSRF guard

**File**: `src/agents/tools/pdf-native-providers.ts` — lines 63 (Anthropic), 146 (Gemini)

`anthropicAnalyzePdf` and `geminiAnalyzePdf` use bare `fetch()` with configurable `baseUrl` parameter from agent model configuration. No SSRF protection applied.

### SEC-R6-HIGH-4: `withTrustedWebToolsEndpoint` allows private network access

**File**: `src/agents/tools/web-guarded-fetch.ts` (lines 10-13)

`WEB_TOOLS_TRUSTED_NETWORK_SSRF_POLICY` sets `dangerouslyAllowPrivateNetwork: true`. Callers of `withTrustedWebToolsEndpoint` can reach internal services. Risk depends on whether caller URLs are operator-controlled or LLM-controlled.

### SEC-R6-MED-1: Session topic ID no length validation

**File**: `src/config/sessions/paths.ts` (line 243)

`encodeURIComponent(topicId)` prevents path traversal but topic IDs have no length limit. Extremely long topic IDs could exceed filesystem path limits or cause DoS.

### SEC-R6-MED-2: Media downloadToFile no Content-Length pre-check

**File**: `src/media/store.ts` (lines 136-205)

Streams response data to disk, only checking `MAX_BYTES` reactively per chunk. No `content-length` header validation before starting write. Partially-written oversized temp files may persist briefly.

### SEC-R6-MED-3: Copilot token cache file TOCTOU

**File**: `src/providers/github-copilot-token.ts` (line 129)
**Root cause**: `src/infra/json-file.ts` — `writeFileSync` (line 21) creates file with default umask, then `chmodSync` (line 22) sets `0o600`. Brief window where file may be world-readable.

**Fix**: Use `{ mode: 0o600 }` in `writeFileSync` options for atomic permission setting.

### SEC-R6-MED-4: AJV strict:false in plugin schema validator

**File**: `src/plugins/schema-validator.ts` (lines 21-25)

AJV initialized with `strict: false`, allowing schemas with unrecognized keywords/formats. Plugins could supply schemas that accept values which should be rejected.

### SEC-R6-MED-5: Discord user ID in RegExp without escaping

**File**: `src/discord/monitor/message-utils.ts` (line 546)

```typescript
out = out.replace(new RegExp(`<@!?${user.id}>`, "g"), `@${label}`);
```

Discord user IDs are numeric (low exploit risk), but the pattern is fragile. Use `escapeRegExp()` for defense-in-depth.

### SEC-R6-MED-6: shell:true fallback in qmd-manager Windows spawn

**File**: `src/memory/qmd-manager.ts` (line 1423)

On EINVAL Windows spawn failure, retries with `shell: true`. Args come from internal construction, not direct user input, but file paths or collection names with shell metacharacters could be exploited.

### SEC-R6-MED-7: Bash command from chat — unsanitized flow

**File**: `src/auto-reply/reply/bash-command.ts` (line 352)

Shell commands from chat messages pass through multiple authorization gates (`isCommandFlagEnabled`, `elevated.enabled`, `elevated.allowed`, `isAuthorizedSender`, `rejectUnauthorizedCommand`), but command text itself (`request.command.trim()`) flows directly from user input to shell execution without sanitization.

### SEC-DEP-HIGH-1: pnpm 10.23.0 git-hosted script bypass (CVE-2025-69264)

**File**: `package.json` — `"packageManager": "pnpm@10.23.0"`

Git-hosted dependencies can execute `prepare`/`prepublish`/`prepack` scripts during fetch phase, bypassing pnpm v10's script blocking. Fixed in pnpm >= 10.26.0.

**Action**: Upgrade `packageManager` field to `pnpm@10.26.0` or later.

### SEC-DEP-HIGH-2: Node.js < 22.22.0 multiple CVEs

**Affected CVEs**:
- CVE-2025-55131 (High): Buffer allocation race — memory leak via `vm` module
- CVE-2025-59465 (High): HTTP/2 HEADERS frame crash (DoS)
- CVE-2025-55130 (High): Symlink path traversal for file reads
- CVE-2026-21636 (Medium): Unix Domain Socket permission bypass

**Action**: Recommend Node.js >= 22.22.0 in documentation and startup guard.

### SEC-DEP-MED-1: Vite dev server multiple CVEs (actively exploited)

**Affected CVEs**:
- CVE-2025-31125: Improper access control (CISA KEV, actively exploited)
- CVE-2025-30208: Arbitrary file read via query parameter
- CVE-2025-32395: File read via `#` character
- CVE-2025-58752: Path traversal in HTML middleware

**Risk**: Only affects dev servers exposed to network. Low risk for local-only dev use.
**Action**: Update Vite to >= 6.2.6 in UI workspace. Never expose dev server to network.

### SEC-DEP-MED-2: markdown-it highlight callback XSS (CVE-2025-7969)

**File**: Uses `markdown-it@^14.1.1`

Fenced code block rendering does not sanitize output from custom highlight callbacks. Vendor disputes this is a vulnerability. **Action**: Audit usage of highlight option; sanitize if custom highlights used.

### SEC-DEP-MED-3: chalk/strip-ansi supply chain verification

**Sept 2025 compromise**: chalk@5.6.1 and strip-ansi@7.1.1 were compromised. OpenClaw uses `chalk@^5.6.2` and `strip-ansi@^7.2.0` (past compromised versions).

**Action**: Verify lockfile contains no references to compromised versions. Run `pnpm audit`.

---

## Dependency Overrides — Verified Correct

The following pnpm overrides were verified as correctly pinned to patched versions:

| Package | Pinned Version | CVEs Addressed | Status |
|---------|---------------|----------------|--------|
| fast-xml-parser | 5.3.8 | CVE-2026-25896, CVE-2026-25128, CVE-2026-26278, CVE-2026-27942 | NOT AFFECTED |
| form-data | 2.5.4 | CVE-2025-7783 (boundary prediction) | NOT AFFECTED |
| hono | 4.12.5 | CVE-2025-62610, CVE-2025-58362, CVE-2026-24771, +3 more | NOT AFFECTED |
| tar | 7.5.10 | CVE-2026-23745, CVE-2026-24842 | NOT AFFECTED |
| tough-cookie | 4.1.3 | CVE-2023-26136 | NOT AFFECTED |
| qs | 6.14.2 | CVE-2022-24999 | NOT AFFECTED |
| playwright-core | 1.58.2 | CVE-2025-59288 (RCE) | NOT AFFECTED |
| sqlite-vec | 0.1.7-alpha.2 | CVE-2024-46488 | NOT AFFECTED |
| undici | ^7.22.0 | CVE-2025-22150 | NOT AFFECTED |
| AJV | ^8.18.0 | CVE-2025-69873 (ReDoS) | NOT AFFECTED |
| pdfjs-dist | ^5.5.207 | CVE-2024-4367 | NOT AFFECTED |
| vitest | ^4.0.18 | CVE-2025-24964, CVE-2025-24963 | NOT AFFECTED |

**No known CVEs** for: Zod 4, TypeBox 0.34, Lit 3.3, Commander.js 14, @line/bot-sdk 10, dotenv 17, chokidar 5, croner 10, tsdown, oxlint.

---

## Positive Security Findings

The codebase demonstrates mature security practices:

1. **SSRF protection** — `fetchWithSsrFGuard` with DNS pinning, private IP blocking (including IPv4-mapped IPv6), metadata hostname blocking, cross-origin redirect credential stripping. *Issue: inconsistently applied (TTS, PDF providers bypass it).*
2. **Path traversal** — `readFileWithinRoot`, `openBoundaryFileSync`, `readLocalFileSafely` with `O_NOFOLLOW`, hardlink rejection, realpath verification, inode/device identity checks.
3. **Timing-safe comparisons** — `safeEqualSecret` via `timingSafeEqual` used consistently across gateway auth, hook tokens, canvas capabilities.
4. **HTTP body limits** — `readRequestBodyWithLimit` / `readJsonBodyWithLimit` with configurable `maxBytes` and timeouts. Hooks default to 256KB max.
5. **ReDoS protection** — `compileSafeRegex` with nested repetition detection, `testRegexWithBoundedInput` caps at 2048 chars.
6. **Session security** — `SessionManager.appendMessage()` with atomic writes, file locking, session ID validation against `/^[a-z0-9][a-z0-9._-]{0,127}$/i`.
7. **Command injection prevention** — `shouldSpawnWithShell` returns `false`, `execFile` (not `exec`), Windows cmd.exe metacharacter rejection.
8. **Plugin security** — ownership checks, world-writable detection, boundary file opening, symlink escape prevention, provenance tracking.
9. **Media MIME detection** — content sniffing (`fileTypeFromBuffer`) prioritized over declared Content-Type headers.
10. **No hardcoded secrets** — only `sk-` and `ghp_` patterns in test files.

---

## Remediation Plan — 27 Phases

### Phase 1: WhatsApp PII Redaction (HIGH — SEC-HIGH-1, SEC-HIGH-2, SEC-HIGH-3)

**Complexity**: Simple | **Files**: 4 source *(amended from 3)*

1. **`src/web/auto-reply/deliver-reply.ts`**: Import `redactIdentifier`. Wrap all `msg.from` in log statements (lines 46, 76, 93, 101, 176, 182, 193, 201). Keep `msg.to` unchanged.

2. **`src/web/auto-reply/monitor/process-message.ts`**: Import `redactIdentifier`. Wrap `params.msg.from` in log objects (line 223), `fromDisplay` for DM case (line 232), deliver callback (lines 423-424), onError (line 440). Leave `ctxPayload` un-redacted.

3. **`src/web/auto-reply/monitor/on-message.ts`** *(NEW)*: Import `redactIdentifier`. Wrap `msg.from` at line 88 (same-phone verbose log). Wrap `dmRouteTarget` at line 364 (derived from phone number).

4. **`src/web/inbound/access-control.ts`**: Import `redactIdentifier`. Wrap `params.senderE164` (line 138), `candidate` (lines 172, 193), `params.from` (line 205). At line 182, redact push name: `name=${params.pushName ? "present" : "none"}`. Leave line 188 unchanged.

**Commit**: `fix(whatsapp): redact phone numbers in auto-reply and access control logs`

### Phase 2: Gateway Log Tail Redaction (HIGH — SEC-HIGH-4)

**Complexity**: Simple | **Files**: 1 source

**`src/gateway/server-methods/logs.ts`**: After `readLogSlice` returns, apply `redactSensitiveText()` to each line before serving.

**Commit**: `fix(gateway): apply redaction filter to logs.tail output`

### Phase 3: LINE Channel PII Redaction (MEDIUM — SEC-MED-1, SEC-MED-2)

**Complexity**: Simple | **Files**: 5 source *(amended with 7 additional instances)*

Apply `redactIdentifier()` to ALL LINE user ID log statements:
- `src/line/send.ts` — lines 182, **241**, **252**, 304, 322, 343, 356, 372, **419**, 460
- `src/line/bot-handlers.ts` — lines 239, 261, 269, 331, 349, 384, **464**, **473**
- `src/line/rich-menu.ts` — lines **185**, 223
- `src/line/monitor.ts` — lines 189, **264**
- `src/line/bot-message-context.ts` — line 357

**Commit**: `fix(line): redact user IDs and sender identities in log statements`

### Phase 4: Discord PII Fixes (MEDIUM — SEC-MED-3, SEC-MED-4)

**Complexity**: Simple | **Files**: 5 source *(amended from 2)*

1. **`src/discord/monitor/reply-context.ts`** (line 43): Wrap `author.id` with `redactIdentifier()`.
2. **`src/discord/send.reactions.ts`** (lines 111-118): Redact `user.id`, drop `user.tag`.
3. **`src/discord/monitor/agent-components.ts`** *(NEW)*: Wrap `user.id` at lines 290, 333, 548.
4. **`src/discord/monitor/listeners.ts`** *(NEW)*: Wrap `user.id` at line 475.
5. **`src/discord/monitor/message-handler.preflight.ts`** *(NEW)*: Wrap `author.id` at lines 251, 268.

**Commit**: `fix(discord): redact user IDs in LLM context, reactions, and verbose logs`

### Phase 5: Gateway Information Disclosure (MEDIUM — SEC-MED-5, SEC-MED-6)

Unchanged from previous plan.

**Commit**: `fix(gateway): reduce information disclosure in snapshot and presence`

### Phase 6: Session Export Path Traversal (MEDIUM — SEC-MED-7)

Unchanged from previous plan.

**Commit**: `fix(agents): validate session export path is within workspace boundary`

### Phase 7: Routing Debug Logs + Accepted Risk (MEDIUM — SEC-MED-8, SEC-MED-9)

Unchanged from previous plan.

**Commit**: `fix(routing): redact peer IDs in debug log output`

### Phase 8: WebSocket URL Validation (CRITICAL — SEC-R5-CRIT-1)

Unchanged from previous plan.

**Commit**: `fix(gateway): reject non-IP hostnames in allowPrivateWs mode`

### Phase 9: Session Key Validation (HIGH — SEC-R5-HIGH-1)

Unchanged from previous plan.

**Commit**: `fix(gateway): validate and namespace x-openclaw-session-key header`

### Phase 10: Browser Tool Output Sanitization (HIGH — SEC-R5-HIGH-2)

Unchanged from previous plan.

**Commit**: `fix(agents): sanitize browser console tool output before returning to agent`

### Phase 11: API Key Redaction in Callbacks (MEDIUM — SEC-R5-MED-1)

Unchanged from previous plan.

**Commit**: `fix(agents): mask API key in rotation retry callback`

### Phase 12: Canvas Token Entropy (MEDIUM — SEC-R5-MED-2)

Unchanged from previous plan.

**Commit**: `fix(gateway): increase canvas capability token entropy to 256 bits`

### Phase 13: Subagent Depth Limit (MEDIUM — SEC-R5-MED-3)

Unchanged from previous plan.

**Commit**: `fix(agents): enforce maximum subagent session nesting depth`

### Phase 14: Auth Mode "none" Warning (MEDIUM — SEC-R5-MED-4)

Unchanged from previous plan.

**Commit**: `fix(gateway): emit startup warning when auth mode is none`

### Phase 15: WS Handshake Log Sanitization (MEDIUM — SEC-R5-MED-5) — AMENDED

**Complexity**: Simple | **Files**: 1 source

**`src/gateway/server/ws-connection/message-handler.ts`**: Apply `sanitizeLogValue()` at ALL 5 locations:
- Line 424: `forwardedFor`, `requestOrigin`, `requestHost`, `requestUserAgent`
- Line 471 *(NEW)*: `remoteAddr`
- Line 524 *(NEW)*: `requestHost`, `requestOrigin`
- Line 578 *(NEW)*: `remoteAddr`
- Line 994 *(NEW)*: `remoteAddr`

Import `sanitizeLogValue` from parent or extract to shared module.

**Commit**: `fix(gateway): sanitize all HTTP headers in WS connection logs`

### Phase 16: Plugin HTTP Route Auth Enforcement (HIGH — SEC-R6-HIGH-1)

**Complexity**: Moderate | **Files**: 2 source

1. **`src/gateway/server/plugins-http/route-auth.ts`** (line 27): When a plugin requests `auth: "none"`, enforce a namespace restriction — only allow unauthenticated routes under `/__webhooks/` or similar designated prefix. All other paths must inherit gateway auth.

2. **`src/plugins/http-registry.ts`** (line 15): Add validation — log a warning when a plugin registers with `auth: "none"` and the path is outside the webhook namespace.

**Commit**: `fix(gateway): restrict plugin auth bypass to webhook namespace`

### Phase 17: SSRF Guard Consistency (HIGH — SEC-R6-HIGH-2, R6-HIGH-3, R6-HIGH-4)

**Complexity**: Moderate | **Files**: 3 source

1. **`src/tts/tts-core.ts`** (lines 562, 623): Replace bare `fetch()` with `fetchWithSsrFGuard` for ElevenLabs and OpenAI TTS calls. Apply private-network blocking policy.

2. **`src/agents/tools/pdf-native-providers.ts`** (lines 63, 146): Replace bare `fetch()` with `fetchWithSsrFGuard` for Anthropic and Gemini PDF analysis calls.

3. **`src/agents/tools/web-guarded-fetch.ts`** (lines 10-13): Audit all callers of `withTrustedWebToolsEndpoint`. Document which callers pass operator-controlled vs LLM-controlled URLs. Add a warning comment for the `dangerouslyAllowPrivateNetwork` flag.

**Commit**: `fix(agents): route TTS and PDF provider fetches through SSRF guard`

### Phase 18: pnpm Version Upgrade (HIGH — SEC-DEP-HIGH-1)

**Complexity**: Trivial | **Files**: 1 source

**`package.json`**: Update `"packageManager"` field from `"pnpm@10.23.0"` to `"pnpm@10.26.0"` or later.

**Commit**: `fix(deps): upgrade pnpm to 10.26.0 to fix CVE-2025-69264`

### Phase 19: Node.js Version Recommendation (HIGH — SEC-DEP-HIGH-2)

**Complexity**: Simple | **Files**: 2 source

1. **`openclaw.mjs`** (startup version guard): Update minimum version check to recommend >= 22.22.0. Log a warning if running < 22.22.0.
2. **`docs/dev/build.md`**: Update prerequisites table to recommend Node.js >= 22.22.0.

**Commit**: `fix(infra): recommend Node.js >= 22.22.0 for security patches`

### Phase 20: Vite Dev Server Update (MEDIUM — SEC-DEP-MED-1)

**Complexity**: Simple | **Files**: 1 source

**`ui/package.json`**: Update Vite dependency to `>= 6.2.6`. Add a comment noting the CISA KEV entry (CVE-2025-31125).

**Commit**: `fix(ui): update Vite to 6.2.6 for actively-exploited CVE fixes`

### Phase 21: Session Topic ID Length Validation (MEDIUM — SEC-R6-MED-1)

**Complexity**: Simple | **Files**: 1 source

**`src/config/sessions/paths.ts`** (line 243): Add length limit for topic IDs (e.g., max 256 characters before encoding). Reject or truncate longer values.

**Commit**: `fix(sessions): add length limit for topic IDs in session paths`

### Phase 22: Media Download Content-Length Check (MEDIUM — SEC-R6-MED-2)

**Complexity**: Simple | **Files**: 1 source

**`src/media/store.ts`** (line ~155): Before streaming, check `content-length` header if present. If it exceeds `MAX_BYTES`, abort early without writing to disk.

**Commit**: `fix(media): pre-check Content-Length before streaming to disk`

### Phase 23: Copilot Token File Permissions (MEDIUM — SEC-R6-MED-3)

**Complexity**: Trivial | **Files**: 1 source

**`src/infra/json-file.ts`** (line 21): Add `{ mode: 0o600 }` to `writeFileSync` options for atomic permission setting, eliminating the TOCTOU window before `chmodSync`.

**Commit**: `fix(infra): set restrictive permissions atomically on JSON file writes`

### Phase 24: Plugin Schema Validator Strictness (MEDIUM — SEC-R6-MED-4)

**Complexity**: Simple | **Files**: 1 source

**`src/plugins/schema-validator.ts`** (line 21): Change `strict: false` to `strict: true` or `strict: "log"`. Test that existing plugin schemas still validate.

**Commit**: `fix(plugins): enable strict mode in AJV schema validator`

### Phase 25: Discord RegExp Escaping (MEDIUM — SEC-R6-MED-5)

**Complexity**: Trivial | **Files**: 1 source

**`src/discord/monitor/message-utils.ts`** (line 546): Escape `user.id` before RegExp interpolation using an `escapeRegExp` utility.

**Commit**: `fix(discord): escape user ID in RegExp construction`

### Phase 26: qmd-manager Shell Fallback (MEDIUM — SEC-R6-MED-6)

**Complexity**: Simple | **Files**: 1 source

**`src/memory/qmd-manager.ts`** (line 1423): Remove `shell: true` fallback or escape args for shell context. If shell fallback is required for Windows compatibility, validate that args contain no shell metacharacters.

**Commit**: `fix(memory): remove unsafe shell fallback in qmd-manager spawn`

### Phase 27: Bash Command Flow Documentation (MEDIUM — SEC-R6-MED-7)

**Complexity**: Simple | **Files**: 1 source

**`src/auto-reply/reply/bash-command.ts`**: Add security boundary comment documenting the trust chain: channel message → authorization gates → `createExecTool().execute()`. The authorization gates are the security boundary, not input sanitization. Document that `createExecTool` is responsible for sandboxing.

**Commit**: `docs(agents): document bash command security boundary and trust chain`

---

## Implementation Priority

| Priority | Phase | Severity | Risk if Unpatched |
|----------|-------|----------|-------------------|
| P0 | 8 | CRITICAL | WebSocket MitM on private networks |
| P1 | 17 | HIGH | SSRF to internal services via TTS/PDF providers |
| P1 | 16 | HIGH | Plugin auth bypass on arbitrary paths |
| P1 | 1 | HIGH | Phone number PII in production logs |
| P1 | 9 | HIGH | Session isolation bypass via header |
| P1 | 2 | HIGH | PII exposure via log API |
| P1 | 10 | HIGH | Malicious console output in agent context |
| P1 | 18 | HIGH | pnpm supply chain bypass |
| P1 | 19 | HIGH | Node.js runtime CVEs |
| P2 | 15 | MEDIUM | Log injection via HTTP headers (5 locations) |
| P2 | 6 | MEDIUM | Path traversal in session export |
| P2 | 13 | MEDIUM | Unlimited subagent recursion |
| P2 | 20 | MEDIUM | Vite dev server actively exploited CVEs |
| P2 | 23 | MEDIUM | Token file TOCTOU |
| P2 | 25 | MEDIUM | RegExp injection |
| P2 | 26 | MEDIUM | Shell injection on Windows |
| P2 | 3-4 | MEDIUM | LINE/Discord PII in logs |
| P3 | 5, 7, 11, 12, 14 | MEDIUM | Info disclosure, config hardening |
| P3 | 21, 22, 24, 27 | MEDIUM | Input validation, defense-in-depth |

---

## Accepted Risks

| ID | Finding | Reason |
|----|---------|--------|
| SEC-MED-8 | `chat.history` returns full content | Required for UI; gated by WS auth |
| SEC-R5-LOW-1 | Plugin integrity | Standard npm trust model |
| SEC-R5-LOW-2 | Rate limiter loopback | Loopback is trusted by design |
| SEC-R5-LOW-3 | Firecrawl env var | Standard 12-factor pattern |
| SEC-R5-LOW-4 | Telegram healthz | Health endpoints are public by design |
| SEC-R6-LOW-1 | Temp file cleanup | 2-minute TTL sweep mitigates |
| SEC-R6-LOW-2 | Plugin auto-load | Documented behavior; warning emitted |
| SEC-R6-LOW-3 | Windows path checks skipped | Different security model; documented |
| SEC-R6-LOW-4 | MediaFetchError body snippets | Internal endpoint errors only |
| SEC-R6-LOW-5 | Math.random for slugs | Non-security identifiers |
| SEC-R6-LOW-6 | Media server no explicit auth | UUID bearer + 2-min TTL + single-use |
| SEC-DEP-MED-2 | markdown-it highlight XSS | Vendor disputes; audit highlight usage |
| SEC-DEP-MED-3 | chalk supply chain | Versions past compromise; verify lockfile |

---

## Cross-Cutting Recommendations

1. **CLAUDE.md Code Patterns**: Add "ALWAYS use `redactIdentifier()` from `src/logging/redact-identifier.ts` when logging user identifiers (phone numbers, user IDs, peer IDs, sender JIDs)"
2. **CLAUDE.md Code Patterns**: Add "ALWAYS use `fetchWithSsrFGuard` for any outbound HTTP fetch with configurable base URLs — never bare `fetch()` for operator/user-configurable endpoints"
3. **Defense-in-depth**: `logs.tail` redaction (Phase 2) acts as runtime safety net for future PII log leaks
4. **Custom lint rule**: Flag `msg.from`, `senderE164`, `userId`, `author.id` in template literals within `log*()` calls
5. **Dependency hygiene**: Run `pnpm audit` in CI; enforce `pnpm.minimumReleaseAge` (already set to 2 days)
6. **Plugin security**: Consider adding an explicit `"auth": "required"` default for plugin HTTP routes, requiring plugins to opt-out with documentation

---

## Verification Checklist

After all phases:

1. `pnpm build` passes without `[INEFFECTIVE_DYNAMIC_IMPORT]` warnings
2. `pnpm check` passes (format + types + lint + custom rules)
3. `pnpm test:fast` passes
4. Channel tests pass: `pnpm exec vitest run src/web/ src/line/ src/discord/`
5. Gateway tests pass: `pnpm exec vitest run src/gateway/`
6. Routing tests pass: `pnpm exec vitest run src/routing/`
7. Agent tests pass: `pnpm exec vitest run src/agents/`
8. TTS tests pass: `pnpm exec vitest run src/tts/`
9. Plugin tests pass: `pnpm exec vitest run src/plugins/`
10. No raw identifiers in log grep shows only non-log usages
11. `pnpm audit` shows no unaddressed advisories

---

## Commit Strategy (27 commits)

| # | Scope | Finding(s) | Files |
|---|-------|-----------|-------|
| 1 | `fix(whatsapp)` | HIGH-1,2,3 | 4 source |
| 2 | `fix(gateway)` | HIGH-4 | 1 source |
| 3 | `fix(line)` | MED-1,2 | 5 source |
| 4 | `fix(discord)` | MED-3,4 | 5 source |
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

**Total**: ~35 source files, ~8-10 test files

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Redacting values used for routing breaks message delivery | HIGH | Only redact in log/display contexts; routing data un-redacted |
| `logs.tail` redaction too aggressive | LOW | Uses battle-tested `redactSensitiveText` |
| Snapshot field changes break native app UI | LOW | Fields are `Type.Optional`; basenames preserve functionality |
| Path traversal fix rejects legitimate exports | LOW | Only rejects paths outside workspace |
| Discord `buildDirectLabel` change degrades LLM context | LOW | Display name preserved; only snowflake ID hashed |
| `isSecureWebSocketUrl` fix breaks VPN/Tailnet | MEDIUM | Document: use IP or wss:// for non-loopback |
| Session key validation rejects API consumers | MEDIUM | Permissive allowlist; document format |
| SSRF guard on TTS/PDF breaks custom provider URLs | MEDIUM | Only blocks private-network IPs; public URLs unaffected |
| Plugin auth enforcement breaks existing webhook plugins | MEDIUM | Grandfather existing webhook paths; add namespace gradually |
| pnpm upgrade causes lockfile churn | LOW | Single field change; lockfile regenerated on install |
| AJV strict mode rejects existing plugin schemas | MEDIUM | Test all bundled plugin schemas first; use `strict: "log"` as fallback |

---

## Audit Agent Summary

| # | Agent Type | Purpose | Findings |
|---|-----------|---------|----------|
| 1 | `security-auditor` | Round 5 codebase audit | 1 CRIT, 1 HIGH, 5 MED, 4 LOW |
| 2 | `planner` | Remediation plan (Rounds 1-4) | — (plan output) |
| 3 | `Explore` | Round 5 detail gathering | — (line-level verification) |
| 4 | `security-auditor` | Completeness verification | 13 missing instances found |
| 5 | `security-auditor` | Fresh sweep (media, config, plugins, CLI) | 2 HIGH, 7 MED, 10 LOW |
| 6 | `security-auditor` | Edge case sweep (SSRF, injection, crypto) | 3 HIGH, 6 MED, 8 LOW |
| 7 | `general-purpose` | Web research (dependency CVEs) | 2 HIGH, 3 MED, 17 verified safe |
