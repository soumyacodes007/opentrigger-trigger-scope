"use client";

import { useMemo } from "react";
import { useNetwork } from "./NetworkProvider";
import { explorerAddress, resultText, short, timeOf, toneClass } from "@/lib/format";
import type { ReceiptView } from "@/lib/receipts";

/** Receipts as log lines. Each line opens the receipt drawer. */
export function ReceiptList({
  lines,
  showCreator,
  onSelect,
}: {
  lines: ReceiptView[];
  showCreator: boolean;
  onSelect: (r: ReceiptView) => void;
}) {
  const { clock } = useNetwork();
  return (
    <div className="feed" role="log" aria-label="Receipts, newest first">
      {lines.map((l) => {
        const when = timeOf(BigInt(l.firedAt), clock);
        return (
          <button
            type="button"
            className="feed-row"
            key={l.key}
            onClick={() => onSelect(l)}
            aria-label={`${l.status} ${l.action} for rule ${short(l.rule)} at ${when}. Open details.`}
          >
            <span className="dim">{when}</span>
            <span className={toneClass(l.tone) || undefined}>{l.status}</span>
            <span>{l.action}</span>
            <span>rule {short(l.rule)}</span>
            {showCreator && <span>by {short(l.ruleCreator, 6, 4)}</span>}
            <span>{resultText(l.result)}</span>
            <span className="dim">worker {short(l.worker)}</span>
          </button>
        );
      })}
    </div>
  );
}

/** How many receipts each worker wrote in the feed on screen. Counts what is seen here, not all history. */
export function WorkerStats({ lines }: { lines: ReceiptView[] }) {
  const rows = useMemo(() => {
    const byWorker = new Map<string, { seen: number; ok: number; other: number }>();
    for (const l of lines) {
      const row = byWorker.get(l.worker) ?? { seen: 0, ok: 0, other: 0 };
      row.seen += 1;
      if (l.status === "OK") row.ok += 1;
      else row.other += 1;
      byWorker.set(l.worker, row);
    }
    return [...byWorker.entries()].sort((a, b) => b[1].seen - a[1].seen);
  }, [lines]);

  if (rows.length === 0) return null;

  return (
    <div className="worker-stats">
      <h3 className="sub-title">[ PER WORKER ]</h3>
      <p className="muted-small">receipts seen in this feed</p>
      {rows.map(([worker, s]) => (
        <div className="row" key={worker}>
          <a href={explorerAddress(worker)} target="_blank" rel="noopener noreferrer">
            {short(worker, 8, 6)}
          </a>
          <span>{s.seen} seen</span>
          <span>{s.ok} ok</span>
          <span className={s.other > 0 ? "warn" : "dim"}>{s.other} failed or skipped</span>
        </div>
      ))}
    </div>
  );
}
