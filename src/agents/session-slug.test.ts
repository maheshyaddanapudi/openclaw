import { afterEach, describe, expect, it, vi } from "vitest";
import { createSessionSlug } from "./session-slug.js";

describe("session slug", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Mock crypto.getRandomValues to always return 0, making randomChoice pick index 0. */
  function mockCryptoZero() {
    vi.spyOn(crypto, "getRandomValues").mockImplementation((array) => {
      if (array instanceof Uint32Array) {
        array.fill(0);
      }
      if (array instanceof Uint8Array) {
        array.fill(0);
      }
      return array;
    });
  }

  it("generates a two-word slug by default", () => {
    mockCryptoZero();
    const slug = createSessionSlug();
    expect(slug).toBe("amber-atlas");
  });

  it("adds a numeric suffix when the base slug is taken", () => {
    mockCryptoZero();
    const slug = createSessionSlug((id) => id === "amber-atlas");
    expect(slug).toBe("amber-atlas-2");
  });

  it("falls back to three words when collisions persist", () => {
    mockCryptoZero();
    const slug = createSessionSlug((id) => /^amber-atlas(-\d+)?$/.test(id));
    expect(slug).toBe("amber-atlas-atlas");
  });
});
