"use client";

import Link from "next/link";
import { useNetwork } from "./NetworkProvider";
import MotionToggle from "./MotionToggle";
import SearchBox from "./SearchBox";

/** Top bar on every page: brand, search, live network counters. */
export default function SiteHeader() {
  const { clock, clockError, workers, workersError, socket } = useNetwork();

  const workersText =
    workers !== undefined
      ? `${workers.filter((w) => w.online).length} online / ${workers.length}`
      : workersError
        ? "unknown"
        : "…";
  const blockText = clock ? clock.block.toString() : clockError ? "paused" : "…";

  return (
    <header className="site-header">
      <div className="site-top">
        <Link href="/" className="brand">
          TRIGGER SCOPE<span className="cursor" aria-hidden="true">_</span>
        </Link>
        <nav aria-label="Main" className="main-nav">
          <Link href="/">HOME</Link>
          <Link href="/workers">WORKERS</Link>
        </nav>
        <MotionToggle />
      </div>
      <SearchBox />
      <div className="net-bar" role="group" aria-label="Network status">
        <span>
          workers: <span className={workers?.some((w) => w.online) ? "" : "dim"}>{workersText}</span>
        </span>
        <span>
          block: <span className="tick">{blockText}</span>
          {clockError?.kind === "rate" && <span className="warn"> (rate limited, retrying)</span>}
        </span>
        <span>
          socket: <span className={socket === "live" ? "" : "warn"}>{socket}</span>
        </span>
      </div>
    </header>
  );
}
