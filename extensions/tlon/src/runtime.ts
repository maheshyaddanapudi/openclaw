import type { PluginRuntime } from "openclaw/plugin-sdk/tlon";

let runtime: PluginRuntime | null = null;

export function setTlonRuntime(next: PluginRuntime) {
  runtime = next;
}

export function getTlonRuntime(): PluginRuntime {
  if (!runtime) {
    throw new Error("Tlon runtime not initialized");
  }
  return runtime;
}

/**
 * Strict allowlist for Urbit ship names. Only lowercase letters and hyphens are
 * valid in @p phonemes. The tilde prefix is optional. This prevents injection of
 * control characters, shell metacharacters, or other unexpected values into API
 * calls that accept ship names from user or LLM-controlled input.
 */
const SAFE_SHIP_RE = /^~?[a-z][a-z-]*$/;

/**
 * Validate that a string is a safe Urbit ship name before using it in API
 * operations. Returns `true` if the value matches the strict @p character set.
 */
export function isValidShipName(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  return SAFE_SHIP_RE.test(trimmed);
}
