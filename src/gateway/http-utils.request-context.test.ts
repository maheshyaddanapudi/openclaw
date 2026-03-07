import type { IncomingMessage } from "node:http";
import { describe, expect, it } from "vitest";
import { resolveGatewayRequestContext, resolveSessionKey } from "./http-utils.js";

function createReq(headers: Record<string, string> = {}): IncomingMessage {
  return { headers } as IncomingMessage;
}

describe("resolveGatewayRequestContext", () => {
  it("uses normalized x-openclaw-message-channel when enabled", () => {
    const result = resolveGatewayRequestContext({
      req: createReq({ "x-openclaw-message-channel": " Custom-Channel " }),
      model: "openclaw",
      sessionPrefix: "openai",
      defaultMessageChannel: "webchat",
      useMessageChannelHeader: true,
    });

    expect(result.messageChannel).toBe("custom-channel");
  });

  it("uses default messageChannel when header support is disabled", () => {
    const result = resolveGatewayRequestContext({
      req: createReq({ "x-openclaw-message-channel": "custom-channel" }),
      model: "openclaw",
      sessionPrefix: "openresponses",
      defaultMessageChannel: "webchat",
      useMessageChannelHeader: false,
    });

    expect(result.messageChannel).toBe("webchat");
  });

  it("includes session prefix and user in generated session key", () => {
    const result = resolveGatewayRequestContext({
      req: createReq(),
      model: "openclaw",
      user: "alice",
      sessionPrefix: "openresponses",
      defaultMessageChannel: "webchat",
    });

    expect(result.sessionKey).toContain("openresponses-user:alice");
  });
});

describe("resolveSessionKey", () => {
  it("uses a valid explicit session key from the header", () => {
    const result = resolveSessionKey({
      req: createReq({ "x-openclaw-session-key": "my-session:key-123" }),
      agentId: "main",
      prefix: "test",
    });
    expect(result).toBe("my-session:key-123");
  });

  it("rejects session keys with path traversal", () => {
    const result = resolveSessionKey({
      req: createReq({ "x-openclaw-session-key": "../../etc/passwd" }),
      agentId: "main",
      prefix: "test",
    });
    // Should fall through to generated key, not use the traversal attempt
    expect(result).not.toContain("..");
    expect(result).toContain("test");
  });

  it("rejects session keys with special characters", () => {
    const result = resolveSessionKey({
      req: createReq({ "x-openclaw-session-key": "key<script>alert(1)</script>" }),
      agentId: "main",
      prefix: "test",
    });
    expect(result).not.toContain("<script>");
    expect(result).toContain("test");
  });

  it("rejects session keys exceeding maximum length", () => {
    const longKey = "a".repeat(600);
    const result = resolveSessionKey({
      req: createReq({ "x-openclaw-session-key": longKey }),
      agentId: "main",
      prefix: "test",
    });
    expect(result).not.toBe(longKey);
    expect(result).toContain("test");
  });

  it("accepts session keys with safe characters", () => {
    const safeKey = "agent:telegram:bot123:peer-456/thread_789.main";
    const result = resolveSessionKey({
      req: createReq({ "x-openclaw-session-key": safeKey }),
      agentId: "main",
      prefix: "test",
    });
    expect(result).toBe(safeKey);
  });

  it("generates a session key when no header is provided", () => {
    const result = resolveSessionKey({
      req: createReq(),
      agentId: "main",
      prefix: "test",
    });
    expect(result).toContain("test");
  });
});
