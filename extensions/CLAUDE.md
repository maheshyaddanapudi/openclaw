<!-- This supplements the root CLAUDE.md. Read that first. -->

# Extensions (Channel Plugins)

42 plugin packages under `extensions/` published as `@openclaw/<name>`.

## Plugin Structure

Every extension must declare metadata in its `package.json`:
```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": { "id": "name", "label": "Display Name", "docsPath": "/channels/name" }
  }
}
```

## Key Conventions

- **ALWAYS** put runtime deps in `dependencies` — plugin install runs `npm install --omit=dev`
- **NEVER** use `workspace:*` in `dependencies` — it breaks npm install at runtime. Put `openclaw` in `devDependencies` or `peerDependencies` instead
- Access the SDK via `openclaw/plugin-sdk` or channel-specific subpaths (`openclaw/plugin-sdk/telegram`)
- Each extension exports: `monitor*`, `probe*`, `send*`, `resolve*Credentials` functions
- Extension-only deps stay in the extension `package.json` — never add to root unless core uses them

## Commands

```bash
pnpm test:extensions                    # run all extension tests
pnpm exec vitest run extensions/msteams/src/channel.test.ts  # single extension
pnpm plugins:sync                       # sync plugin versions
```

## When Adding a New Extension

1. Create `extensions/<name>/` with `package.json` and `src/index.ts`
2. Export adapter functions (monitor, probe, send, token resolution)
3. Update `.github/labeler.yml` with a matching label
4. Add `plugin-sdk/<name>` export in root `package.json` and `tsdown.config.ts`
5. Update docs at `docs/channels/<name>.md`
