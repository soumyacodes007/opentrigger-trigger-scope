import type { AuditTrail, BlockClock } from "arkiv-triggers";
import type { Hex } from "viem";
import { describeRule, resultText, short, timeOf, toneFor, type Tone } from "./format";
import { toReceiptView, type ReceiptView } from "./receipts";

export type AuditEvent = {
  block: string;
  time: string;
  label: "created" | "claimed" | "fired";
  worker?: string;
  detail: string;
  tone: Tone;
  /** Set for "fired" events, so the screen can open the receipt. */
  receipt?: ReceiptView;
};

export type AuditView = {
  key: string;
  sentence: string;
  name: string;
  status: string;
  statusTone: Tone;
  creator: string;
  worker: string;
  isAnyWorker: boolean;
  deadline: string;
  targetExpiresAt: string;
  claims: { worker: string; until: string }[];
  events: AuditEvent[];
  workers: string[];
};

/** Builds the audit view from a getRule() result. Pure: no network, no React. */
export function buildAudit(trail: AuditTrail, key: string, clock: BlockClock): AuditView {
  const r = trail.rule;

  const events: (AuditEvent & { at: bigint })[] = [
    {
      at: r.createdAt,
      block: r.createdAt.toString(),
      time: timeOf(r.createdAt, clock),
      label: "created",
      detail: `rule written by ${short(r.creator)}`,
      tone: "dim",
    },
  ];
  for (const c of trail.claims) {
    events.push({
      at: c.createdAt,
      block: c.createdAt.toString(),
      time: timeOf(c.createdAt, clock),
      label: "claimed",
      worker: c.worker,
      detail: `lease until block ${c.expiresAt}`,
      tone: "warn",
    });
  }
  for (const rc of trail.receipts) {
    events.push({
      at: rc.firedAt,
      block: rc.firedAt.toString(),
      time: timeOf(rc.firedAt, clock),
      label: "fired",
      worker: rc.worker,
      detail: `${rc.status.toUpperCase()} · ${resultText(rc.result)}`,
      tone: toneFor(rc.status),
      receipt: toReceiptView(rc),
    });
  }
  events.sort((a, b) => (a.at === b.at ? 0 : a.at < b.at ? -1 : 1));

  const workers = [
    ...new Set([...trail.claims.map((c) => c.worker), ...trail.receipts.map((rc) => rc.worker)]),
  ];

  return {
    key,
    sentence: describeRule(r),
    name: r.name ?? "",
    status: trail.status.toUpperCase(),
    statusTone: trail.status === "failed" ? "bad" : trail.status === "fired" ? "ok" : "warn",
    creator: r.creator,
    worker: r.worker === "any" ? "any worker" : (r.worker as Hex),
    isAnyWorker: r.worker === "any",
    deadline:
      trail.deadline !== undefined
        ? `block ${trail.deadline} (${timeOf(trail.deadline, clock, true)})`
        : "-",
    targetExpiresAt:
      trail.targetExpiresAt !== undefined
        ? `block ${trail.targetExpiresAt}`
        : "gone (expired or deleted)",
    claims: trail.claims.map((c) => ({ worker: c.worker, until: `block ${c.expiresAt}` })),
    events: events.map(({ at, ...e }) => {
      void at;
      return e;
    }),
    workers,
  };
}
