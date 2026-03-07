import { describe, expect, it } from "vitest";
import { resolveDiscordSenderIdentity, resolveDiscordWebhookId } from "./sender-identity.js";

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "289522496",
    username: "alice",
    globalName: "Alice",
    ...overrides,
  } as import("@buape/carbon").User;
}

describe("resolveDiscordSenderIdentity", () => {
  it("returns a redactedId that is a sha256 hash prefix", () => {
    const identity = resolveDiscordSenderIdentity({ author: makeUser() });
    expect(identity.redactedId).toMatch(/^sha256:[a-f0-9]{12}$/);
    expect(identity.redactedId).not.toContain("289522496");
  });

  it("keeps the raw id intact for access control use", () => {
    const identity = resolveDiscordSenderIdentity({ author: makeUser() });
    expect(identity.id).toBe("289522496");
  });

  it("redactedId is deterministic for the same input", () => {
    const a = resolveDiscordSenderIdentity({ author: makeUser() });
    const b = resolveDiscordSenderIdentity({ author: makeUser() });
    expect(a.redactedId).toBe(b.redactedId);
  });

  it("redactedId differs for different user ids", () => {
    const a = resolveDiscordSenderIdentity({ author: makeUser({ id: "111" }) });
    const b = resolveDiscordSenderIdentity({ author: makeUser({ id: "222" }) });
    expect(a.redactedId).not.toBe(b.redactedId);
  });

  it("returns redactedId for PluralKit members", () => {
    const identity = resolveDiscordSenderIdentity({
      author: makeUser(),
      pluralkitInfo: {
        member: { id: "pk_member_1", name: "Alter" },
        system: { id: "sys_1", name: "System" },
      } as import("../pluralkit.js").PluralKitMessageInfo,
    });
    expect(identity.isPluralKit).toBe(true);
    expect(identity.id).toBe("pk_member_1");
    expect(identity.redactedId).toMatch(/^sha256:[a-f0-9]{12}$/);
    expect(identity.redactedId).not.toContain("pk_member_1");
  });
});

describe("resolveDiscordWebhookId", () => {
  it("returns webhookId when present", () => {
    expect(resolveDiscordWebhookId({ webhookId: "123" })).toBe("123");
  });

  it("returns null for missing webhook id", () => {
    expect(resolveDiscordWebhookId({})).toBeNull();
  });
});
