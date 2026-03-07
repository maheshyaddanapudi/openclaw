import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveSessionTranscriptPathInDir } from "./paths.js";

describe("resolveSessionTranscriptPathInDir topic ID validation", () => {
  const sessionsDir = path.join(os.tmpdir(), "test-sessions");

  it("accepts topic IDs within the 256-char limit", () => {
    const topicId = "a".repeat(256);
    const result = resolveSessionTranscriptPathInDir("test123", sessionsDir, topicId);
    expect(result).toContain("test123-topic-");
  });

  it("rejects topic IDs exceeding 256 characters", () => {
    const topicId = "a".repeat(257);
    expect(() => resolveSessionTranscriptPathInDir("test123", sessionsDir, topicId)).toThrow(
      "Topic ID exceeds maximum length of 256 characters",
    );
  });

  it("accepts numeric topic IDs", () => {
    const result = resolveSessionTranscriptPathInDir("test123", sessionsDir, 42);
    expect(result).toContain("test123-topic-42.jsonl");
  });

  it("generates correct path without topic ID", () => {
    const result = resolveSessionTranscriptPathInDir("test123", sessionsDir);
    expect(result).toContain("test123.jsonl");
  });
});
