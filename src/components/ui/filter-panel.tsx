import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface FilterPanelProps {
  open: boolean;
  onToggle: () => void;
  count: number;
  onClear?: () => void;
  children: ReactNode;
}

export function FilterPanel({ open, onToggle, count, onClear, children }: FilterPanelProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={onToggle} aria-expanded={open}>
          Filters{count ? ` (${count})` : ""}
        </Button>
        {count > 0 && onClear ? (
          <Button variant="ghost" onClick={onClear}>
            Clear all
          </Button>
        ) : null}
      </div>
      {open ? (
        <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4 md:grid-cols-3 xl:grid-cols-6">
          {children}
        </div>
      ) : null}
    </div>
  );
}
