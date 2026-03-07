import { describe, expect, it } from "vitest";
import { SsrFBlockedError } from "../infra/net/ssrf.js";
import { InvalidBrowserNavigationUrlError } from "./navigation-guard.js";
import { createBrowserRouteContext } from "./server-context.js";
import type { BrowserServerState } from "./server-context.types.js";

function createMinimalState(): BrowserServerState {
  return {
    port: 0,
    resolved: {
      enabled: false,
      evaluateEnabled: false,
      controlPort: 9222,
      cdpPortRangeStart: 9222,
      cdpPortRangeEnd: 9232,
      defaultProfile: "default",
      profiles: {},
      proxyPolicy: "local",
      evaluatePolicy: "off",
      snapshotDefaults: {},
      // oxlint-disable-next-line typescript/no-explicit-any
    } as any,
    profiles: new Map(),
  };
}

describe("mapTabError", () => {
  const ctx = createBrowserRouteContext({
    getState: () => createMinimalState(),
    refreshConfigFromDisk: false,
  });

  it("returns generic message for SSRF blocked errors", () => {
    const err = new SsrFBlockedError("http://169.254.169.254/latest/meta-data");
    const result = ctx.mapTabError(err);
    expect(result).not.toBeNull();
    expect(result?.status).toBe(400);
    expect(result?.message).toBe("blocked by SSRF policy");
    expect(result?.message).not.toContain("169.254");
  });

  it("returns generic message for invalid navigation URL errors", () => {
    const err = new InvalidBrowserNavigationUrlError("javascript:alert(1)");
    const result = ctx.mapTabError(err);
    expect(result).not.toBeNull();
    expect(result?.status).toBe(400);
    expect(result?.message).toBe("invalid navigation URL");
    expect(result?.message).not.toContain("javascript");
  });

  it("returns generic message for tab not found errors", () => {
    const result = ctx.mapTabError(new Error("tab not found: ABC123DEF"));
    expect(result).not.toBeNull();
    expect(result?.status).toBe(404);
    expect(result?.message).toBe("tab not found");
    expect(result?.message).not.toContain("ABC123DEF");
  });

  it("returns generic message for not found errors", () => {
    const result = ctx.mapTabError(new Error("profile not found: secret-profile"));
    expect(result).not.toBeNull();
    expect(result?.status).toBe(404);
    expect(result?.message).toBe("not found");
    expect(result?.message).not.toContain("secret-profile");
  });

  it("returns null for unrecognized errors", () => {
    const result = ctx.mapTabError(new Error("unexpected internal failure"));
    expect(result).toBeNull();
  });
});
