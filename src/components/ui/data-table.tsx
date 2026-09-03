import type { KeyboardEvent, ReactNode } from "react";

interface DataTableProps {
  children: ReactNode;
  footer?: ReactNode;
}

export function DataTable({ children, footer }: DataTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="overflow-x-auto">{children}</div>
      {footer ? <div className="border-t border-border px-4 py-3">{footer}</div> : null}
    </div>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return <table className="min-w-full text-left text-sm">{children}</table>;
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-muted-soft text-xs font-medium uppercase tracking-wide text-muted">
      {children}
    </thead>
  );
}

export function Th({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <th className={`whitespace-nowrap px-4 py-3 font-medium ${className}`}>{children}</th>;
}

export function Td({
  children,
  className = "",
  muted = false,
}: {
  children: ReactNode;
  className?: string;
  muted?: boolean;
}) {
  return (
    <td className={`whitespace-nowrap px-4 py-3 ${muted ? "text-muted" : "text-foreground"} ${className}`}>
      {children}
    </td>
  );
}

export function ClickableRow({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  function onKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  }

  return (
    <tr
      tabIndex={0}
      className="cursor-pointer border-t border-border hover:bg-muted-soft focus-visible:bg-muted-soft"
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      {children}
    </tr>
  );
}
