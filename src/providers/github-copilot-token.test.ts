import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deriveCopilotApiBaseUrlFromToken,
  resolveCopilotApiToken,
} from "./github-copilot-token.js";

describe("github-copilot token", () => {
  const loadJsonFile = vi.fn();
  const saveJsonFile = vi.fn();
  const cachePath = "/tmp/openclaw-state/credentials/github-copilot.token.json";

  beforeEach(() => {
    loadJsonFile.mockClear();
    saveJsonFile.mockClear();
  });

  it("derives baseUrl from token", async () => {
    // Allowed: single-level subdomain of githubcopilot.com
    expect(deriveCopilotApiBaseUrlFromToken("token;proxy-ep=proxy.githubcopilot.com;")).toBe(
      "https://api.githubcopilot.com",
    );
    expect(deriveCopilotApiBaseUrlFromToken("token;proxy-ep=https://proxy.github.com;")).toBe(
      "https://api.github.com",
    );
    // Non-GitHub hostnames are rejected (SSRF protection)
    expect(deriveCopilotApiBaseUrlFromToken("token;proxy-ep=proxy.example.com;")).toBeNull();
  });

  it("uses cache when token is still valid", async () => {
    const now = Date.now();
    loadJsonFile.mockReturnValue({
      token: "cached;proxy-ep=proxy.githubcopilot.com;",
      expiresAt: now + 60 * 60 * 1000,
      updatedAt: now,
    });

    const fetchImpl = vi.fn();
    const res = await resolveCopilotApiToken({
      githubToken: "gh",
      cachePath,
      loadJsonFileImpl: loadJsonFile,
      saveJsonFileImpl: saveJsonFile,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(res.token).toBe("cached;proxy-ep=proxy.githubcopilot.com;");
    expect(res.baseUrl).toBe("https://api.githubcopilot.com");
    expect(String(res.source)).toContain("cache:");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("fetches and stores token when cache is missing", async () => {
    loadJsonFile.mockReturnValue(undefined);

    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        token: "fresh;proxy-ep=https://proxy.github.com;",
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      }),
    });

    const { resolveCopilotApiToken } = await import("./github-copilot-token.js");

    const res = await resolveCopilotApiToken({
      githubToken: "gh",
      cachePath,
      loadJsonFileImpl: loadJsonFile,
      saveJsonFileImpl: saveJsonFile,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(res.token).toBe("fresh;proxy-ep=https://proxy.github.com;");
    expect(res.baseUrl).toBe("https://api.github.com");
    expect(saveJsonFile).toHaveBeenCalledTimes(1);
  });
});
