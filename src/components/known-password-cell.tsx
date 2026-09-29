"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
      <rect x="5" y="5" width="8.5" height="8.5" rx="1.6" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M10.5 5V3.6A1.1 1.1 0 0 0 9.4 2.5H3.6A1.1 1.1 0 0 0 2.5 3.6v5.8A1.1 1.1 0 0 0 3.6 10.5H5"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M3.5 8.4 6.5 11.3 12.5 4.9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Copies the password when this page set it during the current visit (kept in component memory only).
 * Stored passwords are hashes, so otherwise `onRequestNew` issues a new one and copies that.
 */
export function KnownPasswordCell({
  password,
  onCopy,
  onRequestNew,
}: {
  password?: string;
  onCopy: (password: string) => Promise<boolean>;
  onRequestNew: () => Promise<boolean>;
}) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const label = copied ? "Password copied" : "Copy password";

  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-mono text-sm tracking-widest text-foreground" aria-label="Password hidden">
        ••••••••
      </span>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          const copy = password ? onCopy(password) : onRequestNew();
          void copy.then((ok) => setCopied(ok)).finally(() => setBusy(false));
        }}
        title={label}
        aria-label={label}
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-md border transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          "active:scale-90 disabled:cursor-wait disabled:opacity-60",
          copied
            ? "border-success bg-success-soft text-success"
            : "border-border text-muted hover:border-primary hover:bg-primary-soft hover:text-primary",
        )}
      >
        {copied ? <CheckIcon /> : <ClipboardIcon />}
      </button>
    </span>
  );
}
