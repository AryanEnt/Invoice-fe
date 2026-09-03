"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export interface CreatedCredentials {
  teamName?: string;
  name: string;
  username: string;
  temporaryPassword: string;
}

function credentialsText(credentials: CreatedCredentials): string {
  const lines = [
    credentials.teamName ? `Team: ${credentials.teamName}` : null,
    `Name: ${credentials.name}`,
    `Username: ${credentials.username}`,
    `Temporary Password: ${credentials.temporaryPassword}`,
  ].filter((line): line is string => Boolean(line));
  return lines.join("\n");
}

export function CredentialsDialog({
  credentials,
  onClose,
}: {
  credentials: CreatedCredentials;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
  }

  return (
    <Dialog
      title="Account created successfully"
      onClose={onClose}
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => void copy("all", credentialsText(credentials))}
          >
            Copy credentials
          </Button>
          <Button onClick={onClose}>Done</Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <p className="rounded-[10px] border border-border bg-muted-soft px-3 py-2 text-foreground">
          Save these credentials before closing. The temporary password will not be shown again.
        </p>
        <dl className="grid gap-2">
          {credentials.teamName ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Team</dt>
              <dd className="font-medium">{credentials.teamName}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Name</dt>
            <dd className="font-medium">{credentials.name}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Username</dt>
            <dd className="font-medium">{credentials.username}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Temporary password</dt>
            <dd className="font-mono text-base">{credentials.temporaryPassword}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void copy("username", credentials.username)}
          >
            Copy username
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void copy("password", credentials.temporaryPassword)}
          >
            Copy password
          </Button>
        </div>
        {copied ? <p className="text-xs text-success">Copied {copied}.</p> : null}
      </div>
    </Dialog>
  );
}
