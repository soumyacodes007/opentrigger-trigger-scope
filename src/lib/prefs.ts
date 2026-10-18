import { useSyncExternalStore } from "react";

const EVENT = "trigger-scope:pref";

/** localStorage read. Returns null if storage is blocked (private mode, disabled site data). */
export function readPref(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** localStorage write, then tell every open hook on this tab. Blocked storage just means "not saved". */
export function writePref(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable: the setting lasts for this page view only.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

/** A localStorage value that stays in sync across components and tabs. Server render sees null. */
export function usePref(key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => readPref(key),
    () => null,
  );
}
