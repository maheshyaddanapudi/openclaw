import {
  fetchWithSsrFGuard,
  type GuardedFetchOptions,
  type GuardedFetchResult,
  withStrictGuardedFetchMode,
  withTrustedEnvProxyGuardedFetchMode,
} from "../../infra/net/fetch-guard.js";
import type { SsrFPolicy } from "../../infra/net/ssrf.js";

// SECURITY: This policy deliberately allows private-network access for the web
// browsing tool. It is intended ONLY for use with `withTrustedWebToolsEndpoint`
// where the operator has explicitly configured a trusted endpoint (e.g. a local
// search proxy or scraping service). Do NOT use this policy for user-supplied
// URLs — use `withStrictWebToolsEndpoint` instead, which blocks private IPs.
const WEB_TOOLS_TRUSTED_NETWORK_SSRF_POLICY: SsrFPolicy = {
  dangerouslyAllowPrivateNetwork: true,
  allowRfc2544BenchmarkRange: true,
};

type WebToolGuardedFetchOptions = Omit<
  GuardedFetchOptions,
  "mode" | "proxy" | "dangerouslyAllowEnvProxyWithoutPinnedDns"
> & {
  timeoutSeconds?: number;
  useEnvProxy?: boolean;
};
type WebToolEndpointFetchOptions = Omit<WebToolGuardedFetchOptions, "policy" | "useEnvProxy">;

function resolveTimeoutMs(params: {
  timeoutMs?: number;
  timeoutSeconds?: number;
}): number | undefined {
  if (typeof params.timeoutMs === "number" && Number.isFinite(params.timeoutMs)) {
    return params.timeoutMs;
  }
  if (typeof params.timeoutSeconds === "number" && Number.isFinite(params.timeoutSeconds)) {
    return params.timeoutSeconds * 1000;
  }
  return undefined;
}

export async function fetchWithWebToolsNetworkGuard(
  params: WebToolGuardedFetchOptions,
): Promise<GuardedFetchResult> {
  const { timeoutSeconds, useEnvProxy, ...rest } = params;
  const resolved = {
    ...rest,
    timeoutMs: resolveTimeoutMs({ timeoutMs: rest.timeoutMs, timeoutSeconds }),
  };
  return fetchWithSsrFGuard(
    useEnvProxy
      ? withTrustedEnvProxyGuardedFetchMode(resolved)
      : withStrictGuardedFetchMode(resolved),
  );
}

async function withWebToolsNetworkGuard<T>(
  params: WebToolGuardedFetchOptions,
  run: (result: { response: Response; finalUrl: string }) => Promise<T>,
): Promise<T> {
  const { response, finalUrl, release } = await fetchWithWebToolsNetworkGuard(params);
  try {
    return await run({ response, finalUrl });
  } finally {
    await release();
  }
}

/**
 * Fetch from a **trusted, operator-configured** endpoint (e.g. a local search
 * proxy). Private-network access is allowed because the URL is not user-supplied.
 *
 * SECURITY: Do NOT use this for user-supplied or agent-supplied URLs. The
 * `dangerouslyAllowPrivateNetwork` flag in the policy bypasses SSRF protections
 * for private IP ranges. Only use this when the URL originates from operator
 * config (e.g. a search API base URL).
 */
export async function withTrustedWebToolsEndpoint<T>(
  params: WebToolEndpointFetchOptions,
  run: (result: { response: Response; finalUrl: string }) => Promise<T>,
): Promise<T> {
  return await withWebToolsNetworkGuard(
    {
      ...params,
      policy: WEB_TOOLS_TRUSTED_NETWORK_SSRF_POLICY,
      useEnvProxy: true,
    },
    run,
  );
}

export async function withStrictWebToolsEndpoint<T>(
  params: WebToolEndpointFetchOptions,
  run: (result: { response: Response; finalUrl: string }) => Promise<T>,
): Promise<T> {
  return await withWebToolsNetworkGuard(params, run);
}
