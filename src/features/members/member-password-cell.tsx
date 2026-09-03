"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

function CopyIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <rect x="5.5" y="5.5" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M4.5 10.5h-.8a1.2 1.2 0 0 1-1.2-1.2v-6a1.2 1.2 0 0 1 1.2-1.2h6a1.2 1.2 0 0 1 1.2 1.2v.8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M1.5 8s2.2-4 6.5-4 6.5 4 6.5 4-2.2 4-6.5 4-6.5-4-6.5-4Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle cx="8" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path
        d="M6.2 6.4A2.2 2.2 0 0 0 6 8c0 1.2 1 2.2 2.2 2.2.6 0 1.1-.2 1.5-.6M4.1 4.7C2.9 5.6 1.9 6.9 1.5 8s2.2 4 6.5 4c1.2 0 2.3-.3 3.2-.8M10.8 10.8C9.9 11.4 8.9 11.8 8 11.8c-2.1 0-3.8-1.7-3.8-3.8 0-.9.3-1.8.8-2.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface MemberPasswordCellProps {
  password: string | null;
  copying?: boolean;
  onCopy: () => void | Promise<void>;
  onReveal?: () => void | Promise<void>;
}

export function MemberPasswordCell({
  password,
  copying = false,
  onCopy,
  onReveal,
}: MemberPasswordCellProps) {
  const [visible, setVisible] = useState(false);

  async function toggleVisibility() {
    if (password) {
      setVisible((current) => !current);
      return;
    }
    if (!onReveal) {
      return;
    }
    await onReveal();
    setVisible(true);
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-sm text-foreground">
        {password && visible ? password : "••••••••"}
      </span>
      <button
        type="button"
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-muted-soft hover:text-foreground",
          copying && "cursor-wait opacity-60",
        )}
        aria-label={visible ? "Hide password" : "Show password"}
        disabled={copying}
        onClick={() => void toggleVisibility()}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
      <button
        type="button"
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-muted-soft hover:text-foreground",
          copying && "cursor-wait opacity-60",
        )}
        aria-label="Copy password"
        title="Copy password"
        disabled={copying}
        onClick={() => void onCopy()}
      >
        {copying ? (
          <span
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden
          />
        ) : (
          <CopyIcon />
        )}
      </button>
    </div>
  );
}
