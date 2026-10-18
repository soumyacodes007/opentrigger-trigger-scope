import { useMemo } from "react";
import { FOLLOWS_KEY, MAX_FOLLOWS } from "./constants";
import { ADDRESS_RE } from "./format";
import { usePref, writePref } from "./prefs";

/** Parses the saved follow list. Anything malformed is dropped, so a bad value cannot break the page. */
export function parseFollows(raw: string | null): string[] {
  try {
    const value: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(value)) return [];
    const addrs = value
      .filter((v): v is string => typeof v === "string" && ADDRESS_RE.test(v))
      .map((v) => v.toLowerCase());
    return [...new Set(addrs)].slice(0, MAX_FOLLOWS);
  } catch {
    return [];
  }
}

/** Creators this browser follows, saved in localStorage. Lowercase addresses. */
export function useFollows(): string[] {
  const raw = usePref(FOLLOWS_KEY);
  return useMemo(() => parseFollows(raw), [raw]);
}

export function saveFollows(list: string[]): void {
  writePref(FOLLOWS_KEY, JSON.stringify([...new Set(list)].slice(0, MAX_FOLLOWS)));
}
