"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ADDRESS_RE, RULE_KEY_RE } from "@/lib/format";

/** Accepts a rule key (audit page) or a creator address (creator feed) and routes to the right page. */
export default function SearchBox() {
  const router = useRouter();
  const id = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const v = value.trim().toLowerCase();
    if (RULE_KEY_RE.test(v)) {
      setError(null);
      setValue("");
      router.push(`/rule/${v}`);
    } else if (ADDRESS_RE.test(v)) {
      setError(null);
      setValue("");
      router.push(`/creator/${v}`);
    } else {
      setError("Paste a rule key (0x + 64 hex characters) or a creator address (0x + 40 hex characters).");
    }
  };

  return (
    <form role="search" className="search" onSubmit={onSubmit} noValidate>
      <label htmlFor={id} className="sr-only">
        Rule key or creator address
      </label>
      <input
        id={id}
        className="crt-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="search: rule key or creator address"
        spellCheck={false}
        autoComplete="off"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
      />
      <button className="crt-btn" type="submit">
        GO
      </button>
      {error && (
        <p id={`${id}-err`} className="bad search-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
