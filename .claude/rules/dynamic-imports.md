---
paths:
- 'src/**/*.ts'
- 'extensions/**/*.ts'
---

# Dynamic Import Rules

## Hard Rules

- **NEVER** mix `await import("x")` and static `import ... from "x"` for the same module in production code paths
- If lazy loading is needed, create a dedicated `*.runtime.ts` boundary that re-exports from `x`, then dynamically import only that boundary
- **ALWAYS** run `pnpm build` after refactors touching lazy-loading/module boundaries and check for `[INEFFECTIVE_DYNAMIC_IMPORT]` warnings

## Correct Pattern

```ts
// src/foo/bar.runtime.ts — the lazy boundary
export { heavyFunction } from "heavy-module";

// src/foo/consumer.ts — lazy caller
const { heavyFunction } = await import("./bar.runtime.js");

// WRONG: mixing static + dynamic for same module
import { lightFunction } from "heavy-module";        // static
const { heavyFunction } = await import("heavy-module"); // dynamic — INEFFECTIVE
```

## Additional TypeScript Rules

- **NEVER** add `@ts-nocheck` — fix the root cause
- **NEVER** disable `no-explicit-any` — fix the type
- **NEVER** share class behavior via prototype mutation — use explicit inheritance/composition
