"use client";

import Link from "next/link";
import { useNetwork } from "./NetworkProvider";
import Loading from "./Loading";
import ErrorNote from "./ErrorNote";
import { explorerAddress, short } from "@/lib/format";

/** Every worker seen on Arkiv. `limit` shows the first N with a link to the full list. */
export default function WorkersTable({ limit }: { limit?: number }) {
  const { workers, workersError, refreshWorkers } = useNetwork();

  if (workers === undefined) {
    return workersError ? (
      <ErrorNote key={workersError.id} error={workersError} onRetry={refreshWorkers} />
    ) : (
      <Loading label="reading workers" />
    );
  }

  if (workers.length === 0) {
    return (
      <>
        {workersError && <ErrorNote key={workersError.id} error={workersError} onRetry={refreshWorkers} />}
        <p className="dim">
          No worker has announced itself on Arkiv yet. Workers send a heartbeat every few minutes. Run one to
          be the first (see RUN YOUR OWN WORKER).
        </p>
      </>
    );
  }

  const online = workers.filter((w) => w.online).length;
  const shown = limit ? workers.slice(0, limit) : workers;

  return (
    <>
      <p className="muted-small">
        {online} online / {workers.length} seen · refreshed every 30 s. The version is the open-source release
        each worker runs.
      </p>
      {workersError && <ErrorNote key={workersError.id} error={workersError} onRetry={refreshWorkers} />}
      <div className="table-wrap">
        <table className="ws-table">
          <caption className="sr-only">Workers seen on OpenTrigger</caption>
          <thead>
            <tr>
              <th scope="col">status</th>
              <th scope="col">worker</th>
              <th scope="col">mode</th>
              <th scope="col">last block</th>
              <th scope="col">actions</th>
              <th scope="col">version</th>
              <th scope="col">operator</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((w) => (
              <tr key={w.worker}>
                <td data-label="status" className={w.online ? "" : "dim"}>
                  {w.online ? "● online" : "○ offline"}
                </td>
                <td data-label="worker">
                  <a href={explorerAddress(w.worker)} target="_blank" rel="noopener noreferrer">
                    {short(w.worker, 8, 6)}
                    <span className="sr-only"> (opens the explorer)</span>
                  </a>
                </td>
                <td data-label="mode">{w.mode}</td>
                <td data-label="last block">{w.lastBlock.toString()}</td>
                <td data-label="actions">{w.actions.join(", ") || "none"}</td>
                <td data-label="version" className="dim">
                  {w.version}
                </td>
                <td data-label="operator" className={w.operatorVerified ? "" : "dim"}>
                  {w.operatorVerified ? "verified" : "unverified"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {limit && workers.length > limit && (
        <p className="muted-small">
          <Link href="/workers">view all {workers.length} workers</Link>
        </p>
      )}
    </>
  );
}
