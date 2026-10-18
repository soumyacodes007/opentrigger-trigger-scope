/**
 * Read relay, server side only. The browser tries Arkiv directly first and sends a request here only
 * when Arkiv rate-limits it. The access key (ARKIV_ACCESS_KEY) is read from the server environment and
 * is never sent to the browser.
 *
 * Only read methods are allowed. Anything else gets a 403, so the relay cannot be used to send transactions.
 */

const UPSTREAM = "https://rpc.tiramisu.db-chain.testnet.arkiv.network";
const ALLOWED_METHODS = new Set([
  "arkiv_query",
  "arkiv_getBlockTiming",
  "eth_blockNumber",
  "eth_chainId",
  "eth_getBalance",
  "eth_getLogs",
  "eth_getBlockByNumber",
  "eth_getTransactionReceipt",
  "eth_call",
]);
const MAX_BATCH = 20;
const MAX_BYTES = 64 * 1024;
const TIMEOUT_MS = 15_000;
const NO_STORE = { "Cache-Control": "no-store" };

function rpcError(status: number, code: number, message: string): Response {
  return Response.json({ jsonrpc: "2.0", id: null, error: { code, message } }, { status, headers: NO_STORE });
}

export async function POST(request: Request): Promise<Response> {
  const text = await request.text();
  if (text.length > MAX_BYTES) return rpcError(413, -32600, "request body too large");

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return rpcError(400, -32700, "parse error: body is not JSON");
  }

  const calls: unknown[] = Array.isArray(body) ? body : [body];
  if (calls.length === 0) return rpcError(400, -32600, "empty batch");
  if (calls.length > MAX_BATCH) return rpcError(400, -32600, `batch too large (max ${MAX_BATCH})`);

  for (const call of calls) {
    const method = (call as { method?: unknown } | null)?.method;
    if (typeof method !== "string") return rpcError(400, -32600, "invalid JSON-RPC request");
    if (!ALLOWED_METHODS.has(method)) {
      return rpcError(403, -32601, `method not allowed through the relay: ${method.slice(0, 60)}`);
    }
  }

  const key = process.env.ARKIV_ACCESS_KEY;
  if (!key) return rpcError(503, -32000, "relay not configured on this server");

  let upstream: Response;
  try {
    upstream = await fetch(UPSTREAM, {
      method: "POST",
      headers: { "content-type": "application/json", "X-API-KEY": key },
      body: text,
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return rpcError(502, -32603, "upstream RPC unreachable");
  }

  const out = await upstream.text();
  return new Response(out, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
      ...NO_STORE,
    },
  });
}
