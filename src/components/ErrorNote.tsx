"use client";

import { useEffect, useRef, useState } from "react";
import type { ErrorInfo } from "@/lib/errors";

/**
 * A plain-language error with a countdown to an automatic retry, and a RETRY NOW button.
 * Render it with key={error.id} so a new error starts a new countdown.
 */
export default function ErrorNote({ error, onRetry }: { error: ErrorInfo; onRetry?: () => void }) {
  const [left, setLeft] = useState(error.retryInSec);
  const retryRef = useRef(onRetry);

  useEffect(() => {
    retryRef.current = onRetry;
  }, [onRetry]);

  useEffect(() => {
    if (error.retryInSec <= 0) return;
    let n = error.retryInSec;
    const id = setInterval(() => {
      n -= 1;
      setLeft(n);
      if (n <= 0) {
        clearInterval(id);
        retryRef.current?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [error.id, error.retryInSec]);

  return (
    <div className="error-note" role="alert">
      <p className="warn">! {error.title}</p>
      <p className="dim">{error.detail}</p>
      {error.retryInSec > 0 && left > 0 && <p>retrying in {left}s</p>}
      {onRetry && (
        <button className="crt-btn" type="button" onClick={onRetry}>
          RETRY NOW
        </button>
      )}
    </div>
  );
}
