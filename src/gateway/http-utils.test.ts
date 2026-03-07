import { describe, expect, it } from "vitest";

/**
 * Tests for the sanitizeSessionKey function logic used in http-utils.
 * We replicate the validation function since it is not exported.
 */

const SESSION_KEY_MAX_LENGTH = 512;
const SESSION_KEY_SAFE_RE = /^[a-zA-Z0-9_:.\-/]+$/;

function sanitizeSessionKey(raw: string): string | undefined {
  if (raw.length > SESSION_KEY_MAX_LENGTH) {
    return undefined;
  }
  if (!SESSION_KEY_SAFE_RE.test(raw)) {
    return undefined;
  }
  if (raw.includes("..")) {
    return undefined;
  }
  return raw;
}

describe("sanitizeSessionKey", () => {
  it("allows valid session keys", () => {
    expect(sanitizeSessionKey("agent:telegram:bot123:user456")).toBe(
      "agent:telegram:bot123:user456",
    );
    expect(sanitizeSessionKey("main")).toBe("main");
    expect(sanitizeSessionKey("a/b/c")).toBe("a/b/c");
    expect(sanitizeSessionKey("key-with-hyphens_and_underscores")).toBe(
      "key-with-hyphens_and_underscores",
    );
    expect(sanitizeSessionKey("key.with.dots")).toBe("key.with.dots");
  });

  it("rejects keys exceeding max length", () => {
    const longKey = "a".repeat(SESSION_KEY_MAX_LENGTH + 1);
    expect(sanitizeSessionKey(longKey)).toBeUndefined();
  });

  it("allows keys at exactly max length", () => {
    const exactKey = "a".repeat(SESSION_KEY_MAX_LENGTH);
    expect(sanitizeSessionKey(exactKey)).toBe(exactKey);
  });

  it("rejects keys with shell metacharacters", () => {
    expect(sanitizeSessionKey("key;rm -rf /")).toBeUndefined();
    expect(sanitizeSessionKey("key`whoami`")).toBeUndefined();
    expect(sanitizeSessionKey("key$(cmd)")).toBeUndefined();
    expect(sanitizeSessionKey("key|pipe")).toBeUndefined();
    expect(sanitizeSessionKey("key&bg")).toBeUndefined();
    expect(sanitizeSessionKey("key with spaces")).toBeUndefined();
  });

  it("rejects keys with newlines", () => {
    expect(sanitizeSessionKey("key\ninjection")).toBeUndefined();
    expect(sanitizeSessionKey("key\rinjection")).toBeUndefined();
  });

  it("rejects path traversal attempts", () => {
    expect(sanitizeSessionKey("../etc/passwd")).toBeUndefined();
    expect(sanitizeSessionKey("a/../../etc/passwd")).toBeUndefined();
    expect(sanitizeSessionKey("..")).toBeUndefined();
  });

  it("allows single dots (not traversal)", () => {
    expect(sanitizeSessionKey("file.txt")).toBe("file.txt");
    expect(sanitizeSessionKey("a.b.c")).toBe("a.b.c");
  });

  it("rejects keys with unicode or special characters", () => {
    expect(sanitizeSessionKey("key\u0000null")).toBeUndefined();
    expect(sanitizeSessionKey("key<script>")).toBeUndefined();
    expect(sanitizeSessionKey('key"quoted')).toBeUndefined();
    expect(sanitizeSessionKey("key'quoted")).toBeUndefined();
  });
});
