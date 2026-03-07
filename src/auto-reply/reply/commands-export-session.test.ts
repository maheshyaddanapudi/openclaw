import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Tests for the validateOutputPath logic used in export-session command.
 * We replicate the validation function here since it is not exported.
 */
function validateOutputPath(outputPath: string, workspaceDir: string): string | null {
  const resolved = path.resolve(outputPath);
  const normalizedWorkspace = path.resolve(workspaceDir);
  if (!resolved.startsWith(normalizedWorkspace + path.sep) && resolved !== normalizedWorkspace) {
    return null;
  }
  return resolved;
}

describe("validateOutputPath", () => {
  const workspace = "/home/user/workspace";

  it("allows paths within the workspace", () => {
    expect(validateOutputPath("/home/user/workspace/export.html", workspace)).toBe(
      "/home/user/workspace/export.html",
    );
  });

  it("allows paths in workspace subdirectories", () => {
    expect(validateOutputPath("/home/user/workspace/exports/file.html", workspace)).toBe(
      "/home/user/workspace/exports/file.html",
    );
  });

  it("rejects paths outside the workspace", () => {
    expect(validateOutputPath("/etc/passwd", workspace)).toBeNull();
    expect(validateOutputPath("/home/user/other/file.html", workspace)).toBeNull();
  });

  it("rejects path traversal with ..", () => {
    expect(validateOutputPath("/home/user/workspace/../other/file.html", workspace)).toBeNull();
  });

  it("rejects paths that are a prefix but not a subdirectory", () => {
    // /home/user/workspace-evil is NOT inside /home/user/workspace
    expect(validateOutputPath("/home/user/workspace-evil/file.html", workspace)).toBeNull();
  });

  it("allows the workspace directory itself", () => {
    expect(validateOutputPath(workspace, workspace)).toBe(workspace);
  });
});
