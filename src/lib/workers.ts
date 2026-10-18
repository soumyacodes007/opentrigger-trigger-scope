import type { WorkerInfo } from "arkiv-triggers";

/** One row per worker address, online first, then by address so the order is stable. */
export function sortWorkers(list: WorkerInfo[]): WorkerInfo[] {
  const byWorker = new Map<string, WorkerInfo>();
  for (const w of list) if (!byWorker.has(w.worker)) byWorker.set(w.worker, w);
  return [...byWorker.values()].sort((a, b) =>
    a.online === b.online ? a.worker.localeCompare(b.worker) : a.online ? -1 : 1,
  );
}

export function upsertWorker(list: WorkerInfo[], w: WorkerInfo): WorkerInfo[] {
  return sortWorkers([...list.filter((p) => p.worker !== w.worker), w]);
}
