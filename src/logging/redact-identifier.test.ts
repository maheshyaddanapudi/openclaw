import { describe, expect, it } from "vitest";
import { redactIdentifier, sha256HexPrefix } from "./redact-identifier.js";

describe("sha256HexPrefix", () => {
  it("returns a hex string of the requested length", () => {
    const result = sha256HexPrefix("test", 8);
    expect(result).toHaveLength(8);
    expect(result).toMatch(/^[a-f0-9]+$/);
  });

  it("defaults to 12 characters", () => {
    expect(sha256HexPrefix("test")).toHaveLength(12);
  });

  it("produces consistent output for the same input", () => {
    expect(sha256HexPrefix("hello")).toBe(sha256HexPrefix("hello"));
  });

  it("produces different output for different inputs", () => {
    expect(sha256HexPrefix("a")).not.toBe(sha256HexPrefix("b"));
  });
});

describe("redactIdentifier", () => {
  it("returns dash for undefined", () => {
    expect(redactIdentifier(undefined)).toBe("-");
  });

  it("returns dash for empty string", () => {
    expect(redactIdentifier("")).toBe("-");
  });

  it("returns dash for whitespace-only string", () => {
    expect(redactIdentifier("   ")).toBe("-");
  });

  it("returns sha256 prefixed hash for valid input", () => {
    const result = redactIdentifier("user123");
    expect(result).toMatch(/^sha256:[a-f0-9]{12}$/);
  });

  it("supports custom length", () => {
    const result = redactIdentifier("user123", { len: 6 });
    expect(result).toMatch(/^sha256:[a-f0-9]{6}$/);
  });

  it("produces consistent output", () => {
    expect(redactIdentifier("test")).toBe(redactIdentifier("test"));
  });

  it("trims whitespace before hashing", () => {
    expect(redactIdentifier("  test  ")).toBe(redactIdentifier("test"));
  });
});
