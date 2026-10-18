"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useNetwork } from "./NetworkProvider";
import { explorerAddress, short, timeOf, toneClass } from "@/lib/format";
import { blocksLate, lateText, type ReceiptView } from "@/lib/receipts";

/** Every field of one receipt, in a side panel. Escape or the backdrop closes it. */
export default function ReceiptDrawer({
  receipt,
  onClose,
}: {
  receipt: ReceiptView | null;
  onClose: () => void;
}) {
  const { clock } = useNetwork();
  const closeRef = useRef<HTMLButtonElement>(null);
  const closeFnRef = useRef(onClose);
  const receiptKey = receipt?.key;

  useEffect(() => {
    closeFnRef.current = onClose;
  }, [onClose]);

  // Focus the close button when a receipt opens, and restore focus to the page on close.
  useEffect(() => {
    if (!receiptKey) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFnRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [receiptKey]);

  if (!receipt) return null;

  const late = blocksLate(receipt);
  const r = receipt.result;
  const resultRows: [string, string][] = [];
  if (r.code !== undefined) resultRows.push(["HTTP code", String(r.code)]);
  if (r.messageId !== undefined) resultRows.push(["message id", String(r.messageId)]);
  if (r.latencyMs !== undefined) resultRows.push(["latency", `${r.latencyMs} ms`]);
  if (r.attempts !== undefined) resultRows.push(["attempts", String(r.attempts)]);
  if (r.newExpiresAt) resultRows.push(["new expiry", r.newExpiresAt]);
  if (r.error) resultRows.push(["error", r.error]);

  const firedWhen = timeOf(BigInt(receipt.firedAt), clock, true);
  const deadlineWhen = timeOf(BigInt(receipt.deadline), clock, true);
  const createdWhen = timeOf(BigInt(receipt.createdAt), clock, true);

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        <div className="drawer-head">
          <h2 id="drawer-title" className="sub-title">
            [ RECEIPT ]
          </h2>
          <button ref={closeRef} type="button" className="crt-btn" onClick={onClose}>
            CLOSE
          </button>
        </div>

        <dl className="kv">
          <dt>status</dt>
          <dd className={toneClass(receipt.tone) || undefined}>{receipt.status}</dd>
          <dt>action</dt>
          <dd>{receipt.action}</dd>
          <dt>reason</dt>
          <dd>{receipt.reason || "-"}</dd>
          <dt>rule</dt>
          <dd>
            <Link href={`/rule/${receipt.rule}`}>{receipt.rule}</Link>
          </dd>
          <dt>rule creator</dt>
          <dd>
            <a href={explorerAddress(receipt.ruleCreator)} target="_blank" rel="noopener noreferrer">
              {receipt.ruleCreator}
            </a>
          </dd>
          <dt>worker</dt>
          <dd>
            <a href={explorerAddress(receipt.worker)} target="_blank" rel="noopener noreferrer">
              {receipt.worker}
            </a>
            <span className="muted-small"> (the receipt&apos;s creator, set by Arkiv)</span>
          </dd>
          <dt>created</dt>
          <dd>
            block {receipt.createdAt} · {createdWhen}
          </dd>
          <dt>deadline</dt>
          <dd>
            block {receipt.deadline} · {deadlineWhen}
          </dd>
          <dt>fired at</dt>
          <dd>
            block {receipt.firedAt} · {firedWhen}
          </dd>
          <dt>timing</dt>
          <dd className={late > 0 ? "warn" : ""}>{lateText(late)}</dd>
          <dt>receipt key</dt>
          <dd>
            <span title={receipt.key}>{short(receipt.key, 12, 8)}</span>
          </dd>
        </dl>

        <h3 className="sub-title">[ RESULT ]</h3>
        {resultRows.length === 0 ? (
          <p className="dim">no result fields.</p>
        ) : (
          <dl className="kv">
            {resultRows.map(([k, v]) => (
              <div key={k} className="kv-pair">
                <dt>{k}</dt>
                <dd className={k === "error" ? "bad" : undefined}>{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </aside>
    </>
  );
}
