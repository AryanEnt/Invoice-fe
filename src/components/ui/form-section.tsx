"use client";

import { useState, type ReactNode } from "react";

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function MoreOptions({
  title = "More options",
  children,
  defaultOpen = false,
}: {
  title?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <details
      className="rounded-2xl border border-border bg-surface p-4"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="cursor-pointer text-sm font-medium text-foreground">{title}</summary>
      <div className="mt-4 space-y-4">{children}</div>
    </details>
  );
}
