"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Hex } from "viem";
import Box from "./Box";
import Loading from "./Loading";
import ErrorNote from "./ErrorNote";
import ReceiptDrawer from "./ReceiptDrawer";
import { makeTriggers } from "@/lib/arkiv";
import { buildAudit, type AuditView } from "@/lib/audit";
import { classifyError, type ErrorInfo } from "@/lib/errors";
import { RULE_KEY_RE, explorerAddress, short, toneClass } from "@/lib/format";
import type { ReceiptView } from "@/lib/receipts";

type Outcome =
  | { kind: "ok"; view: AuditView }
  | { kind: "missing" }
  | { kind: "error"; error: ErrorInfo };

/** The audit page for one rule key: the rule as a sentence, its claims, its timeline and a verify box. */
export default function RuleView({ ruleKey }: { ruleKey: string }) {
  const key = ruleKey.toLowerCase();
  const valid = RULE_KEY_RE.test(key);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; attempt: number; outcome: Outcome } | null>(null);
  const [selected, setSelected] = useState<ReceiptView | null>(null);

  useEffect(() => {
    if (!valid) return;
    let alive = true;
    const t = makeTriggers();
    Promise.all([t.getRule(key as Hex), t.clock()])
      .then(([trail, clock]) => {
        if (!alive) return;
        const outcome: Outcome = trail
          ? { kind: "ok", view: buildAudit(trail, key, clock) }
          : { kind: "missing" };
        setResult({ key, attempt, outcome });
      })
      .catch((e: unknown) => {
        if (alive) setResult({ key, attempt, outcome: { kind: "error", error: classifyError(e) } });
      });
    return () => {
      alive = false;
    };
  }, [key, valid, attempt]);

  if (!valid) {
    return (
      <Box label="NOT A RULE KEY">
        <p>
          A rule key is 0x followed by 64 hex characters. If you have a creator address instead, search for it
          or open <Link href={`/creator/${key}`}>its creator page</Link>.
        </p>
        <p>
          <Link href="/">back to the scope</Link>
        </p>
      </Box>
    );
  }

  const current = result && result.key === key && result.attempt === attempt ? result.outcome : null;

  if (!current) return <Loading label="reading rule from Arkiv" />;

  if (current.kind === "error") {
    return (
      <ErrorNote
        key={current.error.id}
        error={current.error}
        onRetry={() => setAttempt((a) => a + 1)}
      />
    );
  }

  if (current.kind === "missing") {
    return (
      <Box label="NOT FOUND">
        <p>No rule exists at this key on Tiramisu.</p>
        <p className="dim">
          Check the key, and that you are looking at the right network. Rules are only visible where they were
          written.
        </p>
        <p>
          <Link href="/">back to the scope</Link>
        </p>
      </Box>
    );
  }

  const view = current.view;

  return (
    <>
      <Box label="RULE">
        <p className="sentence">{view.sentence}</p>
        {view.name && <p className="dim">name: {view.name}</p>}
        <div className="row">
          <span className={toneClass(view.statusTone) || undefined}>STATUS {view.status}</span>
          <span>deadline: {view.deadline}</span>
          <span>target expires: {view.targetExpiresAt}</span>
        </div>
        <div className="row">
          <span title={view.key}>rule {short(view.key, 10, 6)}</span>
          <span>
            creator{" "}
            <a href={explorerAddress(view.creator)} target="_blank" rel="noopener noreferrer">
              {short(view.creator, 8, 6)}
            </a>{" "}
            · <Link href={`/creator/${view.creator}`}>follow this creator</Link>
          </span>
          <span>
            worker:{" "}
            {view.isAnyWorker ? (
              view.worker
            ) : (
              <a href={explorerAddress(view.worker)} target="_blank" rel="noopener noreferrer">
                {short(view.worker, 8, 6)}
              </a>
            )}
          </span>
        </div>
      </Box>

      <Box label="CLAIMS AND TIMELINE">
        <h3 className="sub-title">[ LIVE CLAIMS ]</h3>
        {view.claims.length === 0 ? (
          <p className="dim">no live claims. A claim is a 60-second lease and drops out when it lapses.</p>
        ) : (
          view.claims.map((c) => (
            <div className="row" key={`${c.worker}-${c.until}`}>
              <a href={explorerAddress(c.worker)} target="_blank" rel="noopener noreferrer">
                {short(c.worker, 8, 6)}
              </a>
              <span className="dim">lease until {c.until}</span>
            </div>
          ))
        )}

        <h3 className="sub-title">[ TIMELINE ]</h3>
        <ol className="timeline">
          {view.events.map((ev, i) => (
            <li key={`${ev.label}-${ev.block}-${i}`}>
              <span className="dim">{ev.time}</span>{" "}
              <span className={toneClass(ev.tone) || undefined}>{ev.label.toUpperCase()}</span>{" "}
              {ev.worker && (
                <a href={explorerAddress(ev.worker)} target="_blank" rel="noopener noreferrer">
                  {short(ev.worker, 8, 6)}
                </a>
              )}{" "}
              {ev.receipt ? (
                <button type="button" className="link-btn" onClick={() => setSelected(ev.receipt ?? null)}>
                  {ev.detail} (details)
                </button>
              ) : (
                <span className="dim">{ev.detail}</span>
              )}
            </li>
          ))}
        </ol>
      </Box>

      <section className="box">
        <h2 className="box-title">[ VERIFY ]</h2>
        <p>
          Everything on this screen was read from Arkiv by this page, in your browser. There is no backend. Each
          receipt&apos;s worker is the receipt entity&apos;s creator, as recorded by Arkiv itself, not a name the
          worker writes into its own payload. Check it yourself on the explorer:
        </p>
        <ul>
          <li>
            rule creator:{" "}
            <a href={explorerAddress(view.creator)} target="_blank" rel="noopener noreferrer">
              {view.creator}
            </a>
          </li>
          {view.workers.map((w) => (
            <li key={w}>
              claimed or fired by:{" "}
              <a href={explorerAddress(w)} target="_blank" rel="noopener noreferrer">
                {w}
              </a>
            </li>
          ))}
          {view.workers.length === 0 && <li className="dim">no worker has claimed or fired this rule yet.</li>}
        </ul>
      </section>

      <ReceiptDrawer receipt={selected} onClose={() => setSelected(null)} />
    </>
  );
}
