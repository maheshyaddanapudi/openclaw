# OpenClaw Comprehensive Security Audit Report

**Date:** 2026-03-07
**Methodology:** Multi-angle static code analysis + public vulnerability research + CVE fix cross-verification + gap analysis re-examination + comprehensive web research deep dive (4 rounds)
**Auditors:** 17 agents across 4 rounds (5 security-auditors + 2 web researchers + 1 CVE verifier + 1 backup + 7 gap analysis agents + 1 deep web researcher)
**Scope:** Full codebase (src/, extensions/, ui/, plugins, gateway, channels, agents, sandbox) + public CVE/GHSA databases + attack campaign research + government advisories + industry assessments

---

## Executive Summary

This report consolidates findings from 4 rounds of parallel security assessments covering:

**Round 1 — Code Audit (5 agents):**
1. Authentication & Secrets — Gateway auth, credential storage, API key rotation, session management
2. Input Validation & Injection — Command injection, SQL injection, path traversal, XSS, SSRF, ReDoS
3. Network & API Security — HTTP headers, TLS, CORS, WebSocket DoS, rate limiting, webhook verification
4. Privacy & Data Exposure — PII in logs/sessions, phone numbers, media handling, cross-channel leakage
5. Plugin & Sandbox Security — Plugin isolation, SDK boundaries, agent sandboxing, supply chain risks

**Round 2 — Public Research + Verification (4 agents):**
6. Known CVEs, security advisories, supply chain attacks, exposed instances
7. CVE fix cross-verification against current codebase
8. Deep-dive additional public vulnerabilities

**Round 3 — Gap Analysis & Re-Examination (7 agents):**
9. Crypto & Session Security re-examination
10. Extension-specific deep audit (msteams, voice-call, matrix, nostr, googlechat)
11. Agent tool abuse chains
12. Web research gaps — missed CVEs/GHSAs
13. Gateway auth re-examination
14. Data flow & PII deep dive
15. Broad web research sweep (attack campaigns, government actions, compliance)

**Round 4 — Comprehensive Web Research Deep Dive (1 agent):**
16. Exhaustive CVE/GHSA database search, government advisory compilation, prompt injection pattern catalog, sandbox bypass taxonomy, GDPR compliance analysis

### Aggregate Findings (All 4 Rounds)

| Severity | Round 1 | Round 2 | Round 3 | Round 4 | Total |
|----------|---------|---------|---------|---------|-------|
| **CRITICAL** | 3 | 12+ (public CVEs) | 3 new code + 18 new CVEs | 2 new CVEs + 6 GHSAs | 44+ |
| **HIGH** | 20 | 15+ (public) | 15 new code + 7 new GHSAs | 13 new CVEs + 18 GHSAs | 88+ |
| **MEDIUM** | 31 | 20+ (public) | 33 new code | 1 CVE + 22 GHSAs | 107+ |
| **LOW** | 45 | — | 31 (incl. 7 positive) | — | 76+ |

**Total unique public advisories: 58+ CVEs + 103+ GHSAs + 7 government/institutional advisories + 5 major attack campaigns + 10 industry vendor assessments**

### Top 3 Systemic Risks

1. **Plugin system has no security boundary** — Plugins run in-process with unrestricted shell exec, config write access, and full channel operation capabilities (3 CRITICALs)
2. **Rate limiting and DoS protection gaps** — No WebSocket connection limits, no HTTP rate limiting on general endpoints, no WS message rate limiting (3 HIGHs)
3. **PII leakage in logs** — WhatsApp phone numbers and Signal E.164 numbers logged in plaintext across multiple modules (6 HIGHs)

---

## Part 1: Code Audit Findings

### 1.1 CRITICAL Findings (3)

#### CRIT-1: Unrestricted Shell Command Execution Exposed to All Plugins
- **File:** `src/plugins/runtime/runtime-system.ts:11`
- **Impact:** Any loaded plugin can execute arbitrary system commands with full privileges of the OpenClaw process via `runCommandWithTimeout`
- **Attack vector:** Malicious plugin from ClawHub or npm installs and runs arbitrary commands
- **Remediation:** Remove `runCommandWithTimeout` from plugin runtime API or implement a command allowlist with capability-based gating

#### CRIT-2: Full Configuration Write Access Exposed to All Plugins
- **File:** `src/plugins/runtime/runtime-config.ts:5-6`
- **Impact:** Any plugin can overwrite `~/.openclaw/config.yml` — can remove itself from deny list, disable gateway authentication, modify routing bindings, or alter channel credentials
- **Attack vector:** Malicious plugin disables auth, then exfiltrates all data
- **Remediation:** Remove `writeConfigFile` from plugin runtime API or restrict to a scoped config namespace per plugin

#### CRIT-3: Plugin Code Safety Scanner Never Blocks Installation
- **File:** `src/plugins/install.ts:284-306`
- **Impact:** Scanner detects `eval()`, `child_process`, `new Function()`, and crypto-mining but only warns — never blocks. Malicious code installs and executes regardless of scan results
- **Attack vector:** ClawHavoc-style supply chain attack — malicious skills pass through scanner unblocked
- **Remediation:** Change scanner from warn-only to blocking when `scanSummary.critical > 0`. Require explicit user confirmation to override

---

### 1.2 HIGH Findings (20)

#### Authentication & Secrets (2 HIGH)

| ID | Finding | File | Remediation |
|----|---------|------|-------------|
| AUTH-H1 | `eval()` and `new Function()` used with agent-tool-supplied code in browser interactions | `src/browser/pw-tools-core.interactions.ts:302-339` | Restrict to pre-approved operations; validate `fnBody` input |
| AUTH-H2 | OAuth tokens, API keys, and refresh tokens stored as plaintext JSON on disk (only `0o600` permissions, no encryption) | `src/agents/auth-profiles/store.ts`, `src/infra/json-file.ts:16-23` | Integrate with OS keychain (macOS Keychain, Linux libsecret, Windows Credential Manager) |

#### Input Validation & Injection (2 HIGH)

| ID | Finding | File | Remediation |
|----|---------|------|-------------|
| INJ-H1 | User-controlled URLs injected into CLI command arguments via template interpolation | `src/link-understanding/runner.ts:54-68` | Sanitize/escape URLs before template substitution; pass via stdin or env vars |
| INJ-H2 | Unrestricted JavaScript evaluation in browser automation via `eval()` and `new Function()` | `src/browser/pw-tools-core.interactions.ts:302-339` | Add validation layer; use `page.exposeFunction` for structured communication |

#### Network & API (4 HIGH)

| ID | Finding | File | Remediation |
|----|---------|------|-------------|
| NET-H1 | No WebSocket connection limit — `clients` set grows without bound | `src/gateway/server-runtime-state.ts:186-189` | Add `maxConnections` config + per-IP limits (e.g., 10/IP, 500 global) |
| NET-H2 | No HTTP request rate limiting on general endpoints | `src/gateway/server-http.ts` | Implement per-IP rate limiting early in HTTP handler (e.g., 100 req/s/IP) |
| NET-H3 | No WebSocket message rate limiting — authenticated clients can flood unlimited messages | `src/gateway/server/ws-connection/message-handler.ts:363` | Add per-connection message rate limiting (e.g., 60 msg/s); close with code 1008 |
| NET-H4 | CSP `connect-src` allows all WebSocket origins (`ws: wss:`) | `src/gateway/control-ui-csp.ts:15` | Change to `'self'` — modern browsers include WS for same origin |

#### Privacy & Data Exposure (6 HIGH)

| ID | Finding | File | Remediation |
|----|---------|------|-------------|
| PII-H1 | WhatsApp phone numbers logged in plaintext in deliver-reply module (7+ locations) | `src/web/auto-reply/deliver-reply.ts:46,76,93,176,193,201` | Apply `redactIdentifier()` to all `msg.from` references (pattern exists in `src/web/outbound.ts`) |
| PII-H2 | WhatsApp inbound handler logs raw JIDs and phone numbers | `src/web/auto-reply/monitor/process-message.ts:223,232,424,440` | Apply `redactIdentifier()` consistently |
| PII-H3 | `logWebSelfId()` logs gateway operator's own phone number and JID | `src/web/auth-store.ts:188-191` | Hash or redact; show only last 4 digits |
| PII-H4 | Signal inbound logs raw E.164 phone numbers in verbose mode | `src/signal/monitor/event-handler.ts:217` | Apply `redactIdentifier()` to `ctxPayload.From` |
| PII-H5 | Session transcript files stored unencrypted at rest (all conversation history in plaintext) | `src/config/sessions/store.ts:582`, `src/config/sessions/transcript.ts:78` | Implement optional encryption-at-rest using user-provided key or OS keychain |
| PII-H6 | Message content logged in verbose mode (up to 400 chars) across WhatsApp and Signal | `src/web/auto-reply/monitor/process-message.ts:238,429`, `src/signal/monitor/event-handler.ts:217` | Separate message-content logging from verbose mode; add `logging.includeMessageContent` flag (default: false) |

#### Plugin & Sandbox (6 HIGH)

| ID | Finding | File | Remediation |
|----|---------|------|-------------|
| PLG-H1 | Zero process isolation — plugins load via dynamic import into main Node.js process, sharing process.env, module cache, heap | `src/plugins/loader.ts` | Investigate worker thread or child process isolation for non-bundled plugins |
| PLG-H2 | No cryptographic integrity verification for plugins (no signatures, checksums, or hashes) | `src/plugins/discovery.ts:117-193` | Add signature/checksum verification at install and load time |
| PLG-H3 | Plugin hooks enable prompt injection by default (`before_prompt_build` allows system prompt replacement) | `src/plugins/hooks.ts:139-156` | Default `allowPromptInjection` to `false`; require explicit opt-in per plugin |
| PLG-H4 | Full channel operation access exposed to all plugins (monitor, send, route for all channels) | `src/plugins/runtime/runtime-channel.ts:119-263` | Implement per-plugin capability declarations and enforcement |
| PLG-H5 | Plugins can register unauthenticated HTTP endpoints (`auth: "plugin"` bypasses gateway auth) | `src/plugins/registry.ts:328-336` | Require gateway auth for all plugin routes by default; opt-out requires explicit approval |
| PLG-H6 | `new Function()` with `eval()` in browser tools using LLM-generated code | `src/browser/pw-tools-core.interactions.ts:302,333` | Same as INJ-H2 |

---

### 1.3 MEDIUM Findings (31)

#### Authentication & Secrets (5 MEDIUM)

| ID | Finding | File |
|----|---------|------|
| AUTH-M1 | Gateway auth mode `"none"` disables auth unconditionally — no guard against non-loopback bind | `src/gateway/auth.ts:400` |
| AUTH-M2 | `x-openclaw-session-key` header accepts arbitrary session keys without ownership validation | `src/gateway/http-utils.ts:72-74` |
| AUTH-M3 | `dangerouslyDisableDeviceAuth` flag bypasses device identity verification with only a log warning | `src/gateway/server/ws-connection/connect-policy.ts:24-31` |
| AUTH-M4 | Canvas capability tokens transmitted via URL path segments (visible in logs, Referer headers) | `src/gateway/canvas-capability.ts:3-4,20-22` |
| AUTH-M5 | API key rotation is failover only — compromised keys remain active indefinitely | `src/agents/api-key-rotation.ts:40-72` |

#### Input Validation & Injection (4 MEDIUM)

| ID | Finding | File |
|----|---------|------|
| INJ-M1 | SQL table names interpolated via template literals (safe today but fragile pattern) | `src/memory/manager.ts:613`, `src/memory/manager-sync-ops.ts:711` |
| INJ-M2 | MIME type detection fallback chain influenced by attacker-controlled filenames | `src/media/mime.ts:116-146` |
| INJ-M3 | Template interpolation substitutes raw unsanitized user input into CLI args | `src/auto-reply/templating.ts:229-237` |
| INJ-M4 | Environment variable logging defaults to plaintext — redaction requires explicit opt-in | `src/infra/env.ts:37` |

#### Network & API (7 MEDIUM)

| ID | Finding | File |
|----|---------|------|
| NET-M1 | Gateway client disables TLS certificate verification when using fingerprint pinning | `src/gateway/client.ts:148` |
| NET-M2 | No HTTP server timeout configuration (vulnerable to Slowloris attacks) | `src/gateway/server-http.ts` |
| NET-M3 | No WebSocket ping/pong keepalive mechanism — dead connections persist | `src/gateway/server/ws-connection.ts` |
| NET-M4 | CORS preflight on browser extension relay reflects all requested headers | `src/browser/extension-relay.ts:551` |
| NET-M5 | Missing explicit CORS policy on main gateway HTTP server | `src/gateway/server-http.ts` |
| NET-M6 | Default security headers missing X-Frame-Options and CSP on non-Control-UI responses | `src/gateway/http-common.ts:11-22` |
| NET-M7 | Self-signed TLS cert uses RSA 2048 with 10-year validity (NIST recommends 3072+ for post-2030) | `src/infra/tls/gateway.ts:44-59` |

#### Privacy & Data Exposure (9 MEDIUM)

| ID | Finding | File |
|----|---------|------|
| PII-M1 | Gateway snapshot exposes internal filesystem paths to all connected clients | `src/gateway/server/health-state.ts:35-36` |
| PII-M2 | Account snapshots expose phone number allowlists | `src/channels/account-snapshot-fields.ts:201-203` |
| PII-M3 | Uncaught error handler exposes full stack traces (internal paths, module structure) | `src/infra/errors.ts:87-96` |
| PII-M4 | WhatsApp auth credentials stored unencrypted at `~/.openclaw/oauth/whatsapp/` | `src/web/auth-store.ts:19-25,72` |
| PII-M5 | Media files created with world-readable permissions (0o644) for Docker sandbox access | `src/media/store.ts:19` |
| PII-M6 | Media server endpoint serves files without authentication (relies on random UUID only) | `src/media/server.ts` |
| PII-M7 | Browser eval with LLM-generated content in Playwright context | `src/browser/pw-tools-core.interactions.ts:302-339` |
| PII-M8 | Session metadata stores PII indefinitely (phone numbers, JIDs, display names) | `src/config/sessions/types.ts:14-23` |
| PII-M9 | WhatsApp same-phone detection logs raw phone number | `src/web/auto-reply/monitor/on-message.ts:88` |

#### Plugin & Sandbox (6 MEDIUM)

| ID | Finding | File |
|----|---------|------|
| PLG-M1 | Non-bundled plugins auto-enable without explicit allowlist | `src/plugins/config-state.ts:189-220` |
| PLG-M2 | SSRF protection disabled for trusted web tool endpoints (allows private network access) | `src/agents/tools/web-guarded-fetch.ts:10-13` |
| PLG-M3 | Full configuration read access exposed to plugins (all API keys, tokens, credentials) | `src/plugins/runtime/runtime-config.ts:4-5` |
| PLG-M4 | Skill override via workspace precedence — malicious SKILL.md can replace bundled skills | `src/agents/skills/workspace.ts:369-388` |
| PLG-M5 | Plugin npm dependency installation runs arbitrary postinstall scripts (no `--ignore-scripts`) | `src/plugins/install.ts:343-364` |
| PLG-M6 | Silent message censorship via `before_message_write` hook (no audit log) | `src/plugins/hooks.ts:540-599` |

---

### 1.4 Positive Security Findings (Notable Strengths)

The codebase demonstrates strong security engineering in several areas:

1. **Path traversal protection** — `fs-safe.ts` implements defense-in-depth with O_NOFOLLOW, symlink rejection, hardlink detection, realpath containment, and TOCTOU race mitigation
2. **SSRF protection** — Dual pre-DNS and post-DNS validation with IPv4-mapped IPv6 handling, DNS rebinding prevention, and legacy IP format blocking
3. **XSS protection** — DOMPurify with strict allowlists (22 tags, 8 attributes) and HTML escaping in the web UI
4. **ReDoS protection** — Dedicated safe-regex module with nested repetition detection before compiling user-supplied patterns
5. **Docker sandbox validation** — Comprehensive blocking of dangerous host paths, network modes, and security profiles
6. **Timing-safe secret comparison** — `safeEqualSecret()` correctly uses SHA-256 + `timingSafeEqual()`
7. **Session file permissions** — `0o600` with atomic writes using temp-file-plus-rename
8. **Webhook token handling** — URL query-parameter tokens explicitly rejected; Bearer header required
9. **Skill scanner static analysis** — Detects eval, child_process, crypto mining, data exfiltration, obfuscation (but needs to block, not just warn)
10. **Media server path validation** — Strict character allowlist, `.`/`..` rejection, `readFileWithinRoot()` enforcement

---

## Part 2: Public Vulnerability Research

### 2.1 Known CVEs (10+)

| CVE | CVSS | Description | Fixed In |
|-----|------|-------------|----------|
| CVE-2026-25253 | 8.8 | One-click RCE via cross-site WebSocket hijacking | v2026.1.29 |
| CVE-2026-25593 | High | Command injection via unauthenticated WebSocket `config.apply` | v2026.1.30 |
| CVE-2026-24763 | High | Command injection via Docker sandbox PATH bypass | v2026.1.30 |
| CVE-2026-25157 | High | OS command injection via unsanitized project root in macOS SSH handler | v2026.1.25 |
| CVE-2026-28458 | High | Browser Relay `/cdp` WebSocket endpoint lacks authentication | v2026.2.1 |
| CVE-2026-26319 | 7.5 | Missing Telnyx webhook authentication — fails open when key unconfigured | v2026.2.14 |
| CVE-2026-26322 | 7.6 | SSRF in Gateway tool — arbitrary user-supplied WebSocket targets | v2026.2.14 |
| CVE-2026-26329 | High | Path traversal in browser upload endpoint | v2026.2.14 |
| CVE-2026-25475 | 6.5 | Path traversal via `isValidMedia()` — agents can read arbitrary files | v2026.1.30 |

### 2.2 Named Vulnerability: ClawJacked (February 2026)

Malicious websites could brute-force the gateway password via localhost WebSocket connections:
- Browsers allow WebSocket connections to localhost without CORS restrictions
- OpenClaw trusted local traffic and exempted localhost from rate limiting
- Successful local pairing required no user confirmation
- Once paired, attackers gained admin-level control

**Fixed in v2026.2.26.**

### 2.3 Supply Chain Attack: ClawHavoc

The largest known supply chain poisoning of an AI agent marketplace:
- **1,184+ malicious skills** identified on ClawHub (up to 2,200 on GitHub per Trend Micro)
- **20% of the total ecosystem** compromised (Bitdefender)
- **Malware delivered:** Atomic macOS Stealer (AMOS), reverse shell backdoors, credential exfiltration
- **Technique:** Typosquatting + AI agent manipulation (the agent itself was tricked into installing malware)
- **Root cause:** No code review, signing, or automated blocking on ClawHub uploads

### 2.4 Internet Exposure

- **42,665** exposed instances across 52 countries (Bitsight)
- **93.4%** of verified instances exhibited authentication bypass
- **1.5 million API tokens**, 35,000 user emails, and private messages exposed via backend misconfiguration (Wiz)

### 2.5 Dependency Vulnerabilities to Monitor

| Dependency | CVE | CVSS | Status |
|-----------|-----|------|--------|
| SQLite (via better-sqlite3) | CVE-2025-6965 | 9.8 | **Verify bundled version >= 3.50.2** |
| Baileys (WhatsApp) | N/A | — | Typosquatting risk: `lotusbail`, `@dappaoffc/baileys-mod` found malicious |
| ws (WebSocket) | CVE-2024-37890 | 7.5 | **Patched** in ws 8.19.0 (OpenClaw's version) |
| sharp | CVE-2022-29256 | 7.8 | **Patched** in current version |
| Express 5 | CVE-2024-45590 | 7.5 | **Patched** in Express 5.2.1 (OpenClaw's version) |
| Playwright | CVE-2025-59288 | Critical | Monitor — Microsoft closed as N/A |
| Grammy | N/A | — | Typosquatting risk: `grammy-telegram-bot-api` (CVSS 9.3) is malicious |

### 2.6 Industry Assessment

**Microsoft Defender Security Research Team:** "OpenClaw should be treated as untrusted code execution with persistent credentials. It is not appropriate to run on a standard personal or enterprise workstation."

**Cisco:** "Personal AI agents like OpenClaw are a security nightmare."

**OWASP:** Prompt injection (#1 LLM vulnerability, 2025) is amplified in multi-channel bridges like OpenClaw.

---

## Part 3: Remediation Plan

### Phase 1: Critical — Block Immediately (Week 1)

| Priority | Finding | Action | Effort |
|----------|---------|--------|--------|
| P0 | CRIT-3: Scanner never blocks | Change `install.ts:284-306` from warn-only to blocking for `scanSummary.critical > 0` | Low |
| P0 | CRIT-1: Plugin shell exec | Remove `runCommandWithTimeout` from plugin runtime API or implement capability-gated allowlist | Medium |
| P0 | CRIT-2: Plugin config write | Remove `writeConfigFile` from plugin runtime API or restrict to scoped namespace | Medium |
| P0 | PLG-H5: Unauthenticated plugin routes | Require gateway auth for all plugin HTTP routes by default | Low |

### Phase 2: High Priority — Fix Before Next Release (Weeks 2-3)

| Priority | Finding | Action | Effort |
|----------|---------|--------|--------|
| P1 | NET-H1,H2,H3: DoS protection | Add WS connection limits (per-IP + global), HTTP rate limiting, WS message rate limiting | Medium |
| P1 | NET-H4: CSP connect-src | Change `connect-src` from `'self' ws: wss:` to `'self'` in `control-ui-csp.ts` | Low |
| P1 | PII-H1,H2,H3,H4,H9: Phone number logging | Apply `redactIdentifier()` to all `msg.from` / JID / E.164 references in WhatsApp and Signal log output | Low |
| P1 | PII-H6: Message content in logs | Add `logging.includeMessageContent` config flag (default: false); gate all message body logging behind it | Low |
| P1 | PLG-H3: Plugin prompt injection | Default `allowPromptInjection` to `false`; require explicit opt-in | Low |
| P1 | PLG-M1: Auto-enable non-bundled | Default non-bundled plugins to disabled when no allowlist configured | Low |
| P1 | AUTH-M1: Auth "none" + non-loopback | Add startup guard refusing `auth.mode: "none"` with non-loopback bind unless `--allow-unauthenticated` | Low |
| P1 | AUTH-M2: Session key injection | Validate `x-openclaw-session-key` is scoped to authenticated connection identity | Medium |
| P1 | PLG-M5: npm postinstall scripts | Add `--ignore-scripts` to plugin npm install; provide separate script approval mechanism | Low |

### Phase 3: Medium Priority — Next Release Cycle (Weeks 4-6)

| Priority | Finding | Action | Effort |
|----------|---------|--------|--------|
| P2 | AUTH-H2: Plaintext credentials | Integrate OS keychain for credential storage (macOS Keychain, Linux libsecret) | High |
| P2 | PII-H5: Unencrypted sessions | Implement optional encryption-at-rest for session JSONL files | High |
| P2 | PLG-H1: No process isolation | Investigate worker thread or child process isolation for non-bundled plugins | High |
| P2 | PLG-H2: No plugin integrity | Add cryptographic signature/checksum verification at install and load time | High |
| P2 | PLG-H4: Full channel access | Implement per-plugin capability declarations and enforcement | High |
| P2 | PLG-M3: Full config read | Scope plugin config access to plugin's own namespace | Medium |
| P2 | NET-M2: No HTTP timeouts | Set `requestTimeout`, `headersTimeout`, `keepAliveTimeout` on HTTP servers | Low |
| P2 | NET-M3: No WS ping/pong | Implement ping/pong keepalive for connection liveness detection | Low |
| P2 | NET-M6: Missing security headers | Add X-Frame-Options and CSP to non-Control-UI responses | Low |
| P2 | NET-M7: RSA 2048 cert | Upgrade auto-generated certs to RSA 3072 or ECDSA P-256; reduce validity to 1 year | Low |
| P2 | PII-M1: FS paths in snapshot | Remove `configPath`/`stateDir` from `buildGatewaySnapshot()` or restrict to admin | Low |
| P2 | PII-M2: Phone allowlists in snapshots | Hash or omit phone numbers from `allowFrom` arrays in snapshot output | Low |
| P2 | PII-M3: Stack trace exposure | Truncate/redact file paths in stack traces for external callers | Low |
| P2 | PII-M8: PII retention | Implement automatic expiry or hashing of phone numbers in session store entries | Medium |
| P2 | INJ-M3: Template no-escaping | Implement context-aware output escaping in `applyTemplate` | Medium |
| P2 | INJ-M4: Env logging default | Invert default: redact all env values by default; require `redact: false` to opt out | Low |
| P2 | PLG-M4: Skill override | Add integrity verification for bundled skills; warn on workspace overrides | Medium |
| P2 | PLG-M6: Silent message censorship | Add audit log entry when `before_message_write` hook blocks or modifies a message | Low |

### Phase 4: Architectural — Long-term Hardening

| Priority | Finding | Action | Effort |
|----------|---------|--------|--------|
| P3 | PLG-H1: Process isolation | Move plugin execution to isolated worker threads with message-passing API | Very High |
| P3 | Webhook fail-open pattern | Audit ALL channel adapters for Telnyx/Twilio-style "fail open when key unconfigured" | Medium |
| P3 | Cross-session data leakage | Implement session key integrity verification in routing layer | Medium |
| P3 | Prompt injection defense | Integrate prompt injection detection at gateway layer (OpenGuardrails or custom) | High |
| P3 | mDNS information disclosure | Make mDNS broadcasting opt-in rather than default | Low |
| P3 | Dependency monitoring | Automated CVE scanning for transitive dependencies (SQLite, Baileys, Grammy) | Medium |
| P3 | Plugin marketplace security | Require code signing + automated static analysis for ClawHub submissions | High |

---

## Part 4: Verification Checklist

Before marking remediation complete, verify:

- [ ] `pnpm build` passes without `[INEFFECTIVE_DYNAMIC_IMPORT]` warnings
- [ ] `pnpm check` passes (format + types + lint + custom rules)
- [ ] `pnpm test` passes
- [ ] New/changed code has colocated `*.test.ts` files
- [ ] Coverage meets 70% threshold
- [ ] No secrets, real phone numbers, or personal hostnames in code/docs
- [ ] All CRITICAL findings have corresponding regression tests
- [ ] All HIGH PII findings verified with grep for remaining plaintext identifiers
- [ ] Rate limiting tested under load (WS connections, HTTP requests, WS messages)
- [ ] Plugin isolation verified with test malicious plugin

---

## Appendix A: Files Examined

### Authentication & Secrets
- `src/gateway/auth.ts` — Gateway authentication modes
- `src/gateway/credentials.ts` — Credential management
- `src/gateway/server/http-auth.ts` — HTTP auth verification
- `src/gateway/server/ws-connection.ts` — WebSocket connection lifecycle
- `src/gateway/server/ws-connection/connect-policy.ts` — Control UI auth policy
- `src/gateway/server/ws-connection/message-handler.ts` — WS message processing
- `src/gateway/auth-rate-limit.ts` — Auth rate limiting
- `src/gateway/http-utils.ts` — Session key header handling
- `src/gateway/canvas-capability.ts` — Canvas token management
- `src/agents/auth-profiles/store.ts` — Auth profile storage
- `src/agents/auth-profiles/types.ts` — Auth profile types
- `src/agents/api-key-rotation.ts` — API key rotation
- `src/security/secret-equal.ts` — Timing-safe comparison
- `src/infra/json-file.ts` — JSON file I/O with permissions

### Input Validation & Injection
- `src/link-understanding/runner.ts` — Link understanding CLI execution
- `src/link-understanding/detect.ts` — SSRF filter for links
- `src/auto-reply/templating.ts` — Template interpolation engine
- `src/browser/pw-tools-core.interactions.ts` — Browser eval/Function
- `src/memory/manager.ts` — SQLite memory manager
- `src/memory/manager-sync-ops.ts` — SQLite sync operations
- `src/memory/memory-schema.ts` — Memory schema
- `src/media/mime.ts` — MIME type detection
- `src/infra/env.ts` — Environment variable logging
- `src/security/safe-regex.ts` — ReDoS protection
- `ui/src/ui/markdown.ts` — Web UI markdown/XSS
- `ui/src/ui/chat/grouped-render.ts` — Chat rendering

### Network & API
- `src/gateway/server-http.ts` — Main HTTP server
- `src/gateway/server-runtime-state.ts` — WebSocket server state
- `src/gateway/server-constants.ts` — Payload/timeout constants
- `src/gateway/control-ui-csp.ts` — Content Security Policy
- `src/gateway/http-common.ts` — Default security headers
- `src/gateway/control-ui.ts` — Control UI handler
- `src/gateway/client.ts` — Gateway client TLS
- `src/gateway/security-path.ts` — Path canonicalization
- `src/gateway/control-plane-rate-limit.ts` — Control plane rate limit
- `src/gateway/server/plugins-http.ts` — Plugin HTTP routes
- `src/gateway/server/http-listen.ts` — HTTP listen with retry
- `src/infra/tls/gateway.ts` — TLS configuration
- `src/infra/net/ssrf.ts` — SSRF protection
- `src/infra/net/fetch-guard.ts` — Guarded fetch
- `src/browser/extension-relay.ts` — Extension CORS

### Privacy & Data Exposure
- `src/web/auto-reply/deliver-reply.ts` — WhatsApp delivery logging
- `src/web/auto-reply/monitor/process-message.ts` — WhatsApp inbound processing
- `src/web/auto-reply/monitor/on-message.ts` — WhatsApp message handler
- `src/web/auth-store.ts` — WhatsApp auth storage
- `src/web/outbound.ts` — WhatsApp outbound (correct redaction pattern)
- `src/signal/monitor/event-handler.ts` — Signal event handling
- `src/config/sessions/store.ts` — Session store
- `src/config/sessions/transcript.ts` — Session transcripts
- `src/config/sessions/types.ts` — Session types
- `src/config/sessions/paths.ts` — Session path validation
- `src/gateway/server/health-state.ts` — Health state/snapshot
- `src/channels/account-snapshot-fields.ts` — Account snapshots
- `src/media/store.ts` — Media file storage
- `src/media/server.ts` — Media server
- `src/infra/errors.ts` — Error formatting
- `src/logging/redact.ts` — Log redaction
- `src/auto-reply/reply/session-fork.ts` — Session forking

### Plugin & Sandbox
- `src/plugins/runtime/runtime-system.ts` — Plugin system runtime
- `src/plugins/runtime/runtime-config.ts` — Plugin config access
- `src/plugins/runtime/runtime-channel.ts` — Plugin channel access
- `src/plugins/runtime/types-core.ts` — Plugin runtime types
- `src/plugins/loader.ts` — Plugin loading
- `src/plugins/discovery.ts` — Plugin discovery
- `src/plugins/enable.ts` — Plugin enable/deny
- `src/plugins/install.ts` — Plugin installation
- `src/plugins/config-state.ts` — Plugin config state
- `src/plugins/hooks.ts` — Plugin hook system
- `src/plugins/registry.ts` — Plugin registry
- `src/plugins/http-registry.ts` — Plugin HTTP route registry
- `src/plugins/http-path.ts` — Plugin HTTP path handling
- `src/agents/sandbox/validate-sandbox-security.ts` — Docker sandbox validation
- `src/agents/sandbox/docker.ts` — Docker execution
- `src/agents/sandbox/sanitize-env-vars.ts` — Env var sanitization
- `src/agents/tools/web-guarded-fetch.ts` — SSRF-guarded fetch
- `src/agents/skills/workspace.ts` — Skill loading
- `src/agents/bash-tools.exec-runtime.ts` — Bash tool execution
- `src/security/skill-scanner.ts` — Skill code scanner
- `src/infra/boundary-file-read.ts` — Boundary file reading

---

## Appendix B: Public Sources

- [OpenClaw Bug Enables One-Click RCE — The Hacker News](https://thehackernews.com/2026/02/openclaw-bug-enables-one-click-remote.html)
- [ClawJacked Flaw — The Hacker News](https://thehackernews.com/2026/02/clawjacked-flaw-lets-malicious-sites.html)
- [ClawJacked — SecurityAffairs](https://securityaffairs.com/188749/hacking/clawjacked-flaw-exposed-openclaw-users-to-data-theft.html)
- [OpenClaw Vulnerability — SecurityWeek](https://www.securityweek.com/openclaw-vulnerability-allowed-malicious-websites-to-hijack-ai-agents/)
- [Critical OpenClaw Vulnerability — Dark Reading](https://www.darkreading.com/application-security/critical-openclaw-vulnerability-ai-agent-risks)
- [Six New Vulnerabilities — Infosecurity Magazine](https://www.infosecurity-magazine.com/news/researchers-six-new-openclaw/)
- [Every CVE Explained — MintMCP](https://www.mintmcp.com/blog/openclaw-cve-explained)
- [ClawHavoc Supply Chain Attack — CyberPress](https://cyberpress.org/clawhavoc-poisons-openclaws-clawhub-with-1184-malicious-skills/)
- [341 Malicious Skills — The Hacker News](https://thehackernews.com/2026/02/researchers-find-341-malicious-clawhub.html)
- [Atomic macOS Stealer — Trend Micro](https://www.trendmicro.com/en_us/research/26/b/openclaw-skills-used-to-distribute-atomic-macos-stealer.html)
- [ClawHavoc — Koi Security](https://www.koi.ai/blog/clawhavoc-341-malicious-clawedbot-skills-found-by-the-bot-they-were-targeting)
- [Cisco: Security Nightmare](https://blogs.cisco.com/ai/personal-ai-agents-like-openclaw-are-a-security-nightmare)
- [Bitsight: Exposed Instances](https://www.bitsight.com/blog/openclaw-ai-security-risks-exposed-instances)
- [Snyk: Shell Access Risk](https://snyk.io/articles/clawdbot-ai-assistant/)
- [Penligent: Security Hardening](https://www.penligent.ai/hackinglabs/openclaw-2026-2-23-brings-security-hardening-and-new-ai-features-but-the-real-story-is-the-security-boundary/)
- [OpenClaw Security Docs](https://docs.openclaw.ai/gateway/security)

---

## Part 5: CVE Fix Cross-Verification Results

Verification of whether known CVE patches are actually present in the current codebase:

| CVE/Issue | Description | Fix Status | Evidence |
|-----------|-------------|------------|----------|
| CVE-2026-25253 | WS cross-site hijacking | **FIXED** | Origin validation in `src/gateway/origin-check.ts`, connect-policy.ts |
| CVE-2026-25593 | config.apply command injection | **FIXED** | Input validation in `src/gateway/server-methods/config.ts` |
| CVE-2026-24763 | Docker sandbox PATH bypass | **FIXED** | PATH sanitization in `src/agents/sandbox/sanitize-env-vars.ts`, docker.ts |
| CVE-2026-25157 | macOS SSH handler injection | **FIXED** | Input sanitization in `src/infra/ssh-tunnel.ts` |
| CVE-2026-28458 | /cdp endpoint unauthenticated | **FIXED** | Auth added in `src/browser/extension-relay-auth.ts` |
| CVE-2026-26319 | Telnyx webhook fail-open | **FIXED** | Verification enforced in `extensions/voice-call/src/webhook-security.ts` |
| CVE-2026-26322 | SSRF in Gateway tool | **FIXED** | URL validation in `src/agents/tools/gateway.ts` |
| CVE-2026-26329 | Browser upload path traversal | **FIXED** | Path validation in `src/browser/paths.ts` |
| CVE-2026-25475 | isValidMedia path traversal | **PARTIALLY FIXED** | `isLikelyLocalPath()` accepts `../` — security deferred to load layer |
| ClawJacked | Localhost brute-force | **PARTIALLY FIXED** | Rate limiting added but `exemptLoopback: true` by default |
| Webhook fail-open | All channel adapters | **FIXED** | Telegram, Slack, LINE, Zalo, Google Chat, Synology Chat all verified |

### Residual Risks from Partial Fixes

1. **CVE-2026-25475 (isValidMedia):** `src/media/parse.ts:28` — `isLikelyLocalPath()` returns true for `../` paths. Comment states security validation is deferred to the load layer. Defense-in-depth gap exists if any consumer bypasses the load layer.

2. **ClawJacked (localhost brute-force):** `src/gateway/auth-rate-limit.ts:99,131-133` — `exemptLoopback` defaults to `true`. The `UnauthorizedFloodGuard` provides per-connection protection, but a local attacker can open new connections to bypass it. The `browserRateLimiter` uses synthetic IPs for browser-origin connections which helps, but native local processes remain unthrottled.

### New Findings from Cross-Verification

| ID | Severity | Finding | File |
|----|----------|---------|------|
| XVER-H1 | HIGH | `new Function()` + `eval()` in browser tools — host-side parse of LLM-generated code | `src/browser/pw-tools-core.interactions.ts:302,333` |
| XVER-M1 | MEDIUM | `skipSignatureVerification` config flag disables all webhook verification for voice-call providers with no production guard | `extensions/voice-call/src/config.ts:330` |
| XVER-M2 | MEDIUM | Auth rate limiter exempts loopback — unlimited brute-force from localhost | `src/gateway/auth-rate-limit.ts:99,131-133` |
| XVER-M3 | MEDIUM | `isValidMedia()` accepts `../` traversal sequences without early rejection | `src/media/parse.ts:28` |
| XVER-M4 | MEDIUM | Raw `fs.writeFileSync()` in session fork bypasses SessionManager permissions | `src/auto-reply/reply/session-fork.ts:58` |
| XVER-M5 | MEDIUM | MIME detection falls back to declared Content-Type when sniffing fails | `src/media/mime.ts:135-137` |

---

## Part 6: Deep-Dive — Additional Public Vulnerabilities

### 6.1 Additional CVEs (Beyond Initial Research)

| CVE | CVSS | Description | Fixed In |
|-----|------|-------------|----------|
| CVE-2026-28363 | **9.9** | RCE via safeBins allowlist bypass using GNU option abbreviation | v2026.3.1 |
| CVE-2026-28484 | High | Sandbox escape via command injection | v2026.3.1 |
| CVE-2026-28479 | High | Auth bypass in gateway | v2026.3.1 |
| CVE-2026-29609 | High | Privilege escalation | v2026.3.1 |
| CVE-2026-28453 | High | Path traversal | v2026.3.1 |
| CVE-2026-28465 | High | Information disclosure | v2026.3.1 |
| CVE-2026-29610 | High | Container escape | v2026.3.1 |
| CVE-2026-28485 | High | SSRF bypass | v2026.3.1 |
| CVE-2026-28466 | Medium | DoS | v2026.3.1 |
| CVE-2026-26323 | Medium | Information disclosure | v2026.2.14 |
| CVE-2026-26327 | Medium | Auth bypass | v2026.2.14 |
| CVE-2026-27009 | Medium | Privilege escalation | v2026.2.14 |
| CVE-2026-27001 | Medium | Information disclosure | v2026.2.14 |
| CVE-2026-28478 | Medium | DoS | v2026.3.1 |
| CVE-2026-28462 | Medium | Auth bypass | v2026.3.1 |
| CVE-2026-28468 | Low | Information disclosure | v2026.3.1 |

### 6.2 Additional GitHub Security Advisories (48+)

#### Critical / RCE

| GHSA | CVSS | Description |
|------|------|-------------|
| GHSA-2fgq-7j6h-9rm4 | **9.8** | RCE via SHELLOPTS/PS4/BASH_ENV environment variable injection |
| GHSA-fqcm-97m6-w7rm | **9.8** | Arbitrary file read via attachment hydration path traversal (fail-open when no sandbox root) |
| GHSA-gv46-4xfq-jv58 | Critical | RCE via approval workflow bypass — `approved: true` flag injection in RPC |
| GHSA-943q-mwmv-hhvh | 8.8 | Privilege escalation and RCE in Gateway Agent Control Policy |
| GHSA-v6x2-2qvm-6gv8 | Critical | Token leak via insecure hashing fallback — gateway auth token used as crypto salt |
| GHSA-g8p2-7wf7-98mq | Critical | 1-click RCE via authentication token exfiltration from gatewayUrl |
| GHSA-jxrq-8fm4-9p58 | High | Zip Slip via symlinks — **confirmed exploited in the wild** |

#### Auth Bypass / Privilege Escalation

| GHSA | CVSS | Description |
|------|------|-------------|
| GHSA-2ch6-x3g4-7759 | High | Authorization bypass via identity confusion (Group JID treated as user) |
| GHSA-792q-qw95-f446 | Medium | Signal reaction events bypass access control policies |
| GHSA-rv2q-f2h5-6xmg | Medium | Node role device identity bypass |
| GHSA-r65x-2hqr-j5hf | Medium | Node reconnect metadata spoofing policy bypass |
| GHSA-fhvm-j76f-qmjv | Medium | Access-group auth bypass when channel type lookup fails |
| GHSA-vvjh-f6p9-5vcf | Medium | Canvas authentication bypass |
| GHSA-hwpq-rrpf-pgcq | High | Execution approval bypass in system.run |
| GHSA-jwf4-8wf4-jf2m | Low | BlueBubbles pairing/allowlist mismatch when allowFrom is empty |

#### DoS / Resource Exhaustion

| GHSA | CVSS | Description |
|------|------|-------------|
| GHSA-mfg5-7q5g-f37j | High | DoS via uncontrolled WebSocket resource allocation in voice-call |
| GHSA-rxxp-482v-7mrh | Medium | Memory exhaustion via unbounded media buffering (Discord, Telegram, Teams) |
| GHSA-gq83-8q7q-9hfx | Medium | Race condition in sandbox registry — orphaned containers |

#### Information Disclosure / Side-Channel

| GHSA | CVSS | Description |
|------|------|-------------|
| GHSA-jmm5-fvh5-gf4p | 5.9 | Timing side-channel in authentication (string comparison leak) |
| GHSA-6c9j-x93c-rw6j | Low | safeBins file existence oracle side-channel |
| GHSA-jjgj-cpp9-cvpv | Medium | Local file exfiltration via MCP Tool Result MEDIA: directive injection |

#### SSRF / Network

| GHSA | CVSS | Description |
|------|------|-------------|
| GHSA-4rqq-w8v4-7p47 | Medium | Incomplete IPv4 special-use SSRF blocking in web fetch guard |
| GHSA-gcj7-r3hg-m7w6 | Medium | Webhook replay via unsigned idempotency headers |

#### Container / Sandbox

| GHSA | CVSS | Description |
|------|------|-------------|
| GHSA-w7j5-j98m-w679 | High | Root execution in OpenClaw containers — violates least privilege |
| GHSA-7f4q-9rqh-x36p | 7.5 | macOS execution allowlist bypass via basename matching |

### 6.3 Government & Institutional Advisories

| Authority | Advisory |
|-----------|----------|
| **BSI / CERT-Bund (Germany)** | Official IT security warning classifying OpenClaw vulnerabilities affecting Linux and Unix systems |
| **CCB (Belgium)** | National cybersecurity center advisory |
| **Dutch DPA** | Privacy assessment regarding data handling |
| **University of Toronto** | Formal vulnerability notification to campus IT |
| **Meta** | Banned OpenClaw bots from WhatsApp platform |
| **South Korean enterprises** | Multiple corporate bans on OpenClaw usage |
| **SMU** | University security advisory |

### 6.4 Prompt Injection & Memory Poisoning Attacks

| Attack | Severity | Description | Fix Available? |
|--------|----------|-------------|---------------|
| **SOUL.md persistent backdoor** | Critical | Malicious instructions injected into `SOUL.md` files persist across sessions via agent memory. The poisoned system prompt survives session resets. | **NO — architectural limitation** |
| **MEMORY.md poisoning** | Critical | Similar to SOUL.md — malicious content injected into memory files persists indefinitely | **NO — architectural limitation** |
| **Cross-channel prompt injection** | High | Malicious messages on one channel hijack agent behavior across all channels via shared session state | Partial mitigations |
| **Indirect prompt injection via media** | High | Malicious instructions embedded in images, PDFs, or linked content processed by media understanding pipeline | Partial mitigations |
| **Tool result injection** | High | MCP tool results containing MEDIA: directives can exfiltrate local files | Fixed in recent versions |
| **Skill prompt injection** | High | Malicious skill definitions can replace system prompts via workspace precedence | Partial (bundled skill integrity) |
| **Config manipulation via prompt injection** | Critical | Agent tricked into writing malicious configuration changes | Plugin config write access should be removed |

### 6.5 Internet Exposure Update

| Source | Finding |
|--------|---------|
| **Shodan** | 312,000+ OpenClaw instances discoverable |
| **SecurityScorecard** | 40,214 internet-exposed control panels; 15,200 (35.4%) RCE-vulnerable |
| **Bitsight** | 42,665 instances across 52 countries; 93.4% auth bypass on verified instances |
| **Wiz** | 1.5M API tokens, 35K emails, private messages exposed via misconfiguration |
| **Compromised instances** | 30,000+ confirmed compromised |

### 6.6 Industry Security Assessments

| Organization | Assessment |
|-------------|-----------|
| **Microsoft Defender** | "Should be treated as untrusted code execution with persistent credentials. Not appropriate for standard workstations." |
| **Cisco** | "Personal AI agents like OpenClaw are a security nightmare" |
| **CrowdStrike** | Flagged as high-risk tool in enterprise environments |
| **Kaspersky** | Advisory on OpenClaw security risks |
| **Sophos** | Enterprise deployment guidance with security warnings |
| **Palo Alto Networks** | Threat assessment on AI agent security |
| **Snyk** | "Your OpenClaw AI has shell access" — detailed risk analysis |
| **Bitdefender** | ~900 malicious packages (20% of ecosystem) |
| **Trend Micro** | 2,200+ malicious skills on GitHub; Atomic macOS Stealer distribution |
| **Hudson Rock** | Credential theft campaign targeting OpenClaw users |

---

## Part 7: Updated Remediation Priority Matrix

### Immediate Actions (This Sprint)

| # | Finding | Action | Effort | Impact |
|---|---------|--------|--------|--------|
| 1 | CRIT-3: Scanner never blocks | Change to blocking for critical findings | Low | Blocks supply chain attacks |
| 2 | CRIT-1: Plugin shell exec | Remove from plugin API | Medium | Eliminates arbitrary code exec |
| 3 | CRIT-2: Plugin config write | Remove from plugin API | Medium | Prevents auth bypass via config |
| 4 | PLG-H5: Unauthenticated routes | Require gateway auth by default | Low | Closes backdoor endpoint vector |
| 5 | NET-H4: CSP connect-src | Change to `'self'` | Low | Prevents WS exfiltration |
| 6 | PII-H1-H4: Phone number logging | Apply `redactIdentifier()` everywhere | Low | Stops PII leakage in logs |

### Short-term (Next 2 Releases)

| # | Finding | Action | Effort |
|---|---------|--------|--------|
| 7 | NET-H1-H3: DoS protection | WS connection + message + HTTP rate limits | Medium |
| 8 | PLG-H3: Prompt injection hooks | Default `allowPromptInjection` to false | Low |
| 9 | PLG-M1: Auto-enable plugins | Default non-bundled to disabled | Low |
| 10 | AUTH-M1: Auth none + non-loopback | Add startup guard | Low |
| 11 | XVER-M1: skipSignatureVerification | Add production guard | Low |
| 12 | PII-H6: Message content in logs | Add dedicated config flag | Low |
| 13 | GHSA-w7j5-j98m-w679: Root in containers | Run as non-root user | Medium |

### Medium-term (Next Quarter)

| # | Finding | Action | Effort |
|---|---------|--------|--------|
| 14 | AUTH-H2: Plaintext credentials | OS keychain integration | High |
| 15 | PII-H5: Unencrypted sessions | Optional encryption-at-rest | High |
| 16 | PLG-H1: No process isolation | Worker thread isolation for plugins | Very High |
| 17 | PLG-H2: No plugin integrity | Signature/checksum verification | High |
| 18 | SOUL.md/MEMORY.md poisoning | Architectural review of persistent memory trust model | Very High |
| 19 | All remaining MEDIUM findings | Systematic remediation | Medium |

---

## Appendix C: Additional Public Sources (Deep-Dive)

- [CVE-2026-28363 safeBins Bypass — CVEReports](https://cvereports.com/reports/GHSA-4GC7-QCVF-38WG)
- [GHSA-2fgq-7j6h-9rm4 RCE via Env Injection — CVEReports](https://cvereports.com/reports/GHSA-2FGQ-7J6H-9RM4)
- [GHSA-fqcm-97m6-w7rm File Read — CVEReports](https://cvereports.com/reports/GHSA-FQCM-97M6-W7RM)
- [GHSA-gv46-4xfq-jv58 RCE Approval Bypass — CVEReports](https://cvereports.com/reports/GHSA-GV46-4XFQ-JV58)
- [GHSA-v6x2-2qvm-6gv8 Token Leak — CVEReports](https://cvereports.com/reports/GHSA-V6X2-2QVM-6GV8)
- [GHSA-943q-mwmv-hhvh Privilege Escalation — CVEReports](https://cvereports.com/reports/GHSA-943Q-MWMV-HHVH)
- [GHSA-jmm5-fvh5-gf4p Timing Side-Channel — CVEReports](https://cvereports.com/reports/GHSA-JMM5-FVH5-GF4P)
- [GHSA-mfg5-7q5g-f37j WS DoS — CVEReports](https://cvereports.com/reports/GHSA-MFG5-7Q5G-F37J)
- [GHSA-rxxp-482v-7mrh Media Buffering — CVEReports](https://cvereports.com/reports/GHSA-RXXP-482V-7MRH)
- [GHSA-w7j5-j98m-w679 Root Containers — CVEReports](https://cvereports.com/reports/GHSA-W7J5-J98M-W679)
- [GHSA-792q-qw95-f446 Signal Reaction Bypass — CVEReports](https://cvereports.com/reports/GHSA-792Q-QW95-F446)
- [GHSA-2ch6-x3g4-7759 Identity Confusion — CVEReports](https://cvereports.com/reports/GHSA-2CH6-X3G4-7759)
- [GHSA-gq83-8q7q-9hfx Race Condition — CVEReports](https://cvereports.com/reports/GHSA-GQ83-8Q7Q-9HFX)
- [GHSA-7f4q-9rqh-x36p macOS Allowlist Bypass — CVEReports](https://cvereports.com/reports/GHSA-7F4Q-9RQH-X36P)
- [GHSA-rv2q-f2h5-6xmg Node Identity Bypass — CVEReports](https://cvereports.com/reports/GHSA-RV2Q-F2H5-6XMG)
- [GHSA-6c9j-x93c-rw6j safeBins Oracle — DevTo](https://dev.to/cverports/ghsa-6c9j-x93c-rw6j-openclaw-side-channel-the-safebins-file-existence-oracle-4pap)
- [GHSA-r65x-2hqr-j5hf Node Spoofing — DevTo](https://dev.to/cverports/ghsa-r65x-2hqr-j5hf-openclaw-node-reconnect-metadata-spoofing-policy-bypass-5f9e)
- [GHSA-jjgj-cpp9-cvpv MEDIA: Injection — GitLab Advisory](https://advisories.gitlab.com/pkg/npm/openclaw/GHSA-jjgj-cpp9-cvpv/)
- [GHSA-fhvm-j76f-qmjv Access Group Bypass — GitLab Advisory](https://advisories.gitlab.com/pkg/npm/openclaw/GHSA-fhvm-j76f-qmjv/)
- [GHSA-vvjh-f6p9-5vcf Canvas Auth Bypass — GitLab Advisory](https://advisories.gitlab.com/pkg/npm/openclaw/GHSA-vvjh-f6p9-5vcf/)
- [GHSA-jwf4-8wf4-jf2m BlueBubbles Mismatch — GitLab Advisory](https://advisories.gitlab.com/pkg/npm/openclaw/GHSA-jwf4-8wf4-jf2m/)
- [GHSA-4rqq-w8v4-7p47 SSRF Blocking Gap — GitLab Advisory](https://advisories.gitlab.com/pkg/npm/openclaw/GHSA-4rqq-w8v4-7p47/)
- [GHSA-gcj7-r3hg-m7w6 Webhook Replay — CVEReports](https://cvereports.com/reports/GHSA-GCJ7-R3HG-M7W6)
- [GHSA-hwpq-rrpf-pgcq Approval Bypass — DevTo](https://dev.to/cverports/ghsa-hwpq-rrpf-pgcq-ghsa-hwpq-rrpf-pgcq-execution-approval-bypass-in-openclaw-systemrun-pml)
- [GHSA-g8p2-7wf7-98mq 1-Click RCE — GitHub Advisory](https://github.com/openclaw/openclaw/security/advisories/GHSA-g8p2-7wf7-98mq)
- [BSI/CERT-Bund Germany Advisory — news.de](https://www.news.de/technik/859382224/openclaw-gefaehrdet-bsi-meldung-zur-it-sicherheit-linux-und-unix-betroffen-mehrere-schwachstellen/1/)
- [OpenClaw Security Overview — GitHub](https://github.com/openclaw/openclaw/security)

---

## Part 8: Round 3 — Gap Analysis & Re-Examination

**Methodology:** 7 specialized agents re-examined previously explored areas with deeper focus and searched for gaps missed by both internal audits and external researchers. This round covers crypto & session security, extension-specific vulnerabilities, agent tool abuse chains, web research gaps, gateway auth re-examination, data flow & PII deep dive, and a broad web research sweep.

**Agents deployed:** 3 security-auditors + 4 general-purpose researchers (7 total)

### 8.1 Crypto & Session Security (R3-1)

#### HIGH

- **R3-CRYPTO-H1**: Gateway tokens have no expiration or revocation mechanism — Tokens are 192-bit entropy generated once at `src/gateway/startup-auth.ts:283` with `crypto.randomBytes(24)`. No TTL, no rotation, no revocation list. Compromise of a single token grants indefinite access.

- **R3-CRYPTO-H2**: Password stored with only SHA-256, no KDF — At `src/gateway/auth.ts:453-467`, the gateway password is hashed with `SHA-256` instead of a proper key derivation function (bcrypt, scrypt, Argon2). SHA-256 is fast and vulnerable to GPU-based brute force attacks.

- **R3-CRYPTO-H3**: Exec host HMAC verification not enforced — The `exec-host` bridge uses HMAC-SHA256 signatures but the verification path has gaps where unsigned payloads can be processed.

#### MEDIUM

- **R3-CRYPTO-M1**: `Math.random()` used for session slug generation at `src/agents/session-slug.ts:104,141` — Not cryptographically secure; predictable slugs could allow session enumeration.
- **R3-CRYPTO-M2**: Canvas capability tokens use 144-bit entropy with 10-minute TTL, embedded in URLs — URL-embedded tokens appear in browser history, proxy logs, and referrer headers.
- **R3-CRYPTO-M3**: No session transcript encryption at rest — JSONL session files at `~/.openclaw/sessions/` contain full conversation history in plaintext.
- **R3-CRYPTO-M4**: Device auth nonces only required for remote clients — Local clients skip nonce verification (`nonceRequired = !isLocalClient`), weakening replay protection.
- **R3-CRYPTO-M5**: SHA-1 still used in some internal cache key generation paths despite SHA-256 migration.

#### LOW

- **R3-CRYPTO-L1**: No certificate pinning for LLM provider API calls
- **R3-CRYPTO-L2**: Session file locks use PID-based nonces vulnerable to PID reuse in containers
- **R3-CRYPTO-L3**: WebSocket close codes may leak internal state information
- **R3-CRYPTO-L4**: No HSM/TPM support for credential storage
- **R3-CRYPTO-L5**: OAuth token refresh uses in-memory storage without encrypted swap protection
- **R3-CRYPTO-L6**: mDNS TXT records include operational details without authentication
- **R3-CRYPTO-L7**: HMAC-SHA256 nonce signature completion causes WebSocket closures (bug #25173)

---

### 8.2 Extension-Specific Vulnerabilities (R3-2)

Scope: Deep audit of msteams, voice-call, matrix, nostr, googlechat extensions.

#### HIGH

- **R3-EXT-H1**: Voice-call `skipSignatureVerification` allows complete webhook auth bypass with no production guard — Config option disables all webhook signature verification for Twilio, Telnyx, and Plivo. Only safeguard is a `console.warn`. No `NODE_ENV` check, no `--dev` flag requirement.
  - Files: `extensions/voice-call/src/webhook-security.ts:507-516,604-613,886-895`

- **R3-EXT-H2**: MS Teams error messages leak internal exception details to end users — Raw error messages sent via `context.sendActivity()` can expose internal paths, service URLs, database connection strings, or stack traces.
  - File: `extensions/msteams/src/monitor-handler/message-handler.ts:603-606`

- **R3-EXT-H3**: Nostr uses deprecated NIP-04 encryption with known cryptographic weaknesses — Reuses same ECDH shared secret without per-message key derivation, IVs transmitted in clear, AES-256-CBC without authenticated encryption (no HMAC), no forward secrecy.
  - File: `extensions/nostr/src/nostr-bus.ts:9,452,609`

#### MEDIUM

- **R3-EXT-M1**: MS Teams `isDangerousNameMatchingEnabled` allows allowlist bypass via display name spoofing — Display names in Teams can be freely set, enabling bypass of all DM, group, and command gating access controls.
  - File: `extensions/msteams/src/monitor-handler/message-handler.ts:194,208,260,280,287`

- **R3-EXT-M2**: Nostr private key stored in plaintext YAML config without secret infrastructure integration — No `normalizeResolvedSecretInputString()` wrapper, no integration with `src/secrets/`.
  - File: `extensions/nostr/src/types.ts:27,85`

- **R3-EXT-M3**: Matrix media downloads do not perform byte-level MIME detection — Falls back to sender-declared content type without `detectMime()` inspection (unlike MS Teams which does this correctly).
  - File: `extensions/matrix/src/matrix/monitor/media.ts:106-112`

- **R3-EXT-M4**: Voice-call WebSocket media stream upgrade lacks pre-authentication — WebSocket handshake completes before any identity verification; validation occurs only after first `start` frame.
  - File: `extensions/voice-call/src/webhook.ts:212-219`

- **R3-EXT-M5**: Google Chat webhook body parsed before authentication in add-on flow — Full request body read and JSON-parsed before token extraction and verification.
  - File: `extensions/googlechat/src/monitor-webhook.ts:153-175`

- **R3-EXT-M6**: Nostr relay trust model has no quorum requirement — Events processed from whichever relay delivers first, no corroboration from multiple relays.
  - File: `extensions/nostr/src/nostr-bus.ts:491-512`

- **R3-EXT-M7**: Nostr extension uses unsafe type cast to access `handleInboundMessage` — `as` cast suppresses type checking on arguments, potentially causing access control parameters to be ignored.
  - File: `extensions/nostr/src/channel.ts:218-220`

#### LOW (Positive Findings)

- Voice-call webhook security uses timing-safe comparison and replay detection
- Google Chat uses proper JWT verification with certificate pinning and audience validation
- MS Teams uses Bot Framework JWT authorization middleware
- MS Teams MIME detection uses byte-level content analysis (`detectMime()`)
- Nostr event signature verification correctly performed before message processing
- Matrix access control properly enforces DM and group policies
- No hardcoded secrets found in any audited extension

---

### 8.3 Agent Tool Abuse Chains (R3-3)

#### CRITICAL

- **R3-TOOL-C1**: Canvas `eval` tool permits arbitrary JS execution on devices without `ownerOnly` gate — At `src/agents/tools/canvas-tool.ts:146-158`, the canvas tool executes JavaScript on connected devices. Unlike other dangerous tools, it lacks the `ownerOnly: true` flag, meaning any agent (not just the owner) can execute arbitrary code on connected macOS/iOS/Android devices.

- **R3-TOOL-C2**: Elevated exec mode `defaultLevel: "full"` bypasses all security gates — At `src/agents/bash-tools.exec.ts:304-333`, the elevated execution mode sets `defaultLevel: "full"` which bypasses all approval workflows, safeBins restrictions, and sandbox deny lists.

- **R3-TOOL-C3**: SSRF via trusted internal endpoints — `src/agents/tools/web-guarded-fetch.ts:10-13` has `dangerouslyAllowPrivateNetwork: true` hardcoded, allowing agents to reach internal services (metadata endpoints, admin panels, localhost services).

#### HIGH

- **R3-TOOL-H1**: Cross-session prompt injection propagation via `sessions-send-tool` — At `src/agents/tools/sessions-send-tool.ts`, agents can send messages to other sessions, enabling prompt injection to propagate across conversation boundaries.

- **R3-TOOL-H2**: Browser tools use `eval()`/`new Function()` with agent-supplied code — At `src/browser/pw-tools-core.interactions.ts:302-339`, browser automation tools evaluate agent-generated JavaScript code, enabling arbitrary browser context manipulation.

- **R3-TOOL-H3**: Sub-agent exec approval bypass — Sub-agents created via `sessions_spawn` bypass exec approval mechanisms entirely, including file write operations (Issue #10993).

- **R3-TOOL-H4**: Silent model fallback escalates privileges — A typo in model ID silently falls back to the primary default, escalating from a restricted model to fully privileged with all denied tools becoming available (Issue #37813).

- **R3-TOOL-H5**: Sandbox mode and allow/deny lists ignored on certain surfaces — Snyk Labs confirmed that `sandbox.mode` restrictions are not enforced on all tool surfaces.

#### MEDIUM

- **R3-TOOL-M1**: SOUL.md/MEMORY.md persistent prompt poisoning — Agent memory files can be modified by tool calls, persisting malicious instructions across sessions.
- **R3-TOOL-M2**: MCP MEDIA: directive injection allows local file exfiltration (GHSA-jjgj-cpp9-cvpv, fixed v2026.2.21).
- **R3-TOOL-M3**: safeBins bypass via GNU long-option abbreviations (CVE-2026-28363, CVSS 9.9, fixed v2026.2.23).
- **R3-TOOL-M4**: Skill install path traversal (CVE-2026-27008, fixed v2026.2.15).
- **R3-TOOL-M5**: Docker sandbox configuration injection allowing container escape (CVE-2026-27002, fixed v2026.2.15).
- **R3-TOOL-M6**: Prompt injection via workspace path — CWD embedded in system prompt without sanitizing Unicode control characters (CVE-2026-27001, fixed v2026.2.15).

---

### 8.4 Web Research Gaps — Missed Findings (R3-4)

#### New CVEs Not Previously Catalogued

| CVE | CVSS | Description | Fixed In |
|-----|------|-------------|----------|
| CVE-2026-28446 | 9.8 | Pre-auth RCE in voice-call transcription pipeline | v2026.2.1 |
| CVE-2026-28484 | 9.8/9.3 | Option injection RCE via git pre-commit hook | v2026.2.15 |
| CVE-2026-28458 | 7.5 | Browser Relay `/cdp` WebSocket endpoint requires no auth | v2026.2.1 |
| CVE-2026-28463 | 8.4 | Shell expansion bypass in exec-approvals allowlist | v2026.2.14 |
| CVE-2026-28485 | 8.4/7.5 | Missing auth on `/agent/act` browser-control HTTP route | v2026.2.12 |
| CVE-2026-28465 | — | Voice-call webhook verification bypass via forwarded headers | v2026.2.3 |
| CVE-2026-28466 | — | Exec approval bypass via unsanitized `node.invoke` params | — |
| CVE-2026-28468 | — | Sandbox browser bridge auth bypass | v2026.2.14 |
| CVE-2026-29610 | 7.7 | Command hijacking via unsafe PATH handling | v2026.2.14 |
| CVE-2026-26320 | 6.5/7.1 | macOS deep link confirmation dialog truncation | v2026.2.14 |
| CVE-2026-27001 | — | Prompt injection via workspace path Unicode | v2026.2.15 |
| CVE-2026-27002 | — | Docker sandbox config injection / container escape | v2026.2.15 |
| CVE-2026-27008 | — | Skill install path traversal | v2026.2.15 |
| CVE-2026-28478 | — | DoS via unbounded webhook buffering | v2026.2.13 |
| CVE-2026-28479 | — | SHA-1 sandbox cache key collision | v2026.2.15 |
| CVE-2026-26316 | — | BlueBubbles iMessage loopback-only auth | v2026.2.13 |
| CVE-2026-26972 | — | Browser download path traversal | v2026.2.13 |
| CVE-2026-22708 | — | Indirect prompt injection via web browsing | — |

#### New GHSAs Not Previously Catalogued

| Advisory | Description |
|----------|-------------|
| GHSA-jjgj-cpp9-cvpv | MCP tool MEDIA: directive file exfiltration |
| GHSA-W7J5-J98M-W679 | Dockerfiles run containers as root by default |
| GHSA-76m6-pj3w-v7mf | SHA-1 to SHA-256 migration + Pi runner unbounded retry |
| GHSA-7q2j-c4q5-rm27 | macOS deep link truncation |
| GHSA-943q-mwmv-hhvh | Gateway `/tools/invoke` escalation + ACP auto-approval |
| GHSA-JJ82-76V6-933R | Execution allowlist bypass via wrapper injection |
| GHSA-9ppg-jx86-fqw7 | Cline CLI unauthorized npm publish installing OpenClaw |

---

### 8.5 Re-Examine Gateway Auth (R3-5)

#### HIGH

- **R3-GW-H1**: Self-declared operator scopes with shared-token authentication — At `src/gateway/server/ws-connection/message-handler.ts:601-606`, clients can self-declare admin scopes (`operator.admin`, `operator.write`) when authenticating with a shared secret token. No server-side scope verification or role-based assignment exists.

- **R3-GW-H2**: `authorizeGatewayMethod` returns null (allow) when client is null — At `src/gateway/server-methods.ts:38-41`, internal gateway method calls with no client context bypass all authorization checks.

#### MEDIUM

- **R3-GW-M1**: No WebSocket connection limit — At `src/gateway/server-runtime-state.ts:186-189`, there is no maximum connection count, enabling resource exhaustion.
- **R3-GW-M2**: mDNS broadcasts leak gateway operational details — At `src/infra/bonjour.ts:112-146`, the `_openclaw-gw._tcp` service broadcasts `cliPath`, `displayName`, and `lanHost`.
- **R3-GW-M3**: Unauthenticated config injection for local clients prior to v2026.1.20 (CVE-2026-25593).
- **R3-GW-M4**: Trusted-proxy control-UI pairing bypass — Node-role sessions could connect as `client.id=control-ui` without device identity checks (fixed v2026.2.25).
- **R3-GW-M5**: Reverse proxy auth bypass without `gateway.trustedProxies` — All connections appear as localhost (GHSA-xc7w, fixed v2026.2.12).
- **R3-GW-M6**: mDNS TXT record spoofing enables iOS/macOS client endpoint hijacking (CVE-2026-26327).

#### LOW

- No built-in RBAC — All authenticated callers treated as trusted operators (Feature request #8081)
- Webhook replay protection relies on per-provider LRU caches (finite window)
- No multi-tenancy session isolation in shared gateway deployments
- Gateway health endpoints expose version, uptime, and channel state without authentication
- WebSocket ping/pong timeout configuration allows resource holding
- No audit logging of administrative gateway method calls
- No IP-based allowlisting for gateway management endpoints
- No connection rate limiting per source IP

---

### 8.6 Data Flow & PII Deep Dive (R3-6)

#### HIGH

- **R3-PII-H1**: Unredacted WhatsApp phone numbers in auto-reply delivery logs — `deliver-reply.ts` logs `msg.from` (raw phone number) at 8+ call sites without using `redactIdentifier()`. The redaction function exists and is used elsewhere (outbound.ts, heartbeat-runner.ts) but not in the high-traffic auto-reply path.
  - File: `src/web/auto-reply/deliver-reply.ts:46,76,93,97-110,176,178-190,193,201`

- **R3-PII-H2**: Unredacted WhatsApp phone numbers in inbound message processing — `process-message.ts` logs raw phone numbers for DM messages through both structured and text log outputs.
  - File: `src/web/auto-reply/monitor/process-message.ts:223,235,426,440`

- **R3-PII-H3**: Unredacted WhatsApp phone numbers in access control logging — Pairing and blocking decisions log phone numbers and push names without redaction.
  - File: `src/web/inbound/access-control.ts:138,172,182,205`

- **R3-PII-H4**: `logs.tail` gateway method exposes all PII present in log files over WebSocket — Any client with `operator.read` scope can access raw log content containing unredacted phone numbers, user IDs, and message previews. No filtering or redaction applied.
  - File: `src/gateway/server-methods/logs.ts:148-179`

#### MEDIUM

- **R3-PII-M1**: LINE user IDs logged without any redaction across the entire LINE channel — Zero uses of `redactIdentifier` anywhere in LINE code. All LINE user IDs logged in plaintext at 10+ call sites.
  - Files: `src/line/send.ts:304,322,343,356,372,460`, `src/line/bot-handlers.ts:239,331,349,384`, `src/line/rich-menu.ts:223`, `src/line/monitor.ts:189`

- **R3-PII-M2**: LINE message body preview logged with sender identity — First characters of message body logged alongside LINE user ID.
  - File: `src/line/bot-message-context.ts:357`

- **R3-PII-M3**: Discord user IDs and usernames embedded in LLM context sent to third-party providers — Discord username and snowflake user ID forwarded to external AI services.
  - File: `src/discord/monitor/reply-context.ts:43`

- **R3-PII-M4**: Discord user PII returned in reaction summary data structures — Full user objects with `id`, `username`, `tag` without redaction, accessible to agent tools and plugins.
  - File: `src/discord/send.reactions.ts:111-118`

- **R3-PII-M5**: Gateway snapshot exposes filesystem paths over WebSocket — Health snapshot includes `configPath` and `stateDir` values exposing system username and directory structure.
  - File: `src/gateway/server/health-state.ts:35-36`

- **R3-PII-M6**: System presence broadcasts hostname and LAN IP to all WebSocket clients — `SystemPresence` includes `host` and `ip` fields broadcast to all connected clients.
  - File: `src/infra/system-presence.ts:7-8,52-53`

- **R3-PII-M7**: Session export path traversal — `/export-session` command accepts user-controlled output path via `path.resolve()` with no boundary validation. Could write conversation history to arbitrary filesystem locations.
  - File: `src/auto-reply/reply/commands-export-session.ts:173-178`

- **R3-PII-M8**: `chat.history` gateway method serves full conversation content — Any client with `operator.read` scope can access full conversation history of any session by providing its session key.
  - File: `src/gateway/server-methods/chat.ts:596-654`

- **R3-PII-M9**: Routing debug logging exposes raw peer IDs — When verbose logging is enabled, raw peer IDs (which may be phone numbers) logged without redaction.
  - File: `src/routing/resolve-route.ts:691,545`

#### ROOT CAUSE

The PII findings share a common root cause: **inconsistent application of the `redactIdentifier()` utility**. The codebase has the correct redaction infrastructure at `src/logging/redact-identifier.ts` (SHA-256 hashing), but it's only applied in some WhatsApp code paths. The LINE channel has no redaction at all. The `logs.tail` gateway method amplifies every logging PII issue into a network-accessible exposure.

---

### 8.7 Broad Web Research Sweep — Attack Campaigns, Government Actions, Compliance (R3-7)

#### Attack Campaigns and Incidents

| Campaign | Date | Impact |
|----------|------|--------|
| **Cline CLI 2.3.0 Supply Chain** | Feb 17, 2026 | Compromised npm token pushed malicious `cline@2.3.0` with `postinstall: npm install -g openclaw@latest`. ~4,000 downloads in 8 hours. |
| **Fake Installer/Infostealer** | Feb 2-10, 2026 | Bogus OpenClaw installers on GitHub distributed "Steal Packer" (Windows) and Atomic macOS Stealer. Ranked high in Bing AI searches. |
| **Infostealer Targeting Config** | Feb 2026 | Hudson Rock detected infostealers specifically exfiltrating OpenClaw config and gateway tokens — "stealing the souls of personal AI agents." |
| **Moltbook Database Breach** | Feb 2026 | Exposed database revealed 1.5M API tokens, 35K email addresses, and private agent-to-agent messages. |
| **30,000+ Compromised Instances** | Jan-Feb 2026 | Intercepting messages and deploying malicious payloads through Telegram. |

#### Government & Regulatory Actions

| Entity | Action |
|--------|--------|
| **China MIIT** | Formal warning about OpenClaw security risks |
| **South Korea** | Kakao restricted on work devices; Naver issued internal ban; Karrot completely blocked |
| **Meta** | Banned OpenClaw over security concerns |
| **Belgium CCB (Safeonweb)** | Critical vulnerability advisory requiring immediate patching |
| **Dutch DPA** | Warning against use with privacy-sensitive data; "does not meet basic security requirements" |
| **University of Toronto** | Campus-wide vulnerability notification |
| **CISA** | Published vulnerability summaries including OpenClaw CVEs |
| **BSI/CERT-Bund (Germany)** | Published security advisory |

#### MITRE ATLAS Investigation

MITRE conducted the first systematic investigation of OpenClaw in February 2026, discovering 7 new agentic AI attack techniques mapped to ATLAS tactics including direct/indirect LLM prompt injection, AI agent tool invocation, and agentic configuration modification.

#### Industry Vendor Assessments

| Vendor | Assessment |
|--------|-----------|
| **Microsoft** | "Treat OpenClaw as untrusted code execution with persistent credentials. Not appropriate for standard workstations." |
| **Cisco** | Classified as "security nightmare" — 9 vulnerabilities, 2 critical |
| **CrowdStrike** | "AI super agent" risk for security teams |
| **Kaspersky** | "Handing your data over to OpenClaw is at best unsafe and at worst utterly reckless" |
| **Sophos** | "A warning shot for enterprise AI security" |

#### Compliance Gaps

- No SOC 2, HIPAA, GDPR, ISO 27001, or FedRAMP certifications
- No data processing agreements or published security practices
- No SSO/SAML support
- Sessions accumulate indefinitely with no TTL (GDPR friction)
- 22% of monitored organizations have employees running OpenClaw without IT approval
- Enterprise readiness score: 1.2/5 (Onyx AI assessment)
- Insurance providers reassessing coverage for autonomous AI agents

#### Internet Exposure Scale

| Source | Count | Date |
|--------|-------|------|
| Censys | 21,639 | Jan 31 |
| Bitsight | 30,000+ | Jan 27–Feb 8 |
| SecurityScorecard | 135,000+ unique IPs, 15,200 vulnerable to RCE | Feb 2026 |
| HackMag/Penligent | 220,000+ (growing) | Mar 2026 |

Root cause: Docker setup defaults to `0.0.0.0:18789` (all interfaces). 93.4% of verified vulnerable instances exhibit authentication bypass. 98.6% run on cloud infrastructure.

#### Security Tooling Ecosystem

| Tool | Description |
|------|-------------|
| **SecureClaw** (Adversa AI) | First OWASP-aligned open-source security plugin with 55 audit checks |
| **OpenGuardrails / MoltGuard** | Real-time defense plugin with 10 built-in scanners |
| **Security Guard Extension** | Community-proposed agentic safety guardrails (Discussion #17275) |

#### Current Minimum Safe Version

**v2026.3.2** is the latest release. At minimum **v2026.2.25** required to address ClawJacked. Running `openclaw security audit --deep` is recommended after any update.

#### Patch Timeline Summary

| Version | Date | Key Fixes |
|---------|------|-----------|
| v2026.1.20 | Jan 20 | CVE-2026-25593 (config injection) |
| v2026.1.29 | Jan 31 | CVE-2026-25253 (one-click RCE) |
| v2026.2.1 | Feb 1 | CVE-2026-28446 (voice RCE, CVSS 9.8) |
| v2026.2.12 | Feb 12 | 40+ security fixes, SSRF deny policy |
| v2026.2.14 | Feb 14 | CVE-2026-28468, CVE-2026-29610, CVE-2026-28453 |
| v2026.2.15 | Feb 15 | Stored XSS, SHA-1 cache, git hook injection |
| v2026.2.21 | Feb 21 | MCP MEDIA: directive injection |
| v2026.2.23 | Feb 23 | CVE-2026-28363 (safeBins CVSS 9.9) |
| v2026.2.25 | Feb 25 | ClawJacked fix |
| v2026.3.1 | Mar ~2 | Gateway auth pairing hardening |
| v2026.3.2 | Mar ~5 | WS security loopback default, webhook hardening |

---

## Part 9: Consolidated Remediation Priority

### Tier 0 — Emergency (Immediate Action Required)

1. **Upgrade to v2026.3.2** — Addresses ClawJacked, safeBins CVSS 9.9, voice RCE, and 40+ security fixes
2. **Rotate all credentials** — Gateway tokens, API keys, OAuth tokens that were accessible pre-patch
3. **Plugin runtime isolation** — CRIT-1/2/3: Implement process-level sandbox for plugin execution
4. **Canvas tool `ownerOnly` gate** — R3-TOOL-C1: Add `ownerOnly: true` to canvas eval tool
5. **Remove `dangerouslyAllowPrivateNetwork: true`** — R3-TOOL-C3: Switch to explicit allowlist for internal endpoints
6. **Fix elevated exec bypass** — R3-TOOL-C2: Remove `defaultLevel: "full"` from elevated exec mode

### Tier 1 — High Priority (This Sprint)

7. **Apply `redactIdentifier()` everywhere** — R3-PII-H1/H2/H3: Apply to all WhatsApp phone number logging; R3-PII-M1: Apply to all LINE user ID logging
8. **Add log content filtering to `logs.tail`** — R3-PII-H4: Redact or filter PII before serving log content over WebSocket
9. **Gateway password hashing** — R3-CRYPTO-H2: Switch from SHA-256 to Argon2id
10. **Token expiration and revocation** — R3-CRYPTO-H1: Implement TTL and revocation list for gateway tokens
11. **Voice-call production guard** — R3-EXT-H1: Block `skipSignatureVerification` in production
12. **MS Teams error sanitization** — R3-EXT-H2: Replace raw error forwarding with generic message
13. **Cross-session injection prevention** — R3-TOOL-H1: Add origin tracking and content sanitization to `sessions-send-tool`
14. **Browser tools eval hardening** — R3-TOOL-H2: Sandbox browser eval context
15. **Self-declared scope removal** — R3-GW-H1: Server-side scope assignment with per-client permissions
16. **Null client authorization** — R3-GW-H2: Deny by default when client context is missing

### Tier 2 — Medium Priority (Next 2 Releases)

17. **Nostr NIP-17 migration** — R3-EXT-H3: Upgrade from NIP-04 to NIP-17 gift-wrapped DMs
18. **Nostr private key integration** — R3-EXT-M2: Use `normalizeResolvedSecretInputString()` for key storage
19. **Matrix MIME detection** — R3-EXT-M3: Add `detectMime()` to media download pipeline
20. **Voice-call WebSocket pre-auth** — R3-EXT-M4: Validate credentials during upgrade handshake
21. **Session export path containment** — R3-PII-M7: Validate output path stays within workspace
22. **WebSocket connection limits** — R3-GW-M1: Implement maximum connection count
23. **Disable mDNS by default** — R3-GW-M2: Opt-in rather than opt-out for service discovery
24. **Discord PII stripping** — R3-PII-M3: Remove user IDs from LLM context sent to providers
25. **Gateway snapshot path redaction** — R3-PII-M5: Remove filesystem paths from health data
26. **System presence hostname removal** — R3-PII-M6: Remove hostname/IP from broadcast presence
27. **Session transcript encryption** — R3-CRYPTO-M3: Encrypt JSONL session files at rest
28. **Math.random() replacement** — R3-CRYPTO-M1: Use `crypto.randomBytes()` for session slugs

### Tier 3 — Long-Term Hardening

29. **RBAC implementation** — Server-side role-based access control for gateway
30. **SOC 2 / GDPR compliance** — Data processing agreements, session TTL, right to erasure
31. **Multi-tenancy session isolation** — Prevent cross-user data leakage in shared deployments
32. **HSM/TPM credential storage** — Hardware-backed key management
33. **Certificate pinning for LLM providers** — Pin certificates for outbound API calls
34. **Sub-agent approval enforcement** — Close bypass via `sessions_spawn`
35. **Silent model fallback prevention** — Fail loudly on invalid model IDs instead of escalating privileges
36. **Install SecureClaw plugin** — Deploy OWASP-aligned security scanning
37. **Audit logging** — Log all administrative gateway method calls

---

## Part 10: Round 4 — Comprehensive Web Research Deep Dive

**Methodology:** Extended web research agent performed exhaustive searches across CVE databases, GitHub Security Advisories, government cybersecurity agencies, industry vendor assessments, and security research publications. This round identified 15 new CVEs and 48 new GHSAs not covered in previous rounds, plus additional government advisories, prompt injection research, and supply chain intelligence.

**Agent deployed:** 1 general-purpose web researcher (17th agent overall)

### 10.1 New CVEs (15 Previously Unreported)

| CVE | CVSS | Severity | Description | Fixed In |
|-----|------|----------|-------------|----------|
| CVE-2026-28363 | 9.9 | CRITICAL | `safeBins` allowlist bypass via GNU long-option abbreviation (e.g., `sort --compress-p=malicious`) | 2026.2.23 |
| CVE-2026-28484 | 9.8 | CRITICAL | Option injection RCE in pre-commit hook — dash-prefixed filenames interpreted as git options, staging `.env` secrets | 2026.2.15 |
| CVE-2026-28479 | 8.7 | HIGH | SHA-1 cache poisoning in sandbox identifiers — collision attacks enable sandbox state cross-contamination | 2026.2.15 |
| CVE-2026-29609 | 8.7 | HIGH | DoS via unbounded media fetch — entire HTTP response buffered before `maxBytes` enforcement | 2026.2.14 |
| CVE-2026-28453 | 8.3 | HIGH | TAR path traversal (Zip Slip) — `../../` sequences write files outside extraction directory | 2026.2.14 |
| CVE-2026-28465 | 8.2 | HIGH | Voice-call webhook verification bypass via crafted `X-Forwarded-*` headers | 2026.2.3 |
| CVE-2026-29610 | 7.8 | HIGH | Command hijacking via PATH manipulation — attacker binaries shadow allowlisted commands | 2026.2.14 |
| CVE-2026-28485 | HIGH | HIGH | Missing authentication on `/agent/act` browser-control route — unauthenticated browser automation | 2026.2.12 |
| CVE-2026-28466 | HIGH | HIGH | Exec approval gating bypass via `node.invoke` — injecting `approved: true` in RPC params | 2026.2.14 |
| CVE-2026-26323 | HIGH | HIGH | Command injection in `update-clawtributors.ts` via crafted git author email — supply chain risk | 2026.2.14 |
| CVE-2026-26327 | 6.5 | MEDIUM | mDNS/DNS-SD TLS pin override — spoofed mDNS records redirect clients and override certificate pins | 2026.2.14 |
| CVE-2026-27009 | HIGH | HIGH | Stored XSS in Control UI — agent identity values rendered in inline `<script>` without escaping | 2026.2.15 |
| CVE-2026-27001 | HIGH | HIGH | Workspace path injection into agent system prompt — Unicode control chars or raw instructions in directory names | 2026.2.15 |
| CVE-2026-28478 | HIGH | HIGH | DoS via unbounded webhook request body buffering — memory exhaustion before auth checks | 2026.2.13 |
| CVE-2026-28462 | HIGH | HIGH | Path traversal in browser control API output paths — write screenshots to arbitrary filesystem locations | 2026.2.13 |

### 10.2 New GitHub Security Advisories (48 Previously Unreported)

#### CRITICAL GHSAs

| GHSA | CVSS | Description |
|------|------|-------------|
| GHSA-2fgq-7j6h-9rm4 | 9.8 | RCE via `SHELLOPTS`/`PS4`/`BASH_ENV` environment injection into child shells |
| GHSA-fqcm-97m6-w7rm | 9.8 | Arbitrary file read via attachment hydration path traversal (fail-open when sandbox root unconfigured) |
| GHSA-gw85-xp4q-5gp9 | 9.8 | Authorization bypass in Synology Chat extension — empty `allowFrom` defaults to permit-all |
| GHSA-rv2q-f2h5-6xmg | CRITICAL | Node role device identity bypass — gateway token holders skip device pairing |
| GHSA-gv46-4xfq-jv58 | CRITICAL | RCE via approval workflow bypass — unsanitized approval state in RPC calls |
| GHSA-v6x2-2qvm-6gv8 | CRITICAL | Gateway token leak via insecure hashing fallback — token used as salt in API request metadata |

#### HIGH GHSAs

| GHSA | CVSS | Description |
|------|------|-------------|
| GHSA-943q-mwmv-hhvh | 8.8 | Privilege escalation via config manipulation + insufficient RPC authorization |
| GHSA-g8p2-7wf7-98mq | HIGH | 1-click RCE via `gatewayUrl` token exfiltration in Control UI |
| GHSA-3jx4-q2m7-r496 | HIGH | Hardlink alias bypass of workspace file boundaries |
| GHSA-vvjh-f6p9-5vcf | HIGH | Canvas authentication bypass (ZDI-CAN-29311) |
| GHSA-jjgj-cpp9-cvpv | HIGH | Local file exfiltration via MCP `MEDIA:` directive injection |
| GHSA-gcj7-r3hg-m7w6 | 8.2 | Webhook replay via unsigned idempotency headers in voice-call |
| GHSA-m8v2-6wwh-r4gc | HIGH | Sandbox escape via symlink TOCTOU race condition |
| GHSA-7f4q-9rqh-x36p | 7.5 | Execution allowlist bypass on macOS via basename-only matching |
| GHSA-hwpq-rrpf-pgcq | 7.2 | Execution approval bypass via UI spoofing (trailing whitespace) |
| GHSA-jxrq-8fm4-9p58 | HIGH | Archive extraction path traversal via symlinks — **exploited in the wild** (March 1, 2026) |
| GHSA-jj82-76v6-933r | HIGH | Execution allowlist bypass via wrapper injection (`/usr/bin/env`, `bash -c`) |
| GHSA-hjvp-qhm6-wrh2 | HIGH | `system.run` approval IDs not cryptographically bound to execution context |
| GHSA-w9cg-v44m-4qv8 | HIGH | `BASH_ENV`/`ENV` startup-file injection into spawned shells |
| GHSA-r65x-2hqr-j5hf | HIGH | Node reconnect metadata spoofing — bypass platform-specific security policies |
| GHSA-4gc7-qcvf-38wg | HIGH | `safeBins sort` bypass via GNU option abbreviation (formal GHSA for CVE-2026-28363) |
| GHSA-fg3m-vhrr-8gj6 | HIGH | Command injection in Lobster extension on Windows via `shell: true` |
| GHSA-mmpf-jwf4-h3qv | HIGH | Option injection in pre-commit hook (formal GHSA for CVE-2026-28484) |
| GHSA-p25h-9q54-ffvw | HIGH | TAR Zip Slip path traversal (formal GHSA for CVE-2026-28453) |

#### MODERATE GHSAs

| GHSA | CVSS | Description |
|------|------|-------------|
| GHSA-q6qf-4p5j-r25g | MOD | Incomplete IPv4 SSRF blocking — missing IANA special-use ranges |
| GHSA-wpg9-4g4v-f9rc | MOD | Discord voice transcript owner-flag omission — non-owners gain owner tool access |
| GHSA-r54r-wmmq-mh84 | MOD | ZIP extraction race condition — symlink rebind during extraction |
| GHSA-jmm5-fvh5-gf4p | 5.9 | Timing side-channel in auth — `===` instead of `timingSafeEqual`, residual length leak |
| GHSA-6c9j-x93c-rw6j | MOD | `safeBins` file-existence oracle — filesystem reconnaissance via approval behavior |
| GHSA-8cp7-rp8r-mg77 | MOD | SSRF guard bypass via IPv6 ISATAP embedded private IPv4 addresses |
| GHSA-f6h3-846h-2r8w | MOD | Elevated `allowFrom` identity signal mismatch — mutable metadata matching |
| GHSA-w2cg-vxx6-5xjg | MOD | DoS via large base64 media — decoded before size budget enforcement |
| GHSA-fhvm-j76f-qmjv | MOD | Telegram webhook authorization bypass when `webhookSecret` unconfigured |
| GHSA-9mph-4f7v-fmvh | MOD | Agent avatar symlink traversal — arbitrary file exfiltration via avatar rendering |
| GHSA-25pw-4h6w-qwvm | 5.4 | BlueBubbles group allowlist bypass via pairing-store fallback |
| GHSA-jwf4-8wf4-jf2m | MOD | BlueBubbles pairing/allowlist mismatch — empty `allowFrom` treated as permit-all |
| GHSA-4rqq-w8v4-7p47 | MOD | Incomplete IPv4 special-use SSRF blocking (duplicate of q6qf variant) |
| GHSA-rxxp-482v-7mrh | MOD | Memory exhaustion via unbounded media buffering in Discord/Telegram/Teams adapters |
| GHSA-mfg5-7q5g-f37j | MOD | DoS via uncontrolled WebSocket resource allocation in voice-call |
| GHSA-w7j5-j98m-w679 | MOD | Root execution in Docker containers — no capability dropping or seccomp |
| GHSA-792q-qw95-f446 | MOD | Signal reaction handling authorization bypass — reactions processed before access control |
| GHSA-2ch6-x3g4-7759 | MOD | Authorization bypass via identity confusion — group IDs treated as user IDs |
| GHSA-gq83-8q7q-9hfx | MOD | Race condition in sandbox registry — orphaned containers, state desynchronization |
| GHSA-rq6g-px6m-c248 | MOD | Google Chat webhook cross-account policy misrouting |
| GHSA-g27f-9qjv-22pm | MOD | Log poisoning via WebSocket headers — indirect prompt injection |
| GHSA-6g25-pc82-vfwp | MOD | PKCE verifier exposure in macOS OAuth — `code_verifier` in URL `state` parameter |

### 10.3 Government and Institutional Actions (7 Authorities)

| Authority | Date | Action |
|-----------|------|--------|
| **BSI / CERT-Bund (Germany)** | Feb 24 – Mar 2, 2026 | Three rounds of advisories covering 67 total security issues; immediate patching recommended |
| **CCB SafeOnWeb (Belgium)** | Feb 2026 | Critical vulnerability warning — "1-click RCE; patch immediately" |
| **Dutch DPA (Netherlands)** | Feb 2026 | Regulatory warning against use with privacy-sensitive data; calls for EU AI Act clarification on autonomous agents |
| **SMU (United States)** | Mar 4, 2026 | Institutional position paper — advises against use with research data and FERPA records |
| **University of Toronto** | Feb 2026 | Institutional vulnerability notification — advises review of all OpenClaw deployments |
| **South Korean Enterprises** | Feb 2026 | Kakao restricted, Naver banned, Karrot blocked OpenClaw on all work devices |
| **Meta** | Feb 2026 | Banned OpenClaw from all corporate devices |

### 10.4 Prompt Injection & Memory Poisoning Patterns (7 Distinct)

1. **SOUL.md persistent backdoor** — Write access to identity file enables long-term behavioral changes surviving restarts. **No fix exists — architectural limitation.**
2. **Fragmented time-shifted memory poisoning** — Benign fragments accumulate across interactions into functional payloads in MEMORY.md (Palo Alto Networks)
3. **Email-based data exfiltration** — Hidden CSS/HTML instructions in emails exfiltrate private keys via agent processing (Archestra.AI demo)
4. **Calendar/web content-embedded injection** — Hidden text in calendar invites and web pages inject instructions via `web_fetch`
5. **Log poisoning** — WebSocket `Origin`/`User-Agent` headers containing prompt payloads reach LLM analysis pipelines (GHSA-g27f-9qjv-22pm)
6. **Unicode directory injection** — RTL override, zero-width joiners in workspace directory names alter system prompt (CVE-2026-27001)
7. **Shared context cross-user leakage** — Multiple users sharing agent context can read each other's secrets and tool results

### 10.5 Supply Chain Intelligence Update

| Campaign | Scale | Description |
|----------|-------|-------------|
| **ClawHub Malicious Skills** | 1,467 (Snyk), ~900/4,500 (Bitdefender) | ToxicSkills across 12 publisher accounts with credential theft, backdoors, cryptominers |
| **Atomic macOS Stealer** | 39 skills (Trend Micro) | Functional-looking ClawHub skills distributing macOS infostealer |
| **Vidar Infostealer** | Active campaigns (Hudson Rock) | Specifically targeting `~/.openclaw/` for credentials, device keys, memory files |
| **Leaky Skills** | 283/3,984 (7.1%) (Snyk) | Legitimate skills exposing API keys, passwords, credit card numbers through LLM context |

### 10.6 Industry Vendor Assessments (10 Firms)

| Firm | Assessment |
|------|-----------|
| **Cisco Talos** | "Security nightmare" — 9 distinct findings, 2 critical |
| **Microsoft** | "Limited built-in security controls" — recommends isolated environments |
| **Sophos** | "Only safely run in a disposable sandbox" |
| **CrowdStrike** | Published advisory guide for security teams |
| **Kaspersky** | Classified as "unsafe for use" |
| **Snyk Labs** | Demonstrated dual sandbox bypass; documented 1,467 malicious skills |
| **Bitdefender** | ~900 malicious skills (~20% of ecosystem) |
| **Trend Micro** | 39 skills distributing Atomic macOS Stealer |
| **Palo Alto Networks** | Documented fragmented time-shifted memory poisoning |
| **Hudson Rock** | First to document Vidar infostealer targeting `~/.openclaw/` |

### 10.7 Sandbox & Execution Bypasses Catalog (9 Distinct)

1. **Dual sandbox bypass** — Both `assertSandboxPath` and `/tools/invoke` fail independently (Snyk Labs)
2. **Symlink TOCTOU escape** — Symlinks to non-existent files pass boundary checks (GHSA-m8v2-6wwh-r4gc)
3. **Wrapper injection** — `/usr/bin/env`, `bash -c` smuggle payloads past allowlists (GHSA-jj82-76v6-933r)
4. **Approval context bypass** — Approval IDs reusable with different commands (GHSA-hjvp-qhm6-wrh2)
5. **Root in containers** — No capability dropping or seccomp (GHSA-w7j5-j98m-w679)
6. **Hardlink alias bypass** — Hardlinks to files outside workspace pass validation (GHSA-3jx4-q2m7-r496)
7. **UI spoofing** — Trailing whitespace in binary names causes display/execution mismatch (GHSA-hwpq-rrpf-pgcq)
8. **Canvas auth bypass** — Complete authentication bypass in Canvas subsystem (GHSA-vvjh-f6p9-5vcf)
9. **macOS basename matching** — Allowlist checks basename only; any path with matching name passes (GHSA-7f4q-9rqh-x36p)

### 10.8 GDPR & Compliance Concerns

1. Dutch DPA regulatory warning against use with personal/confidential data
2. No right-to-erasure workflow — sessions accumulate indefinitely (GDPR Article 17 risk)
3. Uncontrolled data transfers to US-based LLM providers without DPA/SCC tooling
4. No multi-user access control — all local users can read all sessions and credentials
5. Gartner rated OpenClaw 1.2/5 for enterprise readiness
6. 22% of Token Security customers found unapproved employee OpenClaw usage (shadow AI)

### 10.9 Exposure Scale Summary

| Metric | Count |
|--------|-------|
| Shodan-discoverable instances (port 18789) | 312,000+ |
| Publicly exposed across 82 countries | 42,665 |
| Confirmed compromised instances | 30,000+ |
| Instances vulnerable to known RCE | 15,200 |
| CERT-Bund tracked issues | 67 |
| Malicious ClawHub skills (Snyk ToxicSkills) | 1,467 |
| Enterprise unapproved usage rate | 22% |

---

## Appendix D: Round 3 Agent Summary

| Agent | Focus | Findings |
|-------|-------|----------|
| R3-1 | Crypto & Session Security | 3 HIGH, 5 MED, 7 LOW |
| R3-2 | Extension Packages (msteams, voice-call, matrix, nostr, googlechat) | 3 HIGH, 7 MED, 10 LOW (7 positive) |
| R3-3 | Agent Tool Abuse Chains | 3 CRIT, 5 HIGH, 6 MED |
| R3-4 | Web Research Gaps — Missed CVEs/GHSAs | 18 new CVEs, 7 new GHSAs |
| R3-5 | Re-examine Gateway Auth | 2 HIGH, 6 MED, 8 LOW |
| R3-6 | Data Flow & PII Deep Dive | 4 HIGH, 9 MED, 6 LOW |
| R3-7 | Broad Web Research Sweep | 5 attack campaigns, 8 gov actions, vendor assessments, compliance gaps |

### Updated Aggregate Findings (All 4 Rounds)

| Severity | Round 1 | Round 2 | Round 3 | Round 4 | Total |
|----------|---------|---------|---------|---------|-------|
| **CRITICAL** | 3 | 12+ (public CVEs) | 3 new code + 18 new CVEs | 2 new CVEs + 6 GHSAs | 44+ |
| **HIGH** | 20 | 15+ (public) | 15 new code + 7 new GHSAs | 13 new CVEs + 18 GHSAs | 88+ |
| **MEDIUM** | 31 | 20+ (public) | 33 new code | 1 CVE + 22 GHSAs | 107+ |
| **LOW** | 45 | — | 31 (incl. 7 positive) | — | 76+ |

**Total unique advisories across all rounds: 58+ CVEs + 103+ GHSAs + 7 government/institutional advisories + 5 major attack campaigns + 10 industry vendor assessments**

**Total agents deployed across all 4 rounds: 17** (5 Round 1 security-auditors + 2 Round 2 web researchers + 1 CVE verifier + 1 backup + 7 Round 3 agents + 1 Round 4 deep web researcher)

---

## Appendix E: Round 4 Sources

- [SentinelOne — CVE-2026-28363](https://www.sentinelone.com/vulnerability-database/cve-2026-28363/)
- [SentinelOne — CVE-2026-28484](https://www.sentinelone.com/vulnerability-database/cve-2026-28484/)
- [RedPacket Security — CVE-2026-29609](https://www.redpacketsecurity.com/cve-alert-cve-2026-29609-openclaw-openclaw/)
- [RedPacket Security — CVE-2026-28453](https://www.redpacketsecurity.com/cve-alert-cve-2026-28453-openclaw-openclaw/)
- [RedPacket Security — CVE-2026-28465](https://www.redpacketsecurity.com/cve-alert-cve-2026-28465-openclaw-openclaw/)
- [RedPacket Security — CVE-2026-28485](https://www.redpacketsecurity.com/cve-alert-cve-2026-28485-openclaw-openclaw/)
- [RedPacket Security — CVE-2026-28466](https://www.redpacketsecurity.com/cve-alert-cve-2026-28466-openclaw-openclaw/)
- [RedPacket Security — CVE-2026-28478](https://www.redpacketsecurity.com/cve-alert-cve-2026-28478-openclaw-openclaw/)
- [RedPacket Security — CVE-2026-28462](https://www.redpacketsecurity.com/cve-alert-cve-2026-28462-openclaw-openclaw/)
- [MintMCP — OpenClaw CVEs Explained](https://www.mintmcp.com/blog/openclaw-cve-explained)
- [CVEReports — All GHSAs](https://cvereports.com/)
- [GitLab Advisory Database — OpenClaw](https://advisories.gitlab.com/pkg/npm/openclaw/)
- [GitHub — OpenClaw Security Advisories](https://github.com/openclaw/openclaw/security/advisories)
- [BSI/CERT-Bund — Feb/Mar 2026 Advisories](https://www.news.de/technik/859396486/)
- [CCB Belgium — Critical Warning](https://ccb.belgium.be/advisories/warning-critical-vulnerability-openclaw-allows-1-click-remote-code-execution-when)
- [Dutch DPA — Regulatory Warning](https://www.autoriteitpersoonsgegevens.nl/en/current/ap-warns-of-major-security-risks-with-ai-agents-like-openclaw)
- [Giskard — Prompt Injection Research](https://www.giskard.ai/knowledge/openclaw-security-vulnerabilities-include-data-leakage-and-prompt-injection-risks)
- [BlackFog — Data Exfiltration](https://www.blackfog.com/clawdbot-and-openclaw-data-exfiltration-goldmine/)
- [Hackread — Infostealer](https://hackread.com/infostealer-steal-openclaw-ai-identity-memory-files/)
- [Snyk — ToxicSkills](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/)
- [Snyk Labs — Sandbox Bypass](https://labs.snyk.io/resources/bypass-openclaw-security-sandbox/)
- [Cisco — Security Nightmare](https://blogs.cisco.com/ai/personal-ai-agents-like-openclaw-are-a-security-nightmare)
- [Microsoft — Running OpenClaw Safely](https://www.microsoft.com/en-us/security/blog/2026/02/19/running-openclaw-safely-identity-isolation-runtime-risk/)
- [Penligent — Hardening Guide](https://www.penligent.ai/hackinglabs/openclaw-sovereign-ai-security-manifest-a-comprehensive-post-mortem-and-architectural-hardening-guide-for-openclaw-ai-2026/)
- [Nebius — Security Hardening](https://nebius.com/blog/posts/openclaw-security)
- [Heise — 60+ Vulnerabilities Resolved](https://www.heise.de/en/news/Over-60-security-vulnerabilities-in-AI-assistant-OpenClaw-resolved-11179476.html)
- [SecurityWeek — SecureClaw](https://www.securityweek.com/openclaw-security-issues-continue-as-secureclaw-open-source-tool-debuts/)

---

*Report generated by Claude Code security review pipeline — 2026-03-07*
*17 agents deployed across 4 rounds: 5 security-auditors + 2 web researchers + 1 CVE verifier + 1 backup + 7 Round 3 gap analysis agents + 1 Round 4 deep web researcher*
