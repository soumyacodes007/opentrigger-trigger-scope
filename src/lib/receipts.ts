import type { Receipt } from "arkiv-triggers";
import { toneFor, type Tone } from "./format";

export type ReceiptResult = {
  code?: number;
  messageId?: number;
  latencyMs?: number;
  attempts?: number;
  error?: string;
  newExpiresAt?: string;
};

/** A receipt as plain strings and numbers, safe for React state and keys. Block numbers are strings. */
export type ReceiptView = {
  key: string;
  rule: string;
  ruleCreator: string;
  worker: string;
  action: string;
  status: string;
  tone: Tone;
  reason: string;
  deadline: string;
  firedAt: string;
  createdAt: string;
  result: ReceiptResult;
};

export function toReceiptView(r: Receipt): ReceiptView {
  return {
    key: r.key,
    rule: r.rule,
    ruleCreator: r.ruleCreator,
    worker: r.worker,
    action: r.action,
    status: r.status.toUpperCase(),
    tone: toneFor(r.status),
    reason: r.reason,
    deadline: r.deadline.toString(),
    firedAt: r.firedAt.toString(),
    createdAt: r.createdAt.toString(),
    result: { ...r.result },
  };
}

/** Blocks between the deadline and the fired block. Positive is late, negative is early. */
export function blocksLate(v: ReceiptView): number {
  return Number(BigInt(v.firedAt) - BigInt(v.deadline));
}

export function lateText(n: number): string {
  if (n === 0) return "on time (fired in its deadline block)";
  return n > 0 ? `${n} block${n === 1 ? "" : "s"} late` : `${-n} block${n === -1 ? "" : "s"} early`;
}

/** Merges receipts by key, newest fired first, and keeps the list bounded. */
export function mergeReceipts(prev: ReceiptView[], incoming: ReceiptView[], max = 200): ReceiptView[] {
  const byKey = new Map<string, ReceiptView>();
  for (const r of prev) byKey.set(r.key, r);
  for (const r of incoming) byKey.set(r.key, r);
  return [...byKey.values()]
    .sort((a, b) => {
      const fa = BigInt(a.firedAt);
      const fb = BigInt(b.firedAt);
      return fa === fb ? 0 : fa > fb ? -1 : 1;
    })
    .slice(0, max);
}
