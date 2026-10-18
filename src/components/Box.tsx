import type { ReactNode } from "react";

/** A green 1px frame with a label like [ WORKERS ] on its top edge. */
export default function Box({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="box">
      <h2 className="box-title">[ {label} ]</h2>
      {children}
    </section>
  );
}
