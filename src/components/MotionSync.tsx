"use client";

import { useEffect } from "react";
import { MOTION_KEY } from "@/lib/constants";
import { usePref } from "@/lib/prefs";

/**
 * Sets <html data-motion> to "reduced" or "full". The saved choice wins. With no choice saved,
 * the OS setting prefers-reduced-motion decides. CSS turns off the flicker, the cursor blink and the scanlines.
 */
export default function MotionSync() {
  const pref = usePref(MOTION_KEY);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      const reduced = pref === "off" || (pref !== "on" && mq.matches);
      document.documentElement.dataset.motion = reduced ? "reduced" : "full";
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [pref]);

  return null;
}
