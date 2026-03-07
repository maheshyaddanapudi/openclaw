import { describe, expect, it } from "vitest";

/**
 * Tests for the SAFE_REMOTE_PATH_RE validation exported indirectly through scpFile.
 * We test the regex pattern directly since scpFile is not exported.
 */
const SAFE_REMOTE_PATH_RE = /^[a-zA-Z0-9_./-]+$/;

describe("SAFE_REMOTE_PATH_RE", () => {
  it("allows simple file paths", () => {
    expect(SAFE_REMOTE_PATH_RE.test("/home/user/file.txt")).toBe(true);
    expect(SAFE_REMOTE_PATH_RE.test("/tmp/media/image.png")).toBe(true);
    expect(SAFE_REMOTE_PATH_RE.test("relative/path/file")).toBe(true);
  });

  it("allows paths with dots, hyphens, underscores", () => {
    expect(SAFE_REMOTE_PATH_RE.test("/home/user-name/my_file.tar.gz")).toBe(true);
    expect(SAFE_REMOTE_PATH_RE.test("/var/data/2024-01-01/file_v2.0.txt")).toBe(true);
  });

  it("rejects paths with backticks", () => {
    expect(SAFE_REMOTE_PATH_RE.test("/tmp/`whoami`")).toBe(false);
  });

  it("rejects paths with semicolons", () => {
    expect(SAFE_REMOTE_PATH_RE.test("/tmp/file;rm -rf /")).toBe(false);
  });

  it("rejects paths with pipes", () => {
    expect(SAFE_REMOTE_PATH_RE.test("/tmp/file|cat /etc/passwd")).toBe(false);
  });

  it("rejects paths with dollar signs", () => {
    expect(SAFE_REMOTE_PATH_RE.test("/tmp/$HOME")).toBe(false);
    expect(SAFE_REMOTE_PATH_RE.test("/tmp/$(whoami)")).toBe(false);
  });

  it("rejects paths with newlines", () => {
    expect(SAFE_REMOTE_PATH_RE.test("/tmp/file\nrm -rf /")).toBe(false);
  });

  it("rejects paths with spaces", () => {
    expect(SAFE_REMOTE_PATH_RE.test("/tmp/my file")).toBe(false);
  });

  it("rejects paths with ampersands", () => {
    expect(SAFE_REMOTE_PATH_RE.test("/tmp/file&cat /etc/passwd")).toBe(false);
  });

  it("rejects paths with parentheses", () => {
    expect(SAFE_REMOTE_PATH_RE.test("/tmp/$(cmd)")).toBe(false);
  });

  it("rejects empty strings", () => {
    expect(SAFE_REMOTE_PATH_RE.test("")).toBe(false);
  });

  it("rejects paths with single quotes", () => {
    expect(SAFE_REMOTE_PATH_RE.test("/tmp/file'")).toBe(false);
  });

  it("rejects paths with double quotes", () => {
    expect(SAFE_REMOTE_PATH_RE.test('/tmp/file"')).toBe(false);
  });
});
