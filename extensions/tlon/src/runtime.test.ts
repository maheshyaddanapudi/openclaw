import { describe, expect, it } from "vitest";
import { isValidShipName } from "./runtime.js";

describe("isValidShipName", () => {
  it("accepts valid galaxy names", () => {
    expect(isValidShipName("~zod")).toBe(true);
    expect(isValidShipName("~bus")).toBe(true);
    expect(isValidShipName("~nec")).toBe(true);
  });

  it("accepts valid planet names", () => {
    expect(isValidShipName("~sampel-palnet")).toBe(true);
    expect(isValidShipName("~nocsyx-lassul")).toBe(true);
  });

  it("accepts names without tilde prefix", () => {
    expect(isValidShipName("zod")).toBe(true);
    expect(isValidShipName("sampel-palnet")).toBe(true);
  });

  it("accepts valid star names", () => {
    expect(isValidShipName("~marzod")).toBe(true);
  });

  it("accepts valid moon names", () => {
    expect(isValidShipName("~dozzod-dozzod-dozzod-dozzod")).toBe(true);
  });

  it("rejects empty strings", () => {
    expect(isValidShipName("")).toBe(false);
    expect(isValidShipName("   ")).toBe(false);
  });

  it("rejects names with shell metacharacters", () => {
    expect(isValidShipName("~zod;rm -rf /")).toBe(false);
    expect(isValidShipName("~zod`whoami`")).toBe(false);
    expect(isValidShipName("~zod$(cmd)")).toBe(false);
    expect(isValidShipName("~zod|cat")).toBe(false);
    expect(isValidShipName("~zod&bg")).toBe(false);
  });

  it("rejects names with digits", () => {
    expect(isValidShipName("~zod123")).toBe(false);
  });

  it("rejects names with underscores", () => {
    expect(isValidShipName("~zod_test")).toBe(false);
  });

  it("rejects names with uppercase letters", () => {
    expect(isValidShipName("~Zod")).toBe(false);
    expect(isValidShipName("~SAMPEL-PALNET")).toBe(false);
  });

  it("rejects names with spaces", () => {
    expect(isValidShipName("~zod bus")).toBe(false);
  });

  it("rejects names starting with a hyphen", () => {
    expect(isValidShipName("~-zod")).toBe(false);
    expect(isValidShipName("-zod")).toBe(false);
  });

  it("rejects names with newlines", () => {
    expect(isValidShipName("~zod\nrm")).toBe(false);
  });

  it("rejects names with dots", () => {
    expect(isValidShipName("~zod.test")).toBe(false);
  });

  it("trims whitespace before validation", () => {
    expect(isValidShipName("  ~zod  ")).toBe(true);
    expect(isValidShipName(" sampel-palnet ")).toBe(true);
  });
});
