"use client";

import { useMemo, useState } from "react";
import Loading from "./Loading";
import ErrorNote from "./ErrorNote";
import ReceiptDrawer from "./ReceiptDrawer";
import { ReceiptList, WorkerStats } from "./ReceiptList";
import { useReceiptFeeds } from "@/lib/feeds";
import { mergeReceipts, type ReceiptView } from "@/lib/receipts";

/** The live receipt feed for one or more creators: snapshot, live updates, per-worker counts, drawer. */
export default function FeedPanel({ creators, showCreator }: { creators: string[]; showCreator: boolean }) {
  const { feeds, retry } = useReceiptFeeds(creators);
  const [selected, setSelected] = useState<ReceiptView | null>(null);

  const lines = useMemo(
    () => creators.reduce<ReceiptView[]>((acc, c) => mergeReceipts(acc, feeds[c]?.lines ?? []), []),
    [creators, feeds],
  );
  const loaded = creators.every((c) => feeds[c]?.loaded);
  const socket = creators.every((c) => feeds[c]?.socket === "live") ? "live" : "reconnecting";
  const error = creators.map((c) => feeds[c]?.error).find((e) => e != null) ?? null;

  if (creators.length === 0) return null;

  return (
    <>
      <p className="muted-small">
        socket <span className={socket === "live" ? "" : "warn"}>{socket}</span> · following {creators.length} ·{" "}
        {lines.length} receipt{lines.length === 1 ? "" : "s"} in view
      </p>

      {error && <ErrorNote key={error.id} error={error} onRetry={retry} />}

      {!loaded && !error && <Loading label="reading receipts" />}

      {loaded && lines.length === 0 && !error && (
        <p className="dim">
          No receipts yet. A receipt appears here when a worker fires one of this creator&apos;s rules.
        </p>
      )}

      {lines.length > 0 && (
        <>
          <ReceiptList lines={lines} showCreator={showCreator} onSelect={setSelected} />
          <WorkerStats lines={lines} />
        </>
      )}

      <ReceiptDrawer receipt={selected} onClose={() => setSelected(null)} />
    </>
  );
}
