/** Terminal-style loading line: "> loading…" with a blinking cursor. Static, so it can render anywhere. */
export default function Loading({ label = "loading" }: { label?: string }) {
  return (
    <p className="dim loading" role="status">
      &gt; {label}…<span className="cursor" aria-hidden="true">_</span>
    </p>
  );
}
