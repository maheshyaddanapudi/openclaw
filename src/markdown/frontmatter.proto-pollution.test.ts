import { describe, expect, it } from "vitest";
import { parseFrontmatterBlock } from "./frontmatter.js";

describe("parseFrontmatterBlock prototype pollution guard", () => {
  it("blocks __proto__ key from YAML frontmatter", () => {
    const content = `---
__proto__: polluted
name: safe
---
`;
    const result = parseFrontmatterBlock(content);
    expect(result.name).toBe("safe");
    expect(result.__proto__).toBeUndefined();
    expect(Object.keys(result)).not.toContain("__proto__");
  });

  it("blocks constructor key from frontmatter", () => {
    const content = `---
constructor: polluted
name: safe
---
`;
    const result = parseFrontmatterBlock(content);
    expect(result.name).toBe("safe");
    expect(Object.keys(result)).not.toContain("constructor");
  });

  it("blocks prototype key from frontmatter", () => {
    const content = `---
prototype: polluted
name: safe
---
`;
    const result = parseFrontmatterBlock(content);
    expect(result.name).toBe("safe");
    expect(Object.keys(result)).not.toContain("prototype");
  });

  it("preserves safe keys", () => {
    const content = `---
name: test-skill
description: a safe skill
---
`;
    const result = parseFrontmatterBlock(content);
    expect(result.name).toBe("test-skill");
    expect(result.description).toBe("a safe skill");
  });
});
