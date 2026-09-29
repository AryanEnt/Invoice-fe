"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { copyText } from "@/lib/copy-text";

/**
 * One-time credentials returned by a create or reset-password request.
 * Keep this in component state only — never persist it (storage, URL, global state).
 */
export interface OneTimeCredentials {
  title: string;
  email: string;
  temporaryPassword: string;
}

export function CredentialsDialog({
  credentials,
  onClose,
}: {
  credentials: OneTimeCredentials;
  onClose: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  async function handleCopy() {
    try {
      await copyText(
        `Email: ${credentials.email}\nTemporary password: ${credentials.temporaryPassword}`,
      );
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <Dialog
      title={credentials.title}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={() => void handleCopy()}>
            {copyState === "copied" ? "Copied" : "Copy credentials"}
          </Button>
          <Button onClick={onClose}>Close</Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <dl className="grid gap-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Email</dt>
            <dd className="font-medium text-foreground">{credentials.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Temporary password</dt>
            <dd className="flex items-center gap-2">
              <span className="font-mono text-base text-foreground" aria-live="polite">
                {revealed ? credentials.temporaryPassword : "••••••••"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setRevealed((value) => !value)}
                aria-pressed={revealed}
              >
                {revealed ? "Hide" : "Show"}
              </Button>
            </dd>
          </div>
        </dl>
        <p className="rounded-[10px] border border-border bg-muted-soft px-3 py-2 text-foreground">
          This password is shown only once. Copy the credentials before closing this window.
        </p>
        {copyState === "failed" ? (
          <p className="text-xs text-danger">
            Couldn&apos;t copy automatically. Use Show and copy the password manually.
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}
