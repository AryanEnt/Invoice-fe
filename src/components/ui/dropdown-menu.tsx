"use client";

import { useEffect, useId, useRef, useState, type ReactNode ,useLayoutEffect } from "react";
import { Button } from "@/components/ui/button";
import { createPortal } from "react-dom";

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
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
  
    const updatePosition = () => {
      const rect = buttonRef.current!.getBoundingClientRect();
      const menuWidth = menuRef.current?.offsetWidth ?? 176;
      setCoords({
        top: rect.bottom + window.scrollY + 4,
        left: rect.right + window.scrollX - menuWidth,
      });
    };
  
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !buttonRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
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
    <div className="relative inline-flex">
    <Button
        ref={buttonRef}
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
      {open &&
  createPortal(
    <div
      ref={menuRef}
      id={menuId}
      role="menu"
      style={{ position: "absolute", top: coords.top, left: coords.left }}
      className="z-50 min-w-44 overflow-hidden rounded-xl border border-border bg-white py-1 shadow-lg"
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
    </div>,
    document.body
  )}
    </div>
  );
}

export function DropdownTrigger({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
