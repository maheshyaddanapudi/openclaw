# OpenClaw Security Audit Report — Consolidated (Rounds 1–8)

**Date**: 2026-03-07
**Auditor**: Claude Code (security-auditor, general-purpose, planner, Explore agents)
**Scope**: Full codebase — all channels (core + 42 extensions), gateway, agents, routing, sessions, config, providers, CLI commands, auto-reply pipeline, canvas host, skills, infrastructure, UI, protocol, dependencies
**Methodology**: 8 rounds of static code analysis, completeness verification, dependency CVE research, web research (18 agents total)

---

## Executive Summary

Eight rounds of security auditing identified **86 actionable findings** across the OpenClaw codebase, extensions, and dependency tree:

| Severity | Count | Status                                                       |
| -------- | ----- | ------------------------------------------------------------ |
| CRITICAL | 1     | Remediation planned (Phase 8)                                |
| HIGH     | 24    | Remediation planned (Phases 1-2, 9-10, 16-20, 28-35, 48-55)  |
| MEDIUM   | 40    | Remediation planned (Phases 3-7, 11-15, 21-27, 36-47, 56-65) |
| LOW      | 21    | Accepted risk / deferred                                     |

Additionally, **65+ positive security findings** confirmed mature practices across SSRF guards, path traversal protection, timing-safe comparisons, body size limits, ReDoS protection, sandbox validation, prototype pollution guards, token redaction, command authorization, and more.

All 30+ known OpenClaw product CVEs (through CVE-2026-28363, fix version 2026.2.23) are patched in the current version (2026.3.3).

---

## Finding Index

### Rounds 1-5: Core Channel PII, Gateway, Routing

| ID            | Severity | Category          | Summary                                                           | Phase        |
| ------------- | -------- | ----------------- | ----------------------------------------------------------------- | ------------ |
| SEC-HIGH-1    | HIGH     | PII Leakage       | WhatsApp phone numbers in deliver-reply.ts logs                   | 1            |
| SEC-HIGH-2    | HIGH     | PII Leakage       | WhatsApp phone numbers in process-message.ts + on-message.ts logs | 1            |
| SEC-HIGH-3    | HIGH     | PII Leakage       | WhatsApp phone numbers in access-control.ts logs                  | 1            |
| SEC-HIGH-4    | HIGH     | Info Disclosure   | Gateway logs.tail serves unredacted log content                   | 2            |
| SEC-MED-1     | MEDIUM   | PII Leakage       | LINE user IDs in log statements (all instances)                   | 3            |
| SEC-MED-2     | MEDIUM   | PII Leakage       | LINE sender identity in message context logs                      | 3            |
| SEC-MED-3     | MEDIUM   | PII Leakage       | Discord user ID sent to LLM in direct label                       | 4            |
| SEC-MED-4     | MEDIUM   | PII Leakage       | Discord user IDs in reaction summaries + verbose logs             | 4            |
| SEC-MED-5     | MEDIUM   | Info Disclosure   | Full filesystem paths in gateway snapshot                         | 5            |
| SEC-MED-6     | MEDIUM   | Info Disclosure   | Hostname/IP in SystemPresence (default-on)                        | 5            |
| SEC-MED-7     | MEDIUM   | Path Traversal    | Session export path not validated against workspace               | 6            |
| SEC-MED-8     | MEDIUM   | Info Disclosure   | chat.history returns full message content                         | 7 (accepted) |
| SEC-MED-9     | MEDIUM   | PII Leakage       | Raw peer IDs in routing debug logs                                | 7            |
| SEC-R5-CRIT-1 | CRITICAL | Auth Bypass       | `isSecureWebSocketUrl` allows `ws://` to any hostname             | 8            |
| SEC-R5-HIGH-1 | HIGH     | Session Isolation | `x-openclaw-session-key` header unsanitized                       | 9            |
| SEC-R5-HIGH-2 | HIGH     | Code Execution    | Browser tool console action + eval in interactions                | 10           |
| SEC-R5-MED-1  | MEDIUM   | Secret Exposure   | API key passed to onRetry callback                                | 11           |
| SEC-R5-MED-2  | MEDIUM   | Token Weakness    | Canvas capability token 144-bit entropy                           | 12           |
| SEC-R5-MED-3  | MEDIUM   | Input Validation  | Subagent session key depth unlimited                              | 13           |
| SEC-R5-MED-4  | MEDIUM   | Auth Config       | `mode: none` allows unauthenticated gateway access                | 14           |
| SEC-R5-MED-5  | MEDIUM   | Log Injection     | WS handshake failure logs unsanitized headers (5 locations)       | 15           |

### Round 6: SSRF, Plugins, Media, Config

| ID            | Severity | Category          | Summary                                                                  | Phase |
| ------------- | -------- | ----------------- | ------------------------------------------------------------------------ | ----- |
| SEC-R6-HIGH-1 | HIGH     | Auth Bypass       | Plugin HTTP routes bypass gateway auth with `auth: "none"`               | 16    |
| SEC-R6-HIGH-2 | HIGH     | SSRF              | TTS fetch calls bypass SSRF guard                                        | 17    |
| SEC-R6-HIGH-3 | HIGH     | SSRF              | PDF native provider fetch calls bypass SSRF guard                        | 17    |
| SEC-R6-HIGH-4 | HIGH     | SSRF              | `withTrustedWebToolsEndpoint` has `dangerouslyAllowPrivateNetwork: true` | 17    |
| SEC-R6-MED-1  | MEDIUM   | Input Validation  | Session topic ID no length validation                                    | 21    |
| SEC-R6-MED-2  | MEDIUM   | DoS               | Media `downloadToFile` no Content-Length pre-check                       | 22    |
| SEC-R6-MED-3  | MEDIUM   | TOCTOU            | Copilot token cache file permissions race                                | 23    |
| SEC-R6-MED-4  | MEDIUM   | Input Validation  | AJV `strict: false` in plugin schema validator                           | 24    |
| SEC-R6-MED-5  | MEDIUM   | Input Validation  | Discord user ID in `new RegExp()` without escaping                       | 25    |
| SEC-R6-MED-6  | MEDIUM   | Command Injection | `shell: true` fallback in qmd-manager Windows spawn                      | 26    |
| SEC-R6-MED-7  | MEDIUM   | Command Injection | Bash command from chat — command text unsanitized flow                   | 27    |

### Round 7: Remaining Channels, Extensions, Crypto, UI

| ID             | Severity | Category           | Summary                                                         | Phase |
| -------------- | -------- | ------------------ | --------------------------------------------------------------- | ----- |
| SEC-R7-HIGH-1  | HIGH     | PII Leakage        | Telegram chat/sender IDs + names in logs                        | 28    |
| SEC-R7-HIGH-2  | HIGH     | PII Leakage        | Signal phone numbers/UUIDs in logs                              | 29    |
| SEC-R7-HIGH-3  | HIGH     | PII Leakage        | iMessage phone/email handles in logs                            | 30    |
| SEC-R7-HIGH-4  | HIGH     | Client Security    | Device private key stored in localStorage unencrypted           | 31    |
| SEC-R7-HIGH-5  | HIGH     | Client Security    | Gateway auth token in localStorage plaintext                    | 31    |
| SEC-R7-HIGH-6  | HIGH     | CSRF               | `dangerouslyAllowHostHeaderOriginFallback` enables WS hijacking | 32    |
| SEC-R7-HIGH-7  | HIGH     | Timing Attack      | Hooks/gateway token comparison uses `!==` not `safeEqualSecret` | 33    |
| SEC-R7-HIGH-8  | HIGH     | Command Injection  | Tlon extension: LLM-controlled command args unvalidated         | 34    |
| SEC-R7-HIGH-9  | HIGH     | PII Leakage        | Voice-call extension: speech transcripts in logs                | 35    |
| SEC-R7-HIGH-10 | HIGH     | MIME Confusion     | Tlon extension: MIME from header not content bytes              | 35    |
| SEC-R7-MED-1   | MEDIUM   | PII Leakage        | Telegram dm-access structured logger exposes full PII           | 36    |
| SEC-R7-MED-2   | MEDIUM   | Integrity          | Session fork writes raw JSONL bypassing SessionManager          | 37    |
| SEC-R7-MED-3   | MEDIUM   | Command Injection  | Docker sandbox `shell: true` on Windows                         | 38    |
| SEC-R7-MED-4   | MEDIUM   | Info Disclosure    | iMessage RPC raw line in error log                              | 39    |
| SEC-R7-MED-5   | MEDIUM   | Input Validation   | Gateway system-event accepts unsanitized host/IP                | 40    |
| SEC-R7-MED-6   | MEDIUM   | TLS Bypass         | Synology Chat TLS verification disabled by default              | 41    |
| SEC-R7-MED-7   | MEDIUM   | PII Leakage        | Synology Chat user IDs + message previews in logs               | 42    |
| SEC-R7-MED-8   | MEDIUM   | CSS Injection      | Diffs extension `unsafeCSS` field                               | 43    |
| SEC-R7-MED-9   | MEDIUM   | SSRF               | Mattermost/Matrix/Nextcloud SSRF on configurable base URLs      | 44    |
| SEC-R7-MED-10  | MEDIUM   | SSRF               | Thread-ownership SSRF via configurable forwarderUrl             | 44    |
| SEC-R7-MED-11  | MEDIUM   | Credential Storage | Zalouser credentials stored without restrictive permissions     | 45    |
| SEC-R7-MED-12  | MEDIUM   | Auth Scope         | OpenAI-compat endpoints hardcode `senderIsOwner: true`          | 46    |
| SEC-R7-MED-13  | MEDIUM   | CSP                | CSP allows `ws:` and `https:` wildcard in img-src               | 46    |
| SEC-R7-MED-14  | MEDIUM   | Content Safety     | `allowUnsafeExternalContent` bypasses sanitization              | 46    |
| SEC-R7-MED-15  | MEDIUM   | TOCTOU             | Device identity directory created without explicit mode         | 47    |
| SEC-R7-MED-16  | MEDIUM   | Timing Attack      | Extension relay auth uses `===` not `safeEqualSecret`           | 47    |

### Round 8: CLI, Auto-Reply, Providers, Canvas, Skills, Cross-Cutting

| ID            | Severity | Category           | Summary                                                                            | Phase |
| ------------- | -------- | ------------------ | ---------------------------------------------------------------------------------- | ----- |
| SEC-R8-HIGH-1 | HIGH     | Command Injection  | SCP remote path injection via shell metacharacters in media paths                  | 48    |
| SEC-R8-HIGH-2 | HIGH     | Path Traversal     | `/export-session` writes HTML to arbitrary filesystem paths                        | 49    |
| SEC-R8-HIGH-3 | HIGH     | SSRF               | Provider URL SSRF via configurable Ollama/vLLM `baseUrl`                           | 50    |
| SEC-R8-HIGH-4 | HIGH     | Auth Bypass        | Copilot token `proxy-ep` URL derivation without hostname validation                | 51    |
| SEC-R8-HIGH-5 | HIGH     | XSS                | Canvas host serves user HTML without CSP headers + unauthenticated WS              | 52    |
| SEC-R8-HIGH-6 | HIGH     | ReDoS              | Mention pattern regex from config uses raw `new RegExp` without `compileSafeRegex` | 53    |
| SEC-R8-MED-1  | MEDIUM   | Info Disclosure    | Session file path disclosed in error messages to chat channel                      | 56    |
| SEC-R8-MED-2  | MEDIUM   | Auth Bypass        | `/config show` exposes full raw configuration to chat channel                      | 57    |
| SEC-R8-MED-3  | MEDIUM   | Input Validation   | `/debug set` runtime config overrides bypass schema validation                     | 58    |
| SEC-R8-MED-4  | MEDIUM   | PII Leakage        | Allowlist entries (phone numbers) in CLI status output                             | 59    |
| SEC-R8-MED-5  | MEDIUM   | Info Disclosure    | Qwen OAuth error response body in error message                                    | 60    |
| SEC-R8-MED-6  | MEDIUM   | Credential Storage | Copilot token cached as plaintext JSON on disk                                     | 60    |
| SEC-R8-MED-7  | MEDIUM   | Concurrency        | Skill env overrides mutate global `process.env` (cross-session leakage)            | 61    |
| SEC-R8-MED-8  | MEDIUM   | Supply Chain       | Skills loaded from untrusted workspace directories without verification            | 62    |
| SEC-R8-MED-9  | MEDIUM   | Info Disclosure    | Stack traces in session-memory handler logs                                        | 63    |
| SEC-R8-MED-10 | MEDIUM   | Secret Exposure    | `formatErrorWithStack` missing `redactSensitiveText`                               | 63    |
| SEC-R8-MED-11 | MEDIUM   | Input Validation   | YAML frontmatter parsing missing proto-pollution filter                            | 64    |
| SEC-R8-MED-12 | MEDIUM   | Robustness         | Unguarded `JSON.parse` on external data in 3+ production paths                     | 65    |
| SEC-R8-MED-13 | MEDIUM   | Info Disclosure    | Browser server returns raw `err.message` in HTTP responses                         | 65    |
| SEC-R8-MED-14 | MEDIUM   | Race Condition     | Session store read on non-atomic-rename filesystems                                | 65    |

### Dependency Findings

| ID             | Severity | Category     | Summary                                                         | Phase      |
| -------------- | -------- | ------------ | --------------------------------------------------------------- | ---------- |
| SEC-DEP-HIGH-1 | HIGH     | Supply Chain | pnpm 10.23.0 — CVE-2025-69264 + CVE-2025-69262 + CVE-2025-69263 | 18         |
| SEC-DEP-HIGH-2 | HIGH     | Runtime      | Node.js < 22.22.0 multiple CVEs                                 | 19         |
| SEC-DEP-MED-1  | MEDIUM   | Dev Tooling  | Vite dev server multiple CVEs (actively exploited)              | 20         |
| SEC-DEP-MED-2  | MEDIUM   | Transitive   | protobufjs transitive — verify >= 7.2.5 (CVE-2023-36665)        | — (verify) |
| SEC-DEP-MED-3  | MEDIUM   | Supply Chain | Verify chalk/strip-ansi not at compromised versions             | — (verify) |
| SEC-DEP-MED-4  | MEDIUM   | Transitive   | @discordjs/opus — verify patched (CVE-2024-21521)               | — (verify) |
| SEC-DEP-MED-5  | MEDIUM   | Transitive   | sqlite-vec may bundle SQLite < 3.50.2 (CVE-2025-6965)           | — (verify) |

### LOW / Accepted Risk

| ID           | Severity | Summary                                                   |
| ------------ | -------- | --------------------------------------------------------- |
| SEC-R5-LOW-1 | LOW      | Plugin packages not integrity-checked                     |
| SEC-R5-LOW-2 | LOW      | Rate limiter loopback exemption                           |
| SEC-R5-LOW-3 | LOW      | Firecrawl API key via env var                             |
| SEC-R5-LOW-4 | LOW      | Telegram healthz endpoint unauthenticated                 |
| SEC-R6-LOW-1 | LOW      | Temp media file cleanup best-effort                       |
| SEC-R6-LOW-2 | LOW      | Plugin auto-load when allowlist empty                     |
| SEC-R6-LOW-3 | LOW      | Plugin path safety checks skipped on Windows              |
| SEC-R6-LOW-4 | LOW      | Error body snippets in MediaFetchError                    |
| SEC-R6-LOW-5 | LOW      | `Math.random()` for session slug (non-security)           |
| SEC-R6-LOW-6 | LOW      | Media server no explicit auth (UUID+TTL mitigates)        |
| SEC-R7-LOW-1 | LOW      | Voice-call metadata logged extensively                    |
| SEC-R7-LOW-2 | LOW      | Extension pairing approval messages log user IDs          |
| SEC-R7-LOW-3 | LOW      | Hardcoded OAuth client IDs in MiniMax/Qwen extensions     |
| SEC-R7-LOW-4 | LOW      | Gemini CLI auth reads from third-party install            |
| SEC-R7-LOW-5 | LOW      | No rate limit on OpenAI-compat HTTP endpoints             |
| SEC-R7-LOW-6 | LOW      | Auth profile credentials plaintext JSON (0o600 mitigates) |
| SEC-R7-LOW-7 | LOW      | No memory zeroing for secrets (JS platform limitation)    |
| SEC-R8-LOW-1 | LOW      | Canvas host `innerHTML` in default page (non-user input)  |
| SEC-R8-LOW-2 | LOW      | Slack HTTP duplicate webhook path silently ignored        |
| SEC-R8-LOW-3 | LOW      | Session memory handler logs `~`-prefixed file paths       |
| SEC-R8-LOW-4 | LOW      | GitHub/Qwen OAuth client IDs hardcoded (public by design) |

---

## Detailed Findings — Rounds 1-7

_All findings from Rounds 1-7 remain unchanged. See previous sections for full details._

---

## Detailed Findings — Round 8 (New)

### SEC-R8-HIGH-1: SCP Remote Path Injection

**File**: `src/auto-reply/reply/stage-sandbox-media.ts:291-326`

The `scpFile` function constructs an SCP command where `remotePath` is interpolated directly into the argument. While `--` separator prevents option injection and `resolveAbsolutePath` + `isAllowedSourcePath` validate path structure, shell metacharacters (spaces, newlines, backticks) in the path are not escaped. An iMessage `MediaRemoteHost` with crafted attachment paths could manipulate the SCP target.

```typescript
"--",
`${safeRemoteHost}:${remotePath}`,  // remotePath not escaped for shell
localPath,
```

**Fix**: Apply strict path character validation (reject control characters, quotes, backticks, semicolons) or use `rsync --protect-args`.

### SEC-R8-HIGH-2: Export Session Path Traversal

**File**: `src/auto-reply/reply/commands-export-session.ts:173-188`

The `/export-session` command accepts a user-provided output path via chat, uses `path.resolve()`, creates directories recursively, and writes HTML content to any writable filesystem location. An authorized user can overwrite arbitrary files.

```typescript
const outputPath = args.outputPath
  ? path.resolve(
      args.outputPath.startsWith("~")
        ? args.outputPath.replace("~", process.env.HOME ?? "")
        : args.outputPath,
    )
  : path.join(params.workspaceDir, defaultFileName);
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, html, "utf-8");
```

**Fix**: Restrict output path to the agent workspace directory using `writeFileWithinRoot` or similar boundary enforcement.

### SEC-R8-HIGH-3: Provider URL SSRF

**Files**:

- `src/agents/models-config.providers.ts:246` — `queryOllamaContextWindow` fetches `${apiBase}/api/show`
- `src/agents/models-config.providers.ts:283` — `discoverOllamaModels` fetches `${apiBase}/api/tags`
- `src/agents/models-config.providers.ts:348` — `discoverVllmModels` fetches user-provided URL

Configurable provider endpoints (Ollama, vLLM) make outbound HTTP requests without private IP validation. If config is set to `http://169.254.169.254/latest/meta-data`, the gateway fetches from cloud metadata services during model discovery.

**Fix**: Validate provider URLs against private/link-local IP blocklist or use `fetchWithSsrFGuard`.

### SEC-R8-HIGH-4: Copilot Token URL Derivation

**File**: `src/providers/github-copilot-token.ts:57-78`

`deriveCopilotApiBaseUrlFromToken` extracts `proxy-ep` from the Copilot token and builds an HTTPS URL via hostname string replacement. No validation against known Copilot domains. A MITM-intercepted or crafted token with `proxy-ep=http://attacker.com` would redirect all API calls.

```typescript
const host = proxyEp.replace(/^https?:\/\//, "").replace(/^proxy\./i, "api.");
return `https://${host}`;
```

**Fix**: Validate derived hostname against `*.githubcopilot.com` or maintain an allowlist.

### SEC-R8-HIGH-5: Canvas Host Missing CSP

**File**: `src/canvas-host/server.ts:362-365`

The canvas host serves arbitrary HTML from `~/.openclaw/canvas/` with no Content-Security-Policy, X-Frame-Options, or sandboxing headers. The `injectCanvasLiveReload` function injects JavaScript with a WebSocket connection that has no authentication. A malicious skill could drop HTML into the canvas directory to execute XSS in the native app WebView context, potentially accessing `openclawCanvasA2UIAction` bridge.

**Fix**: Add CSP headers restricting script sources. Add authentication to WebSocket upgrade. Consider sandbox-mode iframes.

### SEC-R8-HIGH-6: Mention Pattern ReDoS

**File**: `src/auto-reply/reply/mentions.ts:70`

`buildMentionRegexes()` compiles regex from config `mentionPatterns` using raw `new RegExp(pattern, "i")` without `compileSafeRegex()`. A pattern like `(a+)+$` causes catastrophic backtracking on every inbound group message.

**Fix**: Replace `new RegExp(pattern, "i")` with `compileSafeRegex(pattern, "i")`.

### SEC-R8-MED-1 through MED-14

**SEC-R8-MED-1**: Session file path in error — `src/auto-reply/reply/commands-export-session.ts:126,142` — returns full filesystem path to chat channel in error messages

**SEC-R8-MED-2**: Config show exposure — `src/auto-reply/reply/commands-config.ts:102-106` — `/config show` returns full raw JSON to chat channel (may include sensitive paths, credential metadata in shared group chats)

**SEC-R8-MED-3**: Debug set bypass — `src/auto-reply/reply/commands-config.ts:246-264` — `/debug set` applies runtime config overrides without schema validation, potentially disabling security gates

**SEC-R8-MED-4**: Allowlist PII — `src/commands/channels/status.ts:145` — `allowFrom` entries (phone numbers/user IDs) displayed in CLI output, capturable by log collection

**SEC-R8-MED-5**: Qwen OAuth error — `src/providers/qwen-portal-oauth.ts:36` — full response body text in thrown error; may not be caught by `redactSensitiveText` patterns

**SEC-R8-MED-6**: Copilot token cache — `src/providers/github-copilot-token.ts:16` — API token cached as plaintext JSON at `~/.openclaw/state/credentials/github-copilot.token.json` (0o600 but unencrypted)

**SEC-R8-MED-7**: Skill env leakage — `src/agents/skills/env-overrides.ts:132-138` — skill env overrides mutate global `process.env`; concurrent agent sessions could see each other's skill-injected env vars before reverter runs

**SEC-R8-MED-8**: Workspace skills trust — `src/agents/skills/workspace.ts:354-367` — skills loaded from 6+ directories including workspace `.agents/skills/` without verification; malicious SKILL.md in cloned repos becomes part of LLM system prompt

**SEC-R8-MED-9**: Stack traces logged — `src/hooks/bundled/session-memory/handler.ts:325-326` — `err.message` and `err.stack` logged directly to structured log output

**SEC-R8-MED-10**: Error redaction gap — `src/commands/models/list.errors.ts:3-7` — `formatErrorWithStack` returns `err.stack` without applying `redactSensitiveText()`, unlike `formatErrorMessage`

**SEC-R8-MED-11**: Frontmatter proto-pollution — `src/markdown/frontmatter.ts:62` — `Object.entries()` iteration on parsed YAML does not filter `__proto__`/`constructor`/`prototype` keys (mitigated by `yaml` library's `schema: "core"` but missing defense-in-depth)

**SEC-R8-MED-12**: Unguarded JSON.parse — `src/infra/outbound/delivery-queue.ts:131`, `src/discord/api.ts:25`, `src/infra/outbound/tool-payload.ts:19` — `JSON.parse` on disk/API data without try/catch; corrupted file crashes process

**SEC-R8-MED-13**: Browser error disclosure — `src/browser/server-context.ts:207,210` — raw `err.message` from SsrFBlockedError returned in HTTP 400 responses

**SEC-R8-MED-14**: Session store race — `src/config/sessions/store.ts:223-249` — single read attempt on non-Windows with no retry; may observe partial data on non-atomic-rename filesystems (NFS)

---

## Dependency Status

### Verified Correct Overrides (No Action Needed)

| Package           | Pinned Version | CVEs Addressed                                                 |
| ----------------- | -------------- | -------------------------------------------------------------- |
| fast-xml-parser   | 5.3.8          | CVE-2026-25896, CVE-2026-25128, CVE-2026-26278, CVE-2026-27942 |
| form-data         | 2.5.4          | CVE-2025-7783                                                  |
| hono              | 4.12.5         | CVE-2025-62610, CVE-2025-58362, CVE-2026-24771, +3 more        |
| tar               | 7.5.10         | CVE-2026-23745, CVE-2026-24842                                 |
| tough-cookie      | 4.1.3          | CVE-2023-26136                                                 |
| qs                | 6.14.2         | CVE-2022-24999                                                 |
| playwright-core   | 1.58.2         | CVE-2025-59288                                                 |
| sqlite-vec        | 0.1.7-alpha.2  | CVE-2024-46488                                                 |
| undici            | ^7.22.0        | CVE-2025-22150                                                 |
| AJV               | ^8.18.0        | CVE-2025-69873                                                 |
| pdfjs-dist        | ^5.5.207       | CVE-2024-4367                                                  |
| vitest            | ^4.0.18        | CVE-2025-24964, CVE-2025-24963                                 |
| minimatch         | 10.2.4         | CVE-2026-26996, CVE-2026-27903, CVE-2026-27904                 |
| @hono/node-server | 1.19.10        | CVE-2026-29087                                                 |

### No Known CVEs (Round 8 verified)

Grammy ^1.41.0, @buape/carbon (pinned), @slack/bolt ^4.6.0, @slack/web-api ^7.14.1, signal-cli, Commander.js 14, Express 5.2.1, ws ^8.19.0 (CVE-2024-37890 fixed in 8.17.1), sharp ^0.34.5, Lit 3.3, tsdown, tsgo, Zod 4, TypeBox 0.34, @line/bot-sdk 10, dotenv 17, chokidar 5, croner 10, oxlint, gaxios, linkedom, yaml (eemeli), @clack/prompts, @grammyjs/runner, @homebridge/ciao, signal-utils, tslog, @napi-rs/canvas.

### OpenClaw Product CVEs — All Patched

30+ CVEs disclosed through March 2026 (CVE-2026-25253, CVE-2026-24763, ClawJacked, CVE-2026-28363 CVSS 9.9, and more) are all fixed through version 2026.2.23, included in current 2026.3.3. No action needed.

Notable recent disclosures (post-ClawJacked, March 2026 batch):

- CVE-2026-28363 (CVSS 9.9): `tools.exec.safeBins` sort bypass via GNU long-option abbreviations
- CVE-2026-28474 (CVSS 9.3): Nextcloud Talk allowlist bypass via actor.name spoofing
- CVE-2026-28446 (CVSS 9.2): Voice-call extension inbound allowlist bypass

### Supply Chain Alerts (Feb-March 2026)

| Alert                                                                                | Impact on OpenClaw                                                           |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| SANDWORM_MODE (Feb 24) — 19 typosquatting npm packages including OpenClaw lookalikes | Verify lockfile integrity; `pnpm.minimumReleaseAge` provides some protection |
| Cline CLI compromise (Feb 17) — installs OpenClaw covertly                           | Not a vulnerability in OpenClaw itself                                       |
| Malicious Baileys forks (lotusbail, @dappaoffc/baileys-mod)                          | Verify using legitimate `@whiskeysockets/baileys` in lockfile                |

---

## Positive Security Findings

The codebase demonstrates mature security practices confirmed across 8 audit rounds (65+ positive findings):

1. **SSRF protection** — `fetchWithSsrFGuard` with DNS pinning, private IP blocking, redirect credential stripping _(inconsistently applied — see provider URLs)_
2. **Path traversal** — `readFileWithinRoot`, `openBoundaryFileSync`, `readLocalFileSafely` with `O_NOFOLLOW`, inode verification, canvas `resolveFileWithinRoot`
3. **Timing-safe comparisons** — `safeEqualSecret` via `timingSafeEqual` on all critical auth paths _(2 non-critical paths missed)_
4. **HTTP body limits** — `readRequestBodyWithLimit` with configurable `maxBytes`, timeouts; Slack HTTP 1MB guard
5. **ReDoS protection** — `compileSafeRegex` with nested repetition detection, 2048-char input bound _(mention patterns missed)_
6. **Session security** — atomic writes, file locking, strict ID validation (`SAFE_SESSION_ID_RE`), in-process lock queues
7. **Command injection prevention** — `shouldSpawnWithShell` returns `false`, `execFile` preferred
8. **Plugin security** — ownership checks, boundary file opening, symlink escape prevention, realpath validation
9. **Sandbox validation** — blocks `/etc`, `/proc`, Docker socket, root mounts, validates seccomp/apparmor
10. **Sandbox env sanitization** — blocks API key patterns, base64 credentials, null bytes
11. **Skill scanner** — detects eval, shell exec, crypto-mining, obfuscation
12. **External content** — prompt injection detection, randomized markers, Unicode homoglyph folding
13. **UI sanitization** — DOMPurify with strict allowlists, no raw `unsafeHTML` with user data
14. **WS protocol validation** — AJV schemas on all frames, connect challenge-response nonce
15. **HTTP security headers** — `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, optional HSTS
16. **Extension security** — MSTeams `safeFetch`, BlueBubbles path traversal protection, Nostr atomic writes
17. **No hardcoded secrets** — only test fixtures with obvious synthetic values
18. **Gateway startup** — refuses to bind to network without auth configured
19. **Prototype pollution guards** — `isBlockedObjectKey` used consistently in config merge, runtime overrides, webhook mapping, account normalization
20. **Token redaction** — comprehensive `redactSensitiveText` covering sk-\_, ghp\__, xox-_, AIza\_, PEM blocks, auth headers
21. **Command authorization** — consistent `isAuthorizedSender` checks on all auto-reply commands; directive injection gated for unauthorized senders
22. **Env substitution safety** — env var names restricted to `^[A-Z_][A-Z0-9_]*$`
23. **Config include safety** — path traversal protection, symlink resolution, circular include detection, depth cap 10, size cap 2MB
24. **Slack file download** — validates hostname against Slack domains before sending bot token
25. **Skill frontmatter validation** — install specs (brew, npm, go, UV, download URLs) validated against strict patterns
26. **Auth rate limiting** — `AuthRateLimiter` on gateway HTTP endpoints
27. **Untrusted context labeling** — `appendUntrustedContext` wraps external metadata with injection-resistant framing

---

## Remediation Plan — 65 Phases

### Phases 1-47: Unchanged from Round 7 report

_With these amendments from Round 8:_

- **Phase 6 (SEC-MED-7)**: Export session path traversal now has a more severe instance (SEC-R8-HIGH-2) — elevated to HIGH, merged into Phase 49
- **Phase 17**: Provider SSRF now includes Ollama/vLLM discovery endpoints (SEC-R8-HIGH-3) — 6 source files total
- **Phase 25 (R6-MED-5)**: Discord RegExp without escaping confirmed again in Round 8 at additional location

### Phase 48: SCP Remote Path Sanitization (HIGH — SEC-R8-HIGH-1)

**Complexity**: Simple | **Files**: 1 source

**`src/auto-reply/reply/stage-sandbox-media.ts`** (lines 291-326): Add strict character validation on `remotePath` — reject control characters, backticks, semicolons, newlines, and unescaped quotes before passing to `spawn`.

**Commit**: `fix(agents): sanitize SCP remote path against shell metacharacters`

### Phase 49: Export Session Path Restriction (HIGH — SEC-R8-HIGH-2)

**Complexity**: Simple | **Files**: 1 source

**`src/auto-reply/reply/commands-export-session.ts`** (lines 173-188): Restrict output path to the agent workspace directory. Use `writeFileWithinRoot` or validate `outputPath` is inside `params.workspaceDir`. Remove `path.resolve` on arbitrary user input.

**Commit**: `fix(agents): restrict /export-session output to workspace directory`

### Phase 50: Provider URL SSRF Guards (HIGH — SEC-R8-HIGH-3)

**Complexity**: Moderate | **Files**: 1 source

**`src/agents/models-config.providers.ts`** (lines 246, 283, 348): Add private IP validation to Ollama and vLLM discovery fetches. Use `fetchWithSsrFGuard` or validate `baseUrl` against RFC 1918 / link-local ranges.

**Commit**: `fix(agents): add SSRF guards to provider URL discovery fetches`

### Phase 51: Copilot Token URL Validation (HIGH — SEC-R8-HIGH-4)

**Complexity**: Simple | **Files**: 1 source

**`src/providers/github-copilot-token.ts`** (lines 57-78): Validate derived hostname against `*.githubcopilot.com` or maintain a static allowlist of known Copilot API domains.

**Commit**: `fix(providers): validate Copilot API base URL against domain allowlist`

### Phase 52: Canvas Host Security Headers (HIGH — SEC-R8-HIGH-5)

**Complexity**: Moderate | **Files**: 1 source

**`src/canvas-host/server.ts`** (lines 362-365): Add `Content-Security-Policy` headers restricting script sources to `'self'`. Add `X-Frame-Options: SAMEORIGIN`. Add authentication to WebSocket upgrade path (validate `oc_cap` token).

**Commit**: `fix(canvas): add CSP headers and WebSocket authentication`

### Phase 53: Mention Pattern Safe Regex (HIGH — SEC-R8-HIGH-6)

**Complexity**: Trivial | **Files**: 1 source

**`src/auto-reply/reply/mentions.ts:70`**: Replace `new RegExp(pattern, "i")` with `compileSafeRegex(pattern, "i")` from `src/security/safe-regex.ts`.

**Commit**: `fix(agents): use compileSafeRegex for mention pattern compilation`

### Phases 54-55: Reserved for dependency actions

**Phase 54**: Verify sqlite-vec bundled SQLite version >= 3.50.2 (SEC-DEP-MED-5)
**Phase 55**: Run `pnpm audit` and verify Baileys package integrity against supply chain attacks

### Phase 56: Session Error Message Redaction (MEDIUM — SEC-R8-MED-1)

**File**: `src/auto-reply/reply/commands-export-session.ts:126,142` — Return generic error without filesystem path.

**Commit**: `fix(agents): remove filesystem paths from session error messages`

### Phase 57: Config Show Redaction (MEDIUM — SEC-R8-MED-2)

**File**: `src/auto-reply/reply/commands-config.ts:102-106` — Redact credential references, internal paths, and sensitive fields before displaying config. Restrict to DM-only or add explicit warning.

**Commit**: `fix(gateway): redact sensitive fields in /config show output`

### Phase 58: Debug Set Schema Validation (MEDIUM — SEC-R8-MED-3)

**File**: `src/auto-reply/reply/commands-config.ts:246-264` — Apply `validateConfigObjectWithPlugins` validation to debug overrides, or restrict overridable paths to a safe allowlist.

**Commit**: `fix(gateway): validate /debug set overrides against config schema`

### Phase 59: Allowlist PII Masking (MEDIUM — SEC-R8-MED-4)

**File**: `src/commands/channels/status.ts:145` — Mask allowFrom entries (e.g., `+1***...789`) in status output. Show full values only with `--verbose` flag.

**Commit**: `fix(channels): mask allowlist entries in status output`

### Phase 60: Provider Error + Cache Hardening (MEDIUM — SEC-R8-MED-5, R8-MED-6)

1. **`src/providers/qwen-portal-oauth.ts:36`**: Truncate response body; include only status code.
2. **`src/providers/github-copilot-token.ts`**: Document plaintext cache as accepted risk (0o600 mitigates) or add encryption.

**Commit**: `fix(providers): truncate OAuth error responses and document token cache`

### Phase 61: Skill Env Isolation (MEDIUM — SEC-R8-MED-7)

**File**: `src/agents/skills/env-overrides.ts:132-138` — Document concurrency limitation. Ensure all callers wrap reverter in `try/finally`. Consider passing env as `spawn` option instead of mutating global `process.env`.

**Commit**: `fix(agents): document and guard skill env override concurrency`

### Phase 62: Workspace Skills Trust (MEDIUM — SEC-R8-MED-8)

**File**: `src/agents/skills/workspace.ts:354-367` — Add warning log when loading skills from workspace directories. Consider first-run confirmation for non-bundled skills.

**Commit**: `fix(agents): warn when loading skills from untrusted workspace directories`

### Phase 63: Error Redaction Consistency (MEDIUM — SEC-R8-MED-9, R8-MED-10)

1. **`src/hooks/bundled/session-memory/handler.ts:325-326`**: Apply `redactSensitiveText` to stack traces in structured logs.
2. **`src/commands/models/list.errors.ts:3-7`**: Wrap `formatErrorWithStack` output with `redactSensitiveText()`.

**Commit**: `fix(infra): apply redactSensitiveText to all error formatting paths`

### Phase 64: Frontmatter Proto-Pollution Filter (MEDIUM — SEC-R8-MED-11)

**File**: `src/markdown/frontmatter.ts:62` — Add `isBlockedObjectKey(rawKey)` check before writing to result object.

**Commit**: `fix(infra): add prototype pollution guard to YAML frontmatter parsing`

### Phase 65: JSON.parse Safety + Browser Error (MEDIUM — SEC-R8-MED-12, R8-MED-13, R8-MED-14)

1. **`src/infra/outbound/delivery-queue.ts:131`**, **`src/discord/api.ts:25`**, **`src/infra/outbound/tool-payload.ts:19`**: Wrap `JSON.parse` in try/catch.
2. **`src/browser/server-context.ts:207,210`**: Return generic error messages in HTTP responses.
3. **`src/config/sessions/store.ts:223-249`**: Document POSIX atomicity requirement or add retry logic.

**Commit**: `fix(infra): guard JSON.parse and sanitize HTTP error responses`

---

## Implementation Priority

| Priority | Phases             | Severity | Category                                         |
| -------- | ------------------ | -------- | ------------------------------------------------ |
| P0       | 8                  | CRITICAL | WebSocket MitM                                   |
| P1       | 17+50, 16, 33      | HIGH     | SSRF consistency, plugin auth, timing attacks    |
| P1       | 1, 28, 29, 30      | HIGH     | PII in all core channels                         |
| P1       | 9, 31, 48, 49      | HIGH     | Session isolation, path traversal, SCP injection |
| P1       | 2, 10, 52          | HIGH     | Log API, browser tool, canvas CSP                |
| P1       | 18, 19             | HIGH     | pnpm + Node.js upgrades                          |
| P1       | 32, 34, 35, 51, 53 | HIGH     | CSRF, tlon injection, Copilot URL, ReDoS         |
| P2       | 15, 6, 13          | MEDIUM   | Log injection, path traversal, recursion         |
| P2       | 20, 23, 25, 26, 38 | MEDIUM   | Vite, TOCTOU, RegExp, shell injection            |
| P2       | 3, 4, 41, 42, 59   | MEDIUM   | Channel PII (LINE, Discord, Synology, allowlist) |
| P2       | 56-58, 61-62       | MEDIUM   | Error disclosure, config exposure, skills trust  |
| P3       | 5, 7, 11-14        | MEDIUM   | Info disclosure, config hardening                |
| P3       | 21-22, 24, 27      | MEDIUM   | Input validation, defense-in-depth               |
| P3       | 37, 40, 43-47      | MEDIUM   | Session fork, system events, extensions          |
| P3       | 60, 63-65          | MEDIUM   | Provider errors, error redaction, JSON.parse     |

---

## Accepted Risks

| ID              | Finding                                                                                    | Reason                            |
| --------------- | ------------------------------------------------------------------------------------------ | --------------------------------- |
| SEC-MED-8       | `chat.history` returns full content                                                        | Required for UI; gated by WS auth |
| SEC-R5-LOW-1–4  | Plugin integrity, rate limiter, Firecrawl, healthz                                         | By design                         |
| SEC-R6-LOW-1–6  | Temp files, auto-load, Windows, MediaFetchError, Math.random, media server                 | Mitigated by existing controls    |
| SEC-R7-LOW-1–7  | Voice metadata, pairing logs, OAuth IDs, Gemini CLI, rate limit, auth JSON, memory zeroing | Low risk / platform limitation    |
| SEC-R8-LOW-1–4  | Canvas innerHTML (non-user), Slack duplicate path, session memory path, OAuth client IDs   | Low risk / by design              |
| SEC-DEP-MED-2–5 | protobufjs, chalk, @discordjs/opus, sqlite-vec                                             | Verify-only; likely not affected  |

---

## Cross-Cutting Recommendations

1. **CLAUDE.md**: Add "ALWAYS use `redactIdentifier()` when logging user identifiers across ALL channels"
2. **CLAUDE.md**: Add "ALWAYS use `fetchWithSsrFGuard` for any outbound HTTP with configurable base URLs"
3. **CLAUDE.md**: Add "ALWAYS use `safeEqualSecret()` for any secret/token comparison — never `===` or `!==`"
4. **CLAUDE.md**: Add "ALWAYS use `compileSafeRegex()` when compiling regex from config/user input"
5. **CLAUDE.md**: Add "NEVER return `err.message` or `err.stack` in HTTP responses — use generic messages"
6. **Defense-in-depth**: `logs.tail` redaction (Phase 2) catches PII leaks from any channel
7. **Custom lint rule**: Flag identifier variables in template literals within log calls
8. **Custom lint rule**: Flag `new RegExp()` calls not using `compileSafeRegex`
9. **Dependency hygiene**: Run `pnpm audit` in CI; maintain override discipline
10. **Plugin security**: Default `auth: "required"` for plugin HTTP routes
11. **Client storage**: Establish pattern for encrypted or session-scoped credential storage in UI
12. **Canvas security**: Establish CSP header standard for all HTML-serving endpoints

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

## Commit Strategy (65 phases, ~45 commits after merging related phases)

| #   | Scope                | Finding(s)                | Files            |
| --- | -------------------- | ------------------------- | ---------------- |
| 1   | `fix(whatsapp)`      | HIGH-1,2,3                | 4 source         |
| 2   | `fix(gateway)`       | HIGH-4                    | 1 source         |
| 3   | `fix(line)`          | MED-1,2                   | 5 source         |
| 4   | `fix(discord)`       | MED-3,4 + R6-MED-5        | 6 source         |
| 5   | `fix(gateway)`       | MED-5,6                   | 2 source         |
| 6   | `fix(agents)`        | MED-7                     | 1 source + tests |
| 7   | `fix(routing)`       | MED-8,9                   | 2 source         |
| 8   | `fix(gateway)`       | R5-CRIT-1                 | 1 source + tests |
| 9   | `fix(gateway)`       | R5-HIGH-1                 | 1 source + tests |
| 10  | `fix(agents)`        | R5-HIGH-2                 | 1 source         |
| 11  | `fix(agents)`        | R5-MED-1                  | 1 source         |
| 12  | `fix(gateway)`       | R5-MED-2                  | 1 source         |
| 13  | `fix(agents)`        | R5-MED-3                  | 1 source + tests |
| 14  | `fix(gateway)`       | R5-MED-4                  | 1 source         |
| 15  | `fix(gateway)`       | R5-MED-5                  | 1 source         |
| 16  | `fix(gateway)`       | R6-HIGH-1                 | 2 source         |
| 17  | `fix(agents)`        | R6-HIGH-2,3,4 + R8-HIGH-3 | 4 source         |
| 18  | `fix(deps)`          | DEP-HIGH-1                | 1 source         |
| 19  | `fix(infra)`         | DEP-HIGH-2                | 2 source         |
| 20  | `fix(ui)`            | DEP-MED-1                 | 1 source         |
| 21  | `fix(sessions)`      | R6-MED-1                  | 1 source         |
| 22  | `fix(media)`         | R6-MED-2                  | 1 source         |
| 23  | `fix(infra)`         | R6-MED-3                  | 1 source         |
| 24  | `fix(plugins)`       | R6-MED-4                  | 1 source         |
| 25  | `fix(discord)`       | R6-MED-5                  | 1 source         |
| 26  | `fix(memory)`        | R6-MED-6                  | 1 source         |
| 27  | `docs(agents)`       | R6-MED-7                  | 1 source         |
| 28  | `fix(telegram)`      | R7-HIGH-1, R7-MED-1       | 4 source         |
| 29  | `fix(signal)`        | R7-HIGH-2                 | 2 source         |
| 30  | `fix(imessage)`      | R7-HIGH-3, R7-MED-4       | 3 source         |
| 31  | `fix(ui)`            | R7-HIGH-4,5               | 3 source         |
| 32  | `fix(gateway)`       | R7-HIGH-6                 | 1 source         |
| 33  | `fix(security)`      | R7-HIGH-7, R7-MED-16      | 2 source         |
| 34  | `fix(tlon)`          | R7-HIGH-8                 | 1 source         |
| 35  | `fix(extensions)`    | R7-HIGH-9,10              | 2 source         |
| 36  | `fix(sessions)`      | R7-MED-2                  | 1 source         |
| 37  | `fix(agents)`        | R7-MED-3                  | 1 source         |
| 38  | `fix(gateway)`       | R7-MED-5                  | 1 source         |
| 39  | `fix(synology-chat)` | R7-MED-6,7                | 2 source         |
| 40  | `fix(diffs)`         | R7-MED-8                  | 1 source         |
| 41  | `fix(extensions)`    | R7-MED-9,10               | 3 source         |
| 42  | `fix(zalouser)`      | R7-MED-11                 | 1 source         |
| 43  | `fix(gateway)`       | R7-MED-12,13,14           | 3 source         |
| 44  | `fix(infra)`         | R7-MED-15                 | 1 source         |
| 45  | `fix(agents)`        | R8-HIGH-1                 | 1 source         |
| 46  | `fix(agents)`        | R8-HIGH-2                 | 1 source         |
| 47  | `fix(providers)`     | R8-HIGH-4                 | 1 source         |
| 48  | `fix(canvas)`        | R8-HIGH-5                 | 1 source         |
| 49  | `fix(agents)`        | R8-HIGH-6                 | 1 source         |
| 50  | `fix(agents)`        | R8-MED-1                  | 1 source         |
| 51  | `fix(gateway)`       | R8-MED-2,3                | 1 source         |
| 52  | `fix(channels)`      | R8-MED-4                  | 1 source         |
| 53  | `fix(providers)`     | R8-MED-5,6                | 2 source         |
| 54  | `fix(agents)`        | R8-MED-7,8                | 2 source         |
| 55  | `fix(infra)`         | R8-MED-9,10,11            | 3 source         |
| 56  | `fix(infra)`         | R8-MED-12,13,14           | 4 source         |

**Total**: ~70 source files, ~10-12 test files

---

## Audit Agent Summary

| #   | Agent Type         | Round | Purpose                                               | Findings                                     |
| --- | ------------------ | ----- | ----------------------------------------------------- | -------------------------------------------- |
| 1   | `security-auditor` | 5     | Core codebase audit                                   | 1C, 1H, 5M, 4L                               |
| 2   | `planner`          | 5     | Remediation plan (Rounds 1-4)                         | Plan output                                  |
| 3   | `Explore`          | 5     | Round 5 detail gathering                              | Line verification                            |
| 4   | `security-auditor` | 6     | Completeness verification                             | 13 missing instances                         |
| 5   | `security-auditor` | 6     | Fresh sweep (media, config, plugins)                  | 2H, 7M, 10L                                  |
| 6   | `security-auditor` | 6     | Edge cases (SSRF, injection, crypto)                  | 3H, 6M, 8L                                   |
| 7   | `general-purpose`  | 6     | Web research (dependency CVEs)                        | 2H, 3M, 17 safe                              |
| 8   | `security-auditor` | 7     | Unexplored code (Telegram, Signal, iMessage)          | 3H, 5M, 8L                                   |
| 9   | `security-auditor` | 7     | Extension plugins (42 packages)                       | 3H, 7M, 7L                                   |
| 10  | `security-auditor` | 7     | Secrets, crypto, auth flows                           | 2H, 5M, 13L                                  |
| 11  | `security-auditor` | 7     | Web UI, protocol, HTTP endpoints                      | 3H, 5M, 12L                                  |
| 12  | `general-purpose`  | 7     | Long-tail CVEs + product CVE history                  | Updates + 20+ CVE confirmations              |
| 13  | `security-auditor` | 8     | CLI commands, auto-reply pipeline                     | 2H, 5M, 10L                                  |
| 14  | `security-auditor` | 8     | Providers, config/sessions, secrets                   | 2H, 3M, 3L                                   |
| 15  | `security-auditor` | 8     | Slack HTTP, canvas host, skills/tools                 | 2H, 4M, 12L                                  |
| 16  | `security-auditor` | 8     | Deserialization, errors, regex, TOCTOU                | 2H, 6M, 4L                                   |
| 17  | `general-purpose`  | 8     | Web research (Grammy, Baileys, Express, supply chain) | 30+ CVE product updates, supply chain alerts |
| —   | `Explore`          | 6     | Completeness verification                             | Instance count updates                       |

**Total: 18 agents** (all complete)

---

## Diminishing Returns Analysis

| Round | New CRIT | New HIGH | New MED | New LOW | Pattern                               |
| ----- | -------- | -------- | ------- | ------- | ------------------------------------- |
| 1-5   | 1        | 5        | 12      | 4       | Core architecture issues              |
| 6     | 0        | 5        | 8       | 6       | SSRF consistency, deps                |
| 7     | 0        | 10       | 11      | 7       | Remaining channels, extensions, UI    |
| 8     | 0        | 6        | 10      | 4       | CLI, providers, canvas, cross-cutting |

Round 8 found **zero new CRITICALs**. The 6 HIGHs are in previously unexplored areas (SCP media staging, session export command, provider discovery, Copilot URL derivation, canvas host, mention regex). These are progressively more niche attack surfaces requiring more specific access conditions (authorized user, config write, MITM position).
