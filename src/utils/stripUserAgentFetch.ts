const USER_AGENT = 'user-agent';

/**
 * Strip the SDK's script-set User-Agent ("breez-sdk-spark/<version>") from
 * outgoing fetch requests.
 *
 * A script-set User-Agent is not CORS-safelisted. Chromium drops it, but
 * WebKit (iOS) and Firefox send it, which forces a preflight, and a host
 * whose preflight does not allow the header fails the request. That is how
 * blockstream's onchain-claim lookups broke on iOS.
 *
 * The SDK stopped setting it on its plain HTTP client in the browser in
 * 0.17.0. As of 0.25.0 it still sets it on its gRPC-web calls (Spark
 * operators, Breez server, realtime sync) and on the Lightning-address
 * server calls. Those hosts currently allow the header, so this guards
 * against one of them tightening CORS rather than fixing a live failure.
 * Delete it once the SDK stops setting User-Agent on those paths.
 *
 * The SDK passes Request objects, and Chromium drops the header from those
 * before this wrapper runs, so only WebKit or Firefox show it firing.
 *
 * Call once, before the SDK issues any request.
 */
export function installUserAgentStrippingFetch(): void {
  const originalFetch = window.fetch.bind(window);

  // Standalone Headers carry the unguarded "none" header guard, so they
  // can both read a forwarded user-agent and be rebuilt without one. A
  // request-guarded Headers would hide or keep it depending on the engine.
  const withoutUserAgent = (
    base: Headers | undefined,
    overrides: HeadersInit | undefined,
  ): Headers | null => {
    const merged = new Headers(base ?? undefined);
    if (overrides) {
      new Headers(overrides).forEach((value, key) => merged.set(key, value));
    }
    if (!merged.has(USER_AGENT)) return null;
    const clean = new Headers();
    merged.forEach((value, key) => {
      if (key.toLowerCase() !== USER_AGENT) clean.set(key, value);
    });
    return clean;
  };

  window.fetch = (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const base = input instanceof Request ? input.headers : undefined;
    const clean = withoutUserAgent(base, init?.headers);
    if (!clean) return originalFetch(input, init);
    // Reconstruct with cleaned headers. For a bare Request (the reqwest
    // path) this preserves method / url / body and only swaps headers.
    if (input instanceof Request && !init) {
      return originalFetch(new Request(input, { headers: clean }));
    }
    return originalFetch(input, { ...init, headers: clean });
  };
}
