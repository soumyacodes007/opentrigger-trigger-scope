"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { MAX_FOLLOWS } from "@/lib/constants";
import { saveFollows, useFollows } from "@/lib/follows";
import { ADDRESS_RE, short } from "@/lib/format";

/** The creators this browser follows. Saved in localStorage; nothing is sent anywhere. */
export default function FollowManager() {
  const follows = useFollows();
  const id = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onAdd = (e: FormEvent) => {
    e.preventDefault();
    const v = value.trim().toLowerCase();
    if (!ADDRESS_RE.test(v)) {
      setError("Paste a creator wallet address: 0x followed by 40 hex characters.");
      return;
    }
    if (follows.includes(v)) {
      setError("You already follow this creator.");
      return;
    }
    if (follows.length >= MAX_FOLLOWS) {
      setError(`You can follow up to ${MAX_FOLLOWS} creators. Unfollow one first.`);
      return;
    }
    setError(null);
    setValue("");
    saveFollows([...follows, v]);
  };

  return (
    <>
      {follows.length === 0 ? (
        <p className="dim">You follow no creators yet.</p>
      ) : (
        <ul className="follow-list">
          {follows.map((addr) => (
            <li key={addr}>
              <Link href={`/creator/${addr}`}>{short(addr, 10, 6)}</Link>
              <button
                type="button"
                className="crt-btn small"
                aria-label={`Unfollow ${short(addr, 10, 6)}`}
                onClick={() => saveFollows(follows.filter((a) => a !== addr))}
              >
                UNFOLLOW
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={onAdd} className="form-row" noValidate>
        <label htmlFor={id} className="sr-only">
          Creator wallet address to follow
        </label>
        <input
          id={id}
          className="crt-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="0x… creator wallet to follow"
          spellCheck={false}
          autoComplete="off"
          aria-invalid={error ? true : undefined}
        />
        <button className="crt-btn" type="submit">
          FOLLOW
        </button>
      </form>
      {error && (
        <p className="bad" role="alert">
          {error}
        </p>
      )}
      <p className="muted-small">
        {follows.length} of {MAX_FOLLOWS} followed. Each follow is one live connection, so the list is capped.
      </p>
    </>
  );
}
