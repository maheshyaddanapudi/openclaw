import { describe, expect, it } from "vitest";
import { mintCanvasCapabilityToken } from "./canvas-capability.js";

describe("mintCanvasCapabilityToken", () => {
  it("generates a token with at least 256-bit entropy", () => {
    const token = mintCanvasCapabilityToken();
    // 32 bytes in base64url = 43 characters (ceil(32 * 4 / 3))
    expect(token.length).toBeGreaterThanOrEqual(43);
  });

  it("generates unique tokens on each call", () => {
    const tokens = new Set(Array.from({ length: 100 }, () => mintCanvasCapabilityToken()));
    expect(tokens.size).toBe(100);
  });

  it("produces valid base64url characters", () => {
    const token = mintCanvasCapabilityToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
