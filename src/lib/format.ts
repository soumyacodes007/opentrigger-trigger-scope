import { toDate, type BlockClock, type Rule } from "arkiv-triggers";
import { EXPLORER } from "./constants";

export const RULE_KEY_RE = /^0x[0-9a-fA-F]{64}$/;
export const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

/** The block clock from t.clock(). */
export type Clock = BlockClock;

export type Tone = "ok" | "warn" | "bad" | "dim";

export function short(hex: string, head = 6, tail = 4): string {
  return hex.length > head + tail + 2 ? `${hex.slice(0, head)}…${hex.slice(-tail)}` : hex;
}

export function explorerAddress(addr: string): string {
  return `${EXPLORER}/address/${addr}`;
}

export function toneClass(tone: Tone): string {
  return tone === "ok" ? "" : tone;
}

/** A block as local time. Without a clock it shows the block number; block 0 means "not set". */
export function timeOf(block: bigint, clock?: Clock, withDate = false): string {
  if (block === BigInt(0)) return "-";
  if (!clock) return `block ${block}`;
  const d = toDate(block, clock);
  return withDate ? d.toLocaleString() : d.toLocaleTimeString();
}

export function describeRule(rule: Rule): string {
  const when =
    rule.trigger.on === "expire"
      ? `When ${short(rule.trigger.target)} expires${
          rule.trigger.offset ? ` (${rule.trigger.offset} blocks early)` : ""
        }`
      : `At block ${rule.trigger.fireAt}`;
  return `${when} → ${rule.action}`;
}

export function resultText(result: {
  code?: number;
  messageId?: number;
  latencyMs?: number;
  attempts?: number;
  error?: string;
  newExpiresAt?: string;
}): string {
  const parts: string[] = [];
  if (result.code !== undefined) parts.push(`HTTP ${result.code}`);
  if (result.messageId !== undefined) parts.push(`msg ${result.messageId}`);
  if (result.latencyMs !== undefined) parts.push(`${result.latencyMs}ms`);
  if (result.attempts !== undefined) parts.push(`${result.attempts} attempt(s)`);
  if (result.newExpiresAt) parts.push(`expires ${result.newExpiresAt}`);
  if (result.error) parts.push(`error: ${result.error}`);
  return parts.join(" · ") || "-";
}

export function toneFor(status: string): Tone {
  if (status === "ok") return "ok";
  if (status === "skipped") return "warn";
  return "bad";
}
