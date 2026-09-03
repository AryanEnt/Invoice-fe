import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-nowrap items-center gap-3">{actions}</div>
      ) : null}
    </div>
  );
}

export function Surface({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface",
        padded && "p-5 md:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
