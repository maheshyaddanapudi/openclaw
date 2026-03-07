# OpenClaw Security Audit Report — Consolidated (Rounds 1–5)

**Date**: 2026-03-07
**Auditor**: Claude Code (security-auditor agent)
**Scope**: Full codebase — channels, gateway, agents, routing, sessions, infrastructure
**Methodology**: Multi-round static code analysis (5 rounds), public vulnerability research, CVE cross-verification, gap analysis

---

## Executive Summary

Five rounds of security auditing identified **22 findings** across the OpenClaw codebase:

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 1 | Remediation planned (Phase 8) |
| HIGH | 5 | Remediation planned (Phases 1-2, 9-10) |
| MEDIUM | 12 | Remediation planned (Phases 3-7, 11-15) |
| LOW | 4 | Accepted risk / deferred |

No findings involve remote code execution on the server or authentication bypass on default configurations. The majority are PII leakage in logs and information disclosure.

---

## Finding Index

| ID | Severity | Category | Summary | Phase |
|----|----------|----------|---------|-------|
| SEC-HIGH-1 | HIGH | PII Leakage | WhatsApp phone numbers in deliver-reply.ts logs | 1 |
| SEC-HIGH-2 | HIGH | PII Leakage | WhatsApp phone numbers in process-message.ts logs | 1 |
| SEC-HIGH-3 | HIGH | PII Leakage | WhatsApp phone numbers in access-control.ts logs | 1 |
| SEC-HIGH-4 | HIGH | Info Disclosure | Gateway logs.tail serves unredacted log content | 2 |
| SEC-MED-1 | MEDIUM | PII Leakage | LINE user IDs in log statements | 3 |
| SEC-MED-2 | MEDIUM | PII Leakage | LINE sender identity in message context logs | 3 |
| SEC-MED-3 | MEDIUM | PII Leakage | Discord user ID sent to LLM in direct label | 4 |
| SEC-MED-4 | MEDIUM | PII Leakage | Discord user IDs in reaction summaries | 4 |
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
| SEC-R5-MED-5 | MEDIUM | Log Injection | WS handshake failure logs unsanitized headers | 15 |
| SEC-R5-LOW-1 | LOW | Integrity | Plugin packages not integrity-checked | — |
| SEC-R5-LOW-2 | LOW | Rate Limiting | Rate limiter loopback exemption | — |
| SEC-R5-LOW-3 | LOW | Secret Exposure | Firecrawl API key via env var | — |
| SEC-R5-LOW-4 | LOW | Info Disclosure | Telegram healthz endpoint unauthenticated | — |

---

## Detailed Findings

### SEC-HIGH-1: WhatsApp phone numbers in deliver-reply.ts logs

**File**: `src/web/auto-reply/deliver-reply.ts`
**Lines**: 46, 76, 93, 101, 176, 182, 193, 201

`msg.from` (E.164 phone number) is logged in plaintext across debug, info, and error log statements. The codebase already has `redactIdentifier()` in `src/logging/redact-identifier.ts` and uses it in `src/web/outbound.ts:47`, but the auto-reply path was missed.

### SEC-HIGH-2: WhatsApp phone numbers in process-message.ts logs

**File**: `src/web/auto-reply/monitor/process-message.ts`
**Lines**: 223, 232, 235, 423-424, 440

Same pattern — `params.msg.from` flows into structured log objects and `fromDisplay` variables used in log calls. The `ctxPayload` object (lines 296-331) must remain un-redacted as it's used for routing.

### SEC-HIGH-3: WhatsApp phone numbers in access-control.ts logs

**File**: `src/web/inbound/access-control.ts`
**Lines**: 138, 172, 182, 193, 205

`params.senderE164` and `candidate` phone numbers appear in logVerbose calls during pairing and authorization flows. Line 188 is a user-facing message (not a log) and must remain unchanged.

### SEC-HIGH-4: Gateway logs.tail serves unredacted content

**File**: `src/gateway/server-methods/logs.ts` (line ~170)

`readLogSlice` returns raw log content that may contain PII from pre-redaction log entries. The `redactSensitiveText` function from `src/logging/redact.ts` exists but isn't applied to the output.

### SEC-MED-1: LINE user IDs in log statements

**Files**: `src/line/send.ts`, `src/line/bot-handlers.ts`, `src/line/rich-menu.ts`, `src/line/monitor.ts`

LINE user IDs (`userId`, `senderId`, `ctxPayload.From`) logged in plaintext across verbose and info log statements in multiple files.

### SEC-MED-2: LINE sender identity in message context logs

**File**: `src/line/bot-message-context.ts` (line 357)

`ctxPayload.From` appears unredacted in the log output at `from=${ctxPayload.From}`.

### SEC-MED-3: Discord user ID sent to LLM in direct label

**File**: `src/discord/monitor/reply-context.ts` (line 43)

`buildDirectLabel` includes raw Discord snowflake `author.id` in LLM context: `return \`${username ?? "unknown"} user id:${author.id}\``. This exposes immutable Discord user IDs to the LLM provider.

### SEC-MED-4: Discord user IDs in reaction summaries

**File**: `src/discord/send.reactions.ts` (lines 111-118)

Reaction summaries include `user.id` and `user.tag`, which flow into agent context.

### SEC-MED-5: Full filesystem paths in gateway snapshot

**File**: `src/gateway/server/health-state.ts` (lines 35-36)

Full `CONFIG_PATH` and `STATE_DIR` filesystem paths are exposed in the gateway snapshot, leaking directory structure to API consumers.

### SEC-MED-6: Hostname/IP in SystemPresence (default-on)

**File**: `src/infra/system-presence.ts` (lines 51-53)

`os.hostname()` and `resolvePrimaryIPv4()` are included in presence by default, exposing internal network topology.

### SEC-MED-7: Session export path traversal

**File**: `src/auto-reply/reply/commands-export-session.ts` (after line 178)

No validation that the resolved export path stays within the agent workspace directory. Paths like `../../../etc/` would be accepted.

### SEC-MED-8: chat.history returns full content (Accepted Risk)

**File**: `src/gateway/server-methods/chat.ts`

Intentionally returns full message content for UI rendering. Access gated by WS authentication, 1000-message hard max. Truncating would break the user experience.

### SEC-MED-9: Raw peer IDs in routing debug logs

**File**: `src/routing/resolve-route.ts` (line 691)

`formatPeer()` outputs raw peer IDs in `logDebug()` calls. The `buildResolvedRouteCacheKey` (line 545) is NOT a log — it's an in-memory cache key and must remain un-redacted.

### SEC-R5-CRIT-1: `isSecureWebSocketUrl` allows `ws://` to any hostname

**File**: `src/gateway/net.ts` (lines 411-450)

When `allowPrivateWs=true`, the function falls through to `net.isIP(hostForIpCheck) === 0` at line 447, which returns `true` for ANY hostname that isn't a numeric IP address — including `attacker.com`. The code comment acknowledges DNS resolution isn't available but doesn't mitigate.

```typescript
// Current (VULNERABLE):
return net.isIP(hostForIpCheck) === 0;  // true for "attacker.com"
```

**Root Cause**: `net.isIP()` returns `0` for non-IP strings, which is being used as a pass-through for hostnames that "might" resolve to private networks. This creates an open bypass for any public hostname.

### SEC-R5-HIGH-1: `x-openclaw-session-key` unsanitized

**File**: `src/gateway/http-utils.ts` (lines 66-80)

The `resolveSessionKey` function returns user-supplied header values directly without any validation — no length limit, no character allowlist, no namespace scoping. This flows into session lookups, routing, and potentially logs.

```typescript
const explicit = getHeader(params.req, "x-openclaw-session-key")?.trim();
if (explicit) {
  return explicit;  // No validation
}
```

**Impact**: Session isolation bypass, injection into session key namespace, log injection if sessionKey appears in error messages.

### SEC-R5-HIGH-2: Browser tool console action lacks output validation

**File**: `src/agents/tools/browser-tool.actions.ts` (lines 236-283)

The `executeConsoleAction` returns raw browser console output to the LLM. If a malicious website injects console messages, these flow into the agent context unsanitized. The browser is sandboxed, but the output path lacks sanitization.

### SEC-R5-MED-1: API key passed to onRetry callback

**File**: `src/agents/api-key-rotation.ts` (line 64)

```typescript
params.onRetry?.({ apiKey, error, attempt, message });
```

The plaintext `apiKey` is passed to the callback. If any caller logs the callback parameters, the key is exposed.

### SEC-R5-MED-2: Canvas capability token 144-bit entropy

**File**: `src/gateway/canvas-capability.ts` (line 21)

`randomBytes(18)` produces 144 bits. While above the 128-bit minimum, OWASP recommends 256 bits for unguessable tokens. Combined with a 10-minute TTL, the risk is low but improvable.

### SEC-R5-MED-3: Subagent session key depth unlimited

**File**: `src/sessions/session-key-utils.ts` (lines 77-95)

`isSubagentSessionKey` only checks for the `subagent:` prefix. `getSubagentDepth` counts `:subagent:` occurrences with no maximum. Deeply nested keys could cause performance issues or bypass depth-based security checks.

### SEC-R5-MED-4: Auth `mode: none` allows unauthenticated access

**File**: `src/gateway/auth.ts` (line 23)

`"none"` is a valid `ResolvedGatewayAuthMode`. When configured, all gateway APIs are accessible without authentication. While intentional for trusted environments, there's no warning logged at startup.

### SEC-R5-MED-5: WS handshake failure logs unsanitized

**File**: `src/gateway/server/ws-connection/message-handler.ts` (line 424)

```typescript
logWsControl.warn(
  `invalid handshake conn=${connId} remote=${remoteAddr ?? "?"} fwd=${forwardedFor ?? "n/a"} origin=${requestOrigin ?? "n/a"} host=${requestHost ?? "n/a"} ua=${requestUserAgent ?? "n/a"}`,
);
```

Headers are logged without `sanitizeLogValue()`, which IS used in the close handler at `ws-connection.ts:207-235`. Log injection via crafted HTTP headers (newlines, control characters).

### SEC-R5-LOW-1 through LOW-4 (Deferred)

- **LOW-1**: Plugin packages not integrity-checked — standard npm trust model
- **LOW-2**: Rate limiter loopback exemption — loopback is trusted by design
- **LOW-3**: Firecrawl API key via env var — standard 12-factor pattern
- **LOW-4**: Telegram healthz endpoint unauthenticated — health endpoints are public by design

---

## Remediation Plan — 15 Phases

### Phase 1: WhatsApp PII Redaction (HIGH — SEC-HIGH-1, SEC-HIGH-2, SEC-HIGH-3)

**Complexity**: Simple | **Files**: 3 source

1. **`src/web/auto-reply/deliver-reply.ts`**: Import `redactIdentifier` from `../../logging/redact-identifier.js`. Wrap all `msg.from` occurrences in log statements (lines 46, 76, 93, 101, 176, 182, 193, 201) with `redactIdentifier()`. Keep `msg.to` (bot's own number) unchanged.

2. **`src/web/auto-reply/monitor/process-message.ts`**: Import `redactIdentifier`. Wrap `params.msg.from` in log objects (line 223) and `fromDisplay` for DM case (line 232). Apply to deliver callback (lines 423-424) and onError (line 440). Leave `ctxPayload` object un-redacted (routing data).

3. **`src/web/inbound/access-control.ts`**: Import `redactIdentifier`. Wrap `params.senderE164` (line 138), `candidate` (lines 172, 193), `params.from` (line 205). At line 182, redact push name presence: `name=${params.pushName ? "present" : "none"}`. Leave line 188 (user-facing message) unchanged.

**Commit**: `fix(whatsapp): redact phone numbers in auto-reply and access control logs`

### Phase 2: Gateway Log Tail Redaction (HIGH — SEC-HIGH-4)

**Complexity**: Simple | **Files**: 1 source

**`src/gateway/server-methods/logs.ts`**: Import `redactSensitiveText` and `getDefaultRedactPatterns` from `../../logging/redact.js`. After `readLogSlice` returns, apply `redactSensitiveText()` to each line before serving.

**Commit**: `fix(gateway): apply redaction filter to logs.tail output`

### Phase 3: LINE Channel PII Redaction (MEDIUM — SEC-MED-1, SEC-MED-2)

**Complexity**: Simple | **Files**: 5 source

Apply `redactIdentifier()` to all LINE user ID and sender identity log statements across:
- `src/line/send.ts` — lines 182, 304, 322, 343, 356, 372, 460
- `src/line/bot-handlers.ts` — lines 239, 261, 269, 331, 349, 384
- `src/line/rich-menu.ts` — line 223
- `src/line/monitor.ts` — line 189
- `src/line/bot-message-context.ts` — line 357

**Commit**: `fix(line): redact user IDs and sender identities in log statements`

### Phase 4: Discord PII Fixes (MEDIUM — SEC-MED-3, SEC-MED-4)

**Complexity**: Simple | **Files**: 2 source

1. **`src/discord/monitor/reply-context.ts`** (line 43): Wrap `author.id` with `redactIdentifier()` in `buildDirectLabel`.
2. **`src/discord/send.reactions.ts`** (lines 111-118): Redact `user.id`, drop `user.tag` from reaction summaries.

**Commit**: `fix(discord): redact user IDs in LLM context and reaction summaries`

### Phase 5: Gateway Information Disclosure (MEDIUM — SEC-MED-5, SEC-MED-6)

**Complexity**: Moderate | **Files**: 2 source

1. **`src/gateway/server/health-state.ts`** (lines 35-36): Replace `CONFIG_PATH`/`STATE_DIR` with `path.basename()`.
2. **`src/infra/system-presence.ts`** (lines 51-53): Gate hostname/IP behind `OPENCLAW_EXPOSE_HOST_INFO=1` env var. Default to `"Gateway"` label when not set.

**Commit**: `fix(gateway): reduce information disclosure in snapshot and presence`

### Phase 6: Session Export Path Traversal (MEDIUM — SEC-MED-7)

**Complexity**: Simple | **Files**: 1 source + tests

**`src/auto-reply/reply/commands-export-session.ts`**: After path resolution (line 178), validate that `path.resolve(outputPath)` starts with `path.resolve(params.workspaceDir)`. Throw on violation with basename-only error message.

```typescript
const resolvedWorkspace = path.resolve(params.workspaceDir);
const resolvedOutput = path.resolve(outputPath);
if (!resolvedOutput.startsWith(resolvedWorkspace + path.sep) && resolvedOutput !== resolvedWorkspace) {
  throw new Error(
    `Export path must be within the workspace directory. ` +
    `Resolved: ${path.basename(resolvedOutput)}, ` +
    `Workspace: ${path.basename(resolvedWorkspace)}`
  );
}
```

**Commit**: `fix(agents): validate session export path is within workspace boundary`

### Phase 7: Routing Debug Logs + Accepted Risk (MEDIUM — SEC-MED-8, SEC-MED-9)

**Complexity**: Simple | **Files**: 2 source

1. **`src/routing/resolve-route.ts`** (line 691): Add `formatPeerForLog()` that uses `redactIdentifier()`, use it in `logDebug()` call. Leave `formatPeer`/cache key functions unchanged.
2. **`src/gateway/server-methods/chat.ts`**: Add documenting comment at line 596 noting SEC-MED-8 accepted risk.

**Commit**: `fix(routing): redact peer IDs in debug log output`

### Phase 8: WebSocket URL Validation (CRITICAL — SEC-R5-CRIT-1)

**Complexity**: Moderate | **Files**: 1 source + tests

**`src/gateway/net.ts`** (line 447): Replace the dangerous fallthrough. When `allowPrivateWs=true` and the hostname is not an IP, reject it — force operators to use IPs or `wss://` for non-loopback connections.

```typescript
// Replace line 447:
// return net.isIP(hostForIpCheck) === 0;
// With:
return false;  // Non-IP hostnames cannot be validated synchronously; require wss://
```

Add tests covering:
- `ws://attacker.com` → `false` (was `true`, now fixed)
- `ws://192.168.1.1` → `true` (private IP, allowed)
- `ws://localhost` → `true` (loopback, always allowed)
- `wss://anything.com` → `true` (TLS always allowed)

**Commit**: `fix(gateway): reject non-IP hostnames in allowPrivateWs mode`

### Phase 9: Session Key Validation (HIGH — SEC-R5-HIGH-1)

**Complexity**: Moderate | **Files**: 1 source + tests

**`src/gateway/http-utils.ts`** (lines 72-74): Add validation to `resolveSessionKey`:

1. Length limit: max 512 characters
2. Character allowlist: `[\w:.@-]` — reject control characters, newlines, special chars
3. Namespace scoping: prefix with `ext:` to prevent collision with internal namespaces

```typescript
const explicit = getHeader(params.req, "x-openclaw-session-key")?.trim();
if (explicit) {
  if (explicit.length > 512) {
    throw new HttpError(400, "x-openclaw-session-key too long");
  }
  if (!/^[\w:.@-]+$/.test(explicit)) {
    throw new HttpError(400, "x-openclaw-session-key contains invalid characters");
  }
  return buildAgentMainSessionKey({ agentId: params.agentId, mainKey: `ext:${explicit}` });
}
```

**Commit**: `fix(gateway): validate and namespace x-openclaw-session-key header`

### Phase 10: Browser Tool Output Sanitization (HIGH — SEC-R5-HIGH-2)

**Complexity**: Moderate | **Files**: 1 source

**`src/agents/tools/browser-tool.actions.ts`**: Add output size limit and content sanitization to `executeConsoleAction`:

1. Cap total console output to 50KB before returning to agent
2. Strip messages containing patterns matching API keys, tokens, or credentials (use `redactSensitiveText`)
3. Add a warning prefix if console output appears to contain injected content

**Commit**: `fix(agents): sanitize browser console tool output before returning to agent`

### Phase 11: API Key Redaction in Callbacks (MEDIUM — SEC-R5-MED-1)

**Complexity**: Simple | **Files**: 1 source

**`src/agents/api-key-rotation.ts`** (line 64): Mask the API key in the callback:

```typescript
const maskedKey = apiKey.length > 8
  ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`
  : "***";
params.onRetry?.({ apiKey: maskedKey, error, attempt, message });
```

Update the `onRetry` callback type to document that `apiKey` is masked.

**Commit**: `fix(agents): mask API key in rotation retry callback`

### Phase 12: Canvas Token Entropy (MEDIUM — SEC-R5-MED-2)

**Complexity**: Trivial | **Files**: 1 source

**`src/gateway/canvas-capability.ts`** (line 21): Increase from 18 to 32 bytes (256 bits):

```typescript
return randomBytes(32).toString("base64url");
```

**Commit**: `fix(gateway): increase canvas capability token entropy to 256 bits`

### Phase 13: Subagent Depth Limit (MEDIUM — SEC-R5-MED-3)

**Complexity**: Simple | **Files**: 1 source + tests

**`src/sessions/session-key-utils.ts`**: Add `MAX_SUBAGENT_DEPTH = 5` constant. Enforce it in `getSubagentDepth()` by throwing when depth exceeds the limit.

**Commit**: `fix(agents): enforce maximum subagent session nesting depth`

### Phase 14: Auth Mode "none" Warning (MEDIUM — SEC-R5-MED-4)

**Complexity**: Simple | **Files**: 1 source

**`src/gateway/startup-auth.ts`** (or equivalent startup path): When `resolveGatewayAuth` returns `mode: "none"`, log a prominent warning about unauthenticated access being enabled.

**Commit**: `fix(gateway): emit startup warning when auth mode is none`

### Phase 15: WS Handshake Log Sanitization (MEDIUM — SEC-R5-MED-5)

**Complexity**: Simple | **Files**: 1 source

**`src/gateway/server/ws-connection/message-handler.ts`** (line 424): Apply `sanitizeLogValue()` to `forwardedFor`, `requestOrigin`, `requestHost`, and `requestUserAgent`, matching the pattern in the close handler at `ws-connection.ts:207-235`.

**Commit**: `fix(gateway): sanitize HTTP headers in WS handshake failure logs`

---

## Implementation Priority

Execute in this order (CRITICAL/HIGH first, then MEDIUM by risk):

| Priority | Phase | Severity | Risk if Unpatched |
|----------|-------|----------|-------------------|
| P0 | 8 | CRITICAL | WebSocket MitM on private networks |
| P1 | 1 | HIGH | Phone number PII in production logs |
| P1 | 9 | HIGH | Session isolation bypass via header |
| P1 | 2 | HIGH | PII exposure via log API |
| P1 | 10 | HIGH | Malicious console output in agent context |
| P2 | 15 | MEDIUM | Log injection via HTTP headers |
| P2 | 6 | MEDIUM | Path traversal in session export |
| P2 | 13 | MEDIUM | Unlimited subagent recursion |
| P2 | 3-4 | MEDIUM | LINE/Discord PII in logs |
| P3 | 5, 7, 11, 12, 14 | MEDIUM | Info disclosure, config hardening |

---

## Accepted Risks

| ID | Finding | Reason |
|----|---------|--------|
| SEC-MED-8 | `chat.history` returns full content | Required for UI functionality; gated by WS auth |
| SEC-R5-LOW-1 | Plugin integrity | Plugins run from local filesystem; npm audit covers supply chain |
| SEC-R5-LOW-2 | Rate limiter loopback exemption | Loopback is trusted; changing would break dev workflows |
| SEC-R5-LOW-3 | Firecrawl env var | Standard 12-factor pattern; env isolation is operator responsibility |
| SEC-R5-LOW-4 | Telegram healthz | Health endpoints are by design unauthenticated |

---

## Cross-Cutting Recommendations

1. **Add to CLAUDE.md Code Patterns**: "ALWAYS use `redactIdentifier()` from `src/logging/redact-identifier.ts` when logging user identifiers (phone numbers, user IDs, peer IDs, sender JIDs)"
2. **Defense-in-depth**: The `logs.tail` redaction (Phase 2) acts as a runtime safety net for any future PII log leaks
3. **Custom lint rule**: Consider adding a script in `scripts/custom-lint/` that flags `msg.from`, `senderE164`, `userId`, `author.id` in template literals within `log*()` calls

---

## Verification Checklist

After all phases:

1. `pnpm build` passes without `[INEFFECTIVE_DYNAMIC_IMPORT]` warnings
2. `pnpm check` passes (format + types + lint + custom rules)
3. `pnpm test:fast` passes
4. Channel-specific tests pass: `pnpm exec vitest run src/web/ src/line/ src/discord/`
5. Gateway tests pass: `pnpm exec vitest run src/gateway/`
6. Routing tests pass: `pnpm exec vitest run src/routing/`
7. No raw identifiers in log grep: `grep -rn "msg\.from\|senderE164\|author\.id" src/ --include="*.ts"` shows only non-log usages

---

## Commit Strategy (15 commits)

| # | Scope | Finding(s) | Files |
|---|-------|-----------|-------|
| 1 | `fix(whatsapp)` | HIGH-1,2,3 | 3 source |
| 2 | `fix(gateway)` | HIGH-4 | 1 source |
| 3 | `fix(line)` | MED-1,2 | 5 source |
| 4 | `fix(discord)` | MED-3,4 | 2 source |
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

**Total**: ~24 source files, ~6-8 test files

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Redacting values used for routing/session keys breaks message delivery | HIGH | Only redact in log statements and display contexts; ctxPayload, cache keys, and session keys remain un-redacted |
| `logs.tail` redaction too aggressive | LOW | Uses battle-tested `redactSensitiveText` already used for tool output |
| Snapshot field changes break native app UI | LOW | Fields are `Type.Optional` — apps handle missing values; basenames preserve functionality |
| Path traversal fix rejects legitimate export paths | LOW | Only rejects paths outside workspace; default behavior unaffected |
| Discord `buildDirectLabel` change degrades LLM context | LOW | Display name preserved; only numeric snowflake ID hashed |
| `OPENCLAW_EXPOSE_HOST_INFO` default change hides info operators rely on | LOW | Secure-by-default; operators can opt in via env var |
| `isSecureWebSocketUrl` fix breaks VPN/Tailnet deployments | MEDIUM | Operators using hostname-based private WS must switch to IP or wss://; document in migration notes |
| Session key validation rejects existing API consumers | MEDIUM | `ext:` prefix and allowlist are permissive; document header format requirements |
