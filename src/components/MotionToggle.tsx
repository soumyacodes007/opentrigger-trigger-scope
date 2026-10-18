"use client";

import { MOTION_KEY } from "@/lib/constants";
import { usePref, writePref } from "@/lib/prefs";

/** Cycles AUTO (follow the OS setting) -> OFF (no effects) -> ON (effects) -> AUTO. */
export default function MotionToggle() {
  const pref = usePref(MOTION_KEY);
  const mode = pref === "on" ? "ON" : pref === "off" ? "OFF" : "AUTO";
  const next = pref === null ? "off" : pref === "off" ? "on" : null;
  const nextLabel = next === null ? "auto" : next === "off" ? "off" : "on";

  return (
    <button
      type="button"
      className="crt-btn small"
      onClick={() => writePref(MOTION_KEY, next)}
      aria-label={`Screen effects (scanlines, flicker, cursor blink): ${mode.toLowerCase()}. Switch to ${nextLabel}.`}
    >
      FX: {mode}
    </button>
  );
}
