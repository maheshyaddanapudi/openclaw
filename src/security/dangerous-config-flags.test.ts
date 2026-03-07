import { describe, expect, it } from "vitest";
import type { OpenClawConfig } from "../config/config.js";
import { collectEnabledInsecureOrDangerousFlags } from "./dangerous-config-flags.js";

describe("collectEnabledInsecureOrDangerousFlags", () => {
  it("returns empty array for default config", () => {
    const cfg: OpenClawConfig = {};
    expect(collectEnabledInsecureOrDangerousFlags(cfg)).toEqual([]);
  });

  it("detects gateway.auth.mode=none", () => {
    const cfg: OpenClawConfig = {
      gateway: { auth: { mode: "none" } },
    };
    const flags = collectEnabledInsecureOrDangerousFlags(cfg);
    expect(flags).toContain("gateway.auth.mode=none");
  });

  it("does not flag gateway.auth.mode=token", () => {
    const cfg: OpenClawConfig = {
      gateway: { auth: { mode: "token" } },
    };
    const flags = collectEnabledInsecureOrDangerousFlags(cfg);
    expect(flags).not.toContain("gateway.auth.mode=none");
  });

  it("detects controlUi insecure flags", () => {
    const cfg: OpenClawConfig = {
      gateway: { controlUi: { allowInsecureAuth: true } },
    };
    const flags = collectEnabledInsecureOrDangerousFlags(cfg);
    expect(flags).toContain("gateway.controlUi.allowInsecureAuth=true");
  });

  it("detects multiple flags simultaneously", () => {
    const cfg: OpenClawConfig = {
      gateway: {
        auth: { mode: "none" },
        controlUi: { allowInsecureAuth: true },
      },
    };
    const flags = collectEnabledInsecureOrDangerousFlags(cfg);
    expect(flags).toContain("gateway.auth.mode=none");
    expect(flags).toContain("gateway.controlUi.allowInsecureAuth=true");
  });
});
