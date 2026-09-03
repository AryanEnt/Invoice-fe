import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "dangerSoft"
  | "success"
  | "warning"
  | "edit"
  | "link"
  | "sidebarGhost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md";
  loading?: boolean;
  children?: ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover active:brightness-95",
  secondary:
    "border border-border bg-surface text-foreground hover:bg-muted-soft active:bg-muted-soft",
  outline:
    "border border-border bg-transparent text-foreground hover:bg-muted-soft active:bg-muted-soft",
  ghost: "text-muted hover:bg-muted-soft hover:text-foreground active:bg-muted-soft",
  danger: "bg-primary text-primary-foreground hover:bg-primary-hover active:brightness-95",
  dangerSoft: "border border-border bg-primary-soft text-primary hover:bg-primary-soft",
  success: "border border-border bg-success-soft text-success hover:bg-success-soft",
  warning: "border border-border bg-warning-soft text-warning hover:bg-warning-soft",
  edit: "border border-border bg-surface text-foreground hover:bg-muted-soft",
  link: "h-auto px-0 text-primary underline-offset-4 hover:underline",
  sidebarGhost: "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground",
};

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 gap-1.5 rounded-[8px] px-2.5 text-xs",
  md: "h-9 gap-2 rounded-[8px] px-3.5 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center font-medium whitespace-nowrap transition-colors duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden
          />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
