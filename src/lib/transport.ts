import { custom, http, type Transport } from "viem";
import { DEFAULT_RPC_URL } from "arkiv-triggers";
import { RELAY_PATH } from "./constants";
import { isRateLimited } from "./errors";

/**
 * Direct to Arkiv first. Only a rate limit sends the same request through this site's relay
 * (/api/arkiv), which holds the access key on the server. Any other error is thrown unchanged.
 *
 * This is a fallback that is gated on rate limits. viem's own fallback() would also switch on
 * timeouts and bad responses, which is not wanted here.
 */
export function arkivTransport(): Transport {
  return (opts) => {
    const direct = http(DEFAULT_RPC_URL, { retryCount: 0 })(opts);
    const provider = {
      request: async (args: { method: string; params?: unknown }) => {
        try {
          return await direct.request(args as never);
        } catch (e) {
          if (!isRateLimited(e) || typeof window === "undefined") throw e;
          const relay = http(`${window.location.origin}${RELAY_PATH}`, { retryCount: 0 })(opts);
          return relay.request(args as never);
        }
      },
    };
    return custom(provider)(opts);
  };
}
