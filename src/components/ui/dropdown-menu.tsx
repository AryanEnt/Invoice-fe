"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

export interface DropdownItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface DropdownMenuProps {
  label?: string;
  ariaLabel?: string;
  items: DropdownItem[];
}

export function DropdownMenu({ label = "⋯", ariaLabel = "Actions", items }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-flex">
      <Button
        variant="ghost"
        size="sm"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={ariaLabel ?? label}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
      >
        {label}
      </Button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-20 mt-1 min-w-40 rounded-2xl border border-border bg-surface py-1"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              className={`block w-full px-3 py-2 text-left text-sm disabled:opacity-50 ${
                item.danger ? "text-primary hover:bg-primary-soft" : "text-foreground hover:bg-muted-soft"
              }`}
              onClick={(event) => {
                event.stopPropagation();
                setOpen(false);
                item.onClick();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function DropdownTrigger({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
