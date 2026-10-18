export type ErrorKind = "rate" | "timeout" | "network" | "other";

/** A plain-language error for the screen. `id` changes on every new error, so React can reset it. */
export type ErrorInfo = {
  id: number;
  kind: ErrorKind;
  title: string;
  detail: string;
  /** Seconds until an automatic retry. 0 means no automatic retry. */
  retryInSec: number;
};

let seq = 0;

export function isRateLimited(e: unknown): boolean {
  const status = (e as { status?: unknown } | null)?.status;
  const msg = e instanceof Error ? e.message : String(e);
  return status === 429 || /429|rate.?limit|too many requests|quota/i.test(msg);
}

export function classifyError(e: unknown): ErrorInfo {
  const msg = e instanceof Error ? e.message : String(e);
  if (isRateLimited(e)) {
    return {
      id: ++seq,
      kind: "rate",
      title: "Arkiv is rate-limiting reads from this browser",
      detail: "The anonymous read quota is used up for now. This page retries on its own.",
      retryInSec: 30,
    };
  }
  if (/timed? ?out|timeout|aborted/i.test(msg)) {
    return {
      id: ++seq,
      kind: "timeout",
      title: "Arkiv took too long to answer",
      detail: "The network may be slow. This page retries on its own.",
      retryInSec: 10,
    };
  }
  if (/failed to fetch|networkerror|network request failed|fetch failed|load failed|websocket/i.test(msg)) {
    return {
      id: ++seq,
      kind: "network",
      title: "Could not reach Arkiv",
      detail: "Check your connection. This page retries on its own.",
      retryInSec: 15,
    };
  }
  return {
    id: ++seq,
    kind: "other",
    title: "Something went wrong reading Arkiv",
    detail: msg.slice(0, 140) || "unknown error",
    retryInSec: 0,
  };
}
