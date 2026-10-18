"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { BlockClock, WorkerInfo } from "arkiv-triggers";
import { makeTriggers } from "@/lib/arkiv";
import { classifyError, type ErrorInfo } from "@/lib/errors";
import { sortWorkers, upsertWorker } from "@/lib/workers";

export type Socket = "live" | "reconnecting";

/** Shared network state: one clock poll, one worker list and one heartbeat socket for the whole site. */
export type NetworkState = {
  clock: BlockClock | undefined;
  clockError: ErrorInfo | null;
  /** undefined until the first successful load. */
  workers: WorkerInfo[] | undefined;
  workersError: ErrorInfo | null;
  socket: Socket;
  refreshWorkers: () => void;
};

const NetworkContext = createContext<NetworkState | null>(null);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [clock, setClock] = useState<BlockClock>();
  const [clockError, setClockError] = useState<ErrorInfo | null>(null);
  const [workers, setWorkers] = useState<WorkerInfo[]>();
  const [workersError, setWorkersError] = useState<ErrorInfo | null>(null);
  const [socket, setSocket] = useState<Socket>("reconnecting");
  const reloadRef = useRef<() => void>(() => {});

  // Block counter: read the chain's clock every 30 s (slower after a rate limit, paused while the tab is
  // hidden) and count blocks locally in between, one every 2 s. Reads cost quota; counting does not.
  useEffect(() => {
    let alive = true;
    const t = makeTriggers();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let delay = 30_000;
    let base: BlockClock | undefined;

    const tick = async () => {
      if (!alive) return;
      if (document.hidden) {
        timer = setTimeout(tick, 5000);
        return;
      }
      try {
        base = await t.clock();
        if (!alive) return;
        setClock(base);
        setClockError(null);
        delay = 30_000;
      } catch (e) {
        if (!alive) return;
        const info = classifyError(e);
        setClockError(info);
        delay = info.kind === "rate" ? 60_000 : 15_000;
      }
      if (alive) timer = setTimeout(tick, delay);
    };
    const count = setInterval(() => {
      if (!base) return;
      const ms = (base.blockSeconds ?? 2) * 1000;
      const n = Math.max(0, Math.floor((Date.now() - base.timeMs) / ms));
      setClock({ ...base, block: base.block + BigInt(n), timeMs: base.timeMs + n * ms });
    }, 2000);

    void tick();
    return () => {
      alive = false;
      clearTimeout(timer);
      clearInterval(count);
    };
  }, []);

  // Workers: listWorkers every 30 s, and heartbeats over one WebSocket in between.
  useEffect(() => {
    let alive = true;
    const t = makeTriggers();

    const load = async () => {
      try {
        const list = await t.listWorkers();
        if (!alive) return;
        setWorkers(sortWorkers(list));
        setWorkersError(null);
      } catch (e) {
        if (alive) setWorkersError(classifyError(e));
      }
    };

    reloadRef.current = () => void load();
    void load();
    const timer = setInterval(() => void load(), 30_000);

    const stop = t.watch({
      minIntervalMs: 8000,
      onHeartbeat: (w) => {
        if (alive) setWorkers((prev) => upsertWorker(prev ?? [], w));
      },
      onStatus: (s) => {
        if (alive) setSocket(s);
      },
      onError: (e) => {
        if (alive) setWorkersError(classifyError(e));
      },
    });

    return () => {
      alive = false;
      clearInterval(timer);
      stop();
    };
  }, []);

  const value: NetworkState = {
    clock,
    clockError,
    workers,
    workersError,
    socket,
    refreshWorkers: () => reloadRef.current(),
  };

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetwork(): NetworkState {
  const value = useContext(NetworkContext);
  if (!value) throw new Error("useNetwork must be used inside NetworkProvider");
  return value;
}
