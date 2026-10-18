# Building on the arkiv-triggers SDK: notes for the example apps

Everything an app needs to use `arkiv-triggers@0.1.0` (on npm). The source is in the [OpenTrigger SDK repository](https://github.com/soumyacodes007/arkiv-triggers/tree/main/src) if you need to
check something; this file is accurate for 0.1.0.

## What it is

Database triggers for Arkiv (an Ethereum data layer where every record is an *entity* with attributes, a
payload and an expiry). A **rule** says "when this entity expires (or at this block), do X". Rules are
entities on Arkiv, created by the user's wallet. Open-source **workers** fire them and write a signed
**receipt** entity. Apps never talk to workers: they write rules and read receipts, all on Arkiv.

Network: **Arkiv Tiramisu testnet**, chain id `7738577` (hex `0x7614d1`), about 2 seconds per block,
currency **GLM** (free from https://hub.arkiv.network/faucet). Explorer: https://tiramisu.explorer.arkiv.network

## Install (pin these exact versions)

```bash
npm install arkiv-triggers@0.1.0 @arkiv-network/sdk@0.8.1 viem@2.57.4
```

## Next.js rules (important)

- The SDK talks to the chain from the **browser**. Put every component that uses it behind `'use client'`,
  and create clients inside `useEffect` or event handlers, never at module top level of a server file.
- Block numbers, deadlines and expiries are **`bigint`**. `JSON.stringify` throws on them: convert with
  `String(x)` / `Number(x)` before storing in state you serialise, and never pass bigints from a server
  component to a client component.
- No API keys in client code. A `NEXT_PUBLIC_*` variable is shipped to every visitor. The SDK works with
  no key at all (reads use Arkiv's free anonymous quota).

## Reading (no wallet needed)

```ts
'use client'
import { createTriggers } from 'arkiv-triggers'
import { createPublicClient } from '@arkiv-network/sdk'
import { tiramisu } from '@arkiv-network/sdk/chains'
import { http } from 'viem'

// retryCount: 0 makes a rate-limited read fail in ~1 s instead of silently waiting minutes.
const publicClient = createPublicClient({ chain: tiramisu, transport: http('https://rpc.tiramisu.db-chain.testnet.arkiv.network', { retryCount: 0 }) })
const t = createTriggers({ publicClient, app: 'my-app-name' })

const workers = await t.listWorkers()                 // WorkerInfo[]
const rules = await t.listRules({ creator: address }) // RuleWithStatus[], needs a creator address
const receipts = await t.listReceipts({ creator: address }) // newest first; or { rule: key }
const trail = await t.getRule(ruleKey)                // AuditTrail | undefined
const clock = await t.clock()                         // { block: bigint, timeMs: number, blockSeconds?: number }
const when = await t.toDate(someBlock)                // Date
const block = await t.toBlock(new Date(Date.now() + 10 * 60_000)) // bigint

// Live updates over one WebSocket. Returns a stop function: call it in the effect cleanup.
const stop = t.watch({
  creator: address,             // receipts/rules for this wallet's rules (or `rule: key` for one rule)
  onReceipt: (r) => {},         // a worker fired one of the rules
  onRule: (r) => {},            // a new rule by `creator`
  onHeartbeat: (w) => {},       // a worker's heartbeat appeared or renewed
  onStatus: (s) => {},          // 'live' | 'reconnecting'
  onError: (e) => {},
  minIntervalMs: 8000,          // least time between refreshes; keep it >= 5000 in a browser
})
```

## Writing (needs the user's wallet)

```ts
'use client'
import { createWalletClient } from '@arkiv-network/sdk'
import { tiramisu } from '@arkiv-network/sdk/chains'
import { custom } from 'viem'

const eth = (window as any).ethereum
const [address] = await eth.request({ method: 'eth_requestAccounts' })
try {
  await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x7614d1' }] })
} catch (e: any) {
  if (e?.code === 4902) await eth.request({ method: 'wallet_addEthereumChain', params: [{
    chainId: '0x7614d1', chainName: 'Arkiv Tiramisu', nativeCurrency: { name: 'GLM', symbol: 'GLM', decimals: 18 },
    rpcUrls: ['https://rpc.tiramisu.db-chain.testnet.arkiv.network'], blockExplorerUrls: ['https://tiramisu.explorer.arkiv.network'] }] })
  else throw e
}
const wallet = createWalletClient({ chain: tiramisu, transport: custom(eth), account: address })
const t = createTriggers({ wallet, publicClient, app: 'my-app-name' })

const { key, txHash, warnings } = await t.createRule({
  name: 'Lease reminder',
  trigger: { on: 'expire', target: '0x…64 hex…', offset: 1800n }, // fire 1800 blocks (1 hour) early; offset optional
  // or: trigger: { on: 'block', fireAt: await t.toBlock(date) },
  action: 'webhook',               // 'telegram' | 'webhook' | 'receipt' | 'extend'
  url: 'https://example.com/hook', // webhook only, must be https://
  message: '{rule} fired at {time} for {entity}', // telegram/webhook; placeholders are filled by the worker
  // extendDays: 30,               // extend only: extends the target (it must allow permissionless extension)
  // chat: sealForWorker(chatId, worker.sealKey), // telegram only: NEVER a plain chat id
  worker: 'any',                   // or one worker's address
  retries: 3,
})
await t.createRules([ruleA, ruleB]) // several in one transaction → { keys, txHash, warnings }
await t.deleteRule(key)
```

An `expire` rule's target must exist when the rule is created (the SDK checks and throws `TriggersError`
otherwise). To demo, create a short-lived entity first:

```ts
import { ExpirationTime, str } from '@arkiv-network/sdk'
const { entityKey } = await wallet.createEntity({
  payload: new TextEncoder().encode('demo'),
  contentType: 'text/plain',
  attributes: { type: str('myapp.thing'), app: str('my-app-name') }, // attribute names are lowercase
  expires: ExpirationTime.fromSeconds(180),
  flags: { permissionlessExtension: true }, // lets workers run the 'extend' action on it
})
```

## Types (from `arkiv-triggers`)

```ts
type Hex = `0x${string}`
type Rule = { key: Hex; creator: Hex; owner: Hex; createdAt: bigint; expiresAt: bigint;
  trigger: { on: 'expire'; target: Hex; offset?: bigint } | { on: 'block'; fireAt: bigint; offset?: bigint };
  action: 'telegram' | 'webhook' | 'receipt' | 'extend'; name?: string; message?: string; url?: string;
  chat?: string; extendDays?: number; worker: 'any' | Hex; retries: number }
type RuleWithStatus = Rule & { status: 'active' | 'fired' | 'failed'; deadline?: bigint; receipts: Receipt[] }
type Receipt = { key: Hex; rule: Hex; ruleCreator: Hex; action: string; status: 'ok' | 'failed' | 'skipped';
  deadline: bigint; firedAt: bigint; reason: string; worker: Hex; createdAt: bigint;
  result: { code?: number; messageId?: number; latencyMs?: number; attempts?: number; error?: string; newExpiresAt?: string } }
type WorkerInfo = { key: Hex; worker: Hex; online: boolean; mode: 'any' | 'own'; lastBlock: bigint;
  actions: string[]; version: string; sealKey: Hex; operator?: Hex; operatorVerified: boolean; expiresAt: bigint }
type AuditTrail = { rule: Rule; status: 'active' | 'fired' | 'failed'; deadline?: bigint;
  targetExpiresAt?: bigint; claims: { worker: Hex; expiresAt: bigint }[]; receipts: Receipt[] }
```

Other exports: `ACTIONS` (label, icon, description, fields per action), `TEMPLATES` (ready-made rules),
`sealForWorker(text, workerSealKey)`, `validateRule(input)` (throws `SchemaError` with a readable message),
`ruleWarnings(input)`, `fillMessage(message, { entity, time, rule })`, `TriggersError`, `QueryTimeoutError`,
`DEFAULT_RPC_URL`, `DEFAULT_WS_URL`, `TYPES` (`trg.rule`, `trg.claim`, `trg.receipt`, `trg.worker`).

Server side only (a Next.js route handler, never in the browser):
`verifyWebhook(rawBody: string, signature: string | null, trustedWorkers: Hex[])` →
`{ ok: true, worker } | { ok: false, reason }`; parse the body yourself with `JSON.parse(rawBody)` after it verifies. The signature is the `x-trg-sig` header
(`WEBHOOK_HEADERS.signature`); `x-trg-event` is stable across retries, for de-duplication.

## Safety rules (non-negotiable)

- Rules are public. Never put a secret, an API key or personal data in a rule (not in `url`, `message`, `name`).
- A Telegram chat id only ever goes into a rule sealed with `sealForWorker` to that worker's `sealKey`.
- Nothing runs code from a rule; workers only run the four actions above.
