---
paths:
- 'extensions/**'
- 'src/plugins/**'
- 'src/plugin-sdk/**'
---

# Plugin & Extension Rules

## Hard Rules

- **ALWAYS** put runtime deps in extension `dependencies` — `npm install --omit=dev` runs at install time
- **NEVER** use `workspace:*` in extension `dependencies` — breaks runtime npm install. Use `devDependencies` or `peerDependencies` for `openclaw`
- **NEVER** add extension-specific deps to the root `package.json`
- **ALWAYS** declare `openclaw.extensions` and `openclaw.channel` metadata in extension `package.json`
- **NEVER** import monolithic `openclaw/plugin-sdk` entry — use channel-specific subpaths like `openclaw/plugin-sdk/telegram`

## Extension Entry Pattern

```ts
// extensions/<name>/src/index.ts — canonical exports
export { monitor<Name>Provider } from "./monitor.js";
export { probe<Name> } from "./probe.js";
export { sendMessage<Name> } from "./send.js";
export { type <Name>Credentials, resolve<Name>Credentials } from "./token.js";
```

## Plugin Discovery

Plugin candidates are resolved from: workspace packages → bundled plugins → user config dir.
Path safety checks in `src/plugins/path-safety.ts` validate plugins are inside allowed directories.
