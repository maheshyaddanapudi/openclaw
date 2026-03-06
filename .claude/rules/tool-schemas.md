---
paths:
- 'src/agents/tools/**'
- 'src/agents/schema/**'
---

# Tool Schema Rules

Tool input schemas sent to LLM providers have strict compatibility constraints.

## Hard Rules

- **NEVER** use `Type.Union` in tool input schemas — it compiles to `anyOf` which many providers reject
- **NEVER** use `anyOf`, `oneOf`, or `allOf` in tool schemas
- **ALWAYS** use `stringEnum()` or `optionalStringEnum()` from `src/agents/schema/typebox.ts` for string enums
- **ALWAYS** use `Type.Optional(...)` instead of union with null
- **ALWAYS** keep the top-level tool schema as `type: "object"` with `properties`
- **NEVER** use `format` as a property name in tool schemas — some validators treat it as reserved

## Correct Pattern

```ts
import { stringEnum, optionalStringEnum } from "../schema/typebox.js";

// Good: flat string enum
action: stringEnum(["read", "write", "delete"]),
mode: optionalStringEnum(["fast", "thorough"]),

// Bad: Type.Union — will produce anyOf
action: Type.Union([Type.Literal("read"), Type.Literal("write")]),
```
