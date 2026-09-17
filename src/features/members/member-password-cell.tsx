"use client";

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

interface MemberPasswordCellProps {
  copying?: boolean;
  onCopy: () => void | Promise<void>;
}

export function MemberPasswordCell({ copying = false, onCopy }: MemberPasswordCellProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-sm text-foreground">••••••••</span>
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
