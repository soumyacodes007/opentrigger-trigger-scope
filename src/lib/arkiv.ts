import { createTriggers, type Triggers } from "arkiv-triggers";
import { createPublicClient } from "@arkiv-network/sdk";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { APP_NAME } from "./constants";
import { arkivTransport } from "./transport";

export type { Triggers };

/**
 * A read-only client. Call it inside useEffect or an event handler, never at module top level.
 * Reads go direct to Arkiv; only rate limits are retried through this site's relay.
 */
export function makeTriggers(): Triggers {
  const publicClient = createPublicClient({ chain: tiramisu, transport: arkivTransport() });
  return createTriggers({ publicClient, app: APP_NAME });
}
