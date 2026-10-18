import { useCallback, useEffect, useState } from "react";
import type { Hex } from "viem";
import { makeTriggers } from "./arkiv";
import { classifyError, type ErrorInfo } from "./errors";
import { mergeReceipts, toReceiptView, type ReceiptView } from "./receipts";

export type Socket = "live" | "reconnecting";

export type FeedState = {
  lines: ReceiptView[];
  /** True once the snapshot has come back (or failed). */
  loaded: boolean;
  socket: Socket;
  error: ErrorInfo | null;
};

const EMPTY: FeedState = { lines: [], loaded: false, socket: "reconnecting", error: null };

/**
 * Receipts for each creator: a listReceipts snapshot, then a watch() for live updates.
 * Returns feeds keyed by lowercase creator address. `retry` starts every feed again.
 */
export function useReceiptFeeds(creators: string[]) {
  const [nonce, setNonce] = useState(0);
  const [feeds, setFeeds] = useState<Record<string, FeedState>>({});
  const joined = creators.join(",");

  useEffect(() => {
    if (!joined) return;
    let alive = true;
    const t = makeTriggers();

    const patch = (creator: string, fn: (s: FeedState) => FeedState) => {
      if (!alive) return;
      setFeeds((prev) => ({ ...prev, [creator]: fn(prev[creator] ?? EMPTY) }));
    };

    const stops = joined.split(",").map((c) => {
      const creator = c as Hex;

      t.listReceipts({ creator })
        .then((list) =>
          patch(c, (s) => ({
            ...s,
            loaded: true,
            error: null,
            lines: mergeReceipts(s.lines, list.map(toReceiptView)),
          })),
        )
        .catch((e: unknown) => patch(c, (s) => ({ ...s, loaded: true, error: classifyError(e) })));

      return t.watch({
        creator,
        minIntervalMs: 8000,
        onReceipt: (r) => patch(c, (s) => ({ ...s, lines: mergeReceipts(s.lines, [toReceiptView(r)]) })),
        onStatus: (socket) => patch(c, (s) => ({ ...s, socket })),
        onError: (e) => patch(c, (s) => ({ ...s, error: classifyError(e) })),
      });
    });

    return () => {
      alive = false;
      stops.forEach((stop) => stop());
    };
  }, [joined, nonce]);

  const retry = useCallback(() => {
    setFeeds({});
    setNonce((n) => n + 1);
  }, []);

  return { feeds, retry };
}
