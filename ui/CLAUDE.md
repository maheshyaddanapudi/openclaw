<!-- This supplements the root CLAUDE.md. Read that first. -->

# Control UI (Web)

Lit web component control plane for gateway management. Separate workspace package.

## Technology (differs from core)

- **Framework**: Lit 3.3 (web components), NOT React/Vue
- **Build**: Vite 7.3, NOT tsdown
- **State**: Lit Signals + `signal-utils` — NOT Lit's `@state()` for shared state
- **Decorators**: Legacy decorators (`@state()`, `@property()`) — Rollup cannot parse `accessor` fields
- **Tests**: Vitest with `@vitest/browser-playwright` for browser tests

## Commands

```bash
pnpm ui:install         # install UI deps
pnpm ui:dev             # Vite dev server
pnpm ui:build           # production build → dist/control-ui/
pnpm test:ui            # run UI tests
```

## Key Patterns

- **NEVER** use standard decorators with `accessor` — the build tooling does not support them
- **ALWAYS** use legacy decorator style: `@state() foo = "bar"` and `@property({ type: Number }) count = 0`
- Components live in `ui/src/ui/` — app entry is `ui/src/main.ts` → imports `ui/src/ui/app.ts`
- Sanitize HTML with `dompurify` before rendering user content
- Base path configurable via `OPENCLAW_CONTROL_UI_BASE_PATH` env var

## Entry Points

- `ui/src/main.ts` — app bootstrap
- `ui/src/ui/app.ts` — root component
- `ui/src/ui/views/` — page-level views
- `ui/src/i18n/` — internationalization
