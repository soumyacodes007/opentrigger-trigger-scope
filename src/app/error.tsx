"use client";

import Box from "@/components/Box";

/** Catches a crash inside a page. Nothing is lost: the data lives on Arkiv, so a retry rebuilds the view. */
export default function PageError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Box label="ERROR">
      <p className="bad">&gt; this page crashed.</p>
      <p className="dim">Nothing is lost. The data lives on Arkiv, so trying again rebuilds the view.</p>
      <button type="button" className="crt-btn" onClick={reset}>
        TRY AGAIN
      </button>
    </Box>
  );
}
