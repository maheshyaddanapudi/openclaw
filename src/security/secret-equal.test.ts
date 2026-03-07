import { describe, expect, it } from "vitest";
import { safeEqualSecret } from "./secret-equal.js";

describe("safeEqualSecret", () => {
  it("returns true for matching strings", () => {
    expect(safeEqualSecret("secret123", "secret123")).toBe(true);
  });

  it("returns false for non-matching strings", () => {
    expect(safeEqualSecret("secret123", "secret456")).toBe(false);
  });

  it("returns false when provided is null or undefined", () => {
    expect(safeEqualSecret(null, "secret")).toBe(false);
    expect(safeEqualSecret(undefined, "secret")).toBe(false);
  });

  it("returns false when expected is null or undefined", () => {
    expect(safeEqualSecret("secret", null)).toBe(false);
    expect(safeEqualSecret("secret", undefined)).toBe(false);
  });

  it("returns false when both are null or undefined", () => {
    expect(safeEqualSecret(null, null)).toBe(false);
    expect(safeEqualSecret(undefined, undefined)).toBe(false);
    expect(safeEqualSecret(null, undefined)).toBe(false);
  });

  it("returns true for matching empty strings", () => {
    expect(safeEqualSecret("", "")).toBe(true);
  });

  it("returns false for different-length strings", () => {
    expect(safeEqualSecret("short", "a much longer string")).toBe(false);
  });
});
