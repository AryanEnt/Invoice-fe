import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

function DraftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path
        d="M4.5 2.5h5.2L12 4.8v8.7H4.5V2.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M9.5 2.5v2.6H12" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M6 8h4M6 10.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function SentIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path
        d="M2.5 8.2 13 3.5 8.4 13l-.9-4.2L2.5 8.2Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path
        d="M1.5 8s2.2-4 6.5-4 6.5 4 6.5 4-2.2 4-6.5 4-6.5-4-6.5-4Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle cx="8" cy="8" r="1.7" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function PaidIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <circle cx="8" cy="8" r="5.2" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M5.2 8.1 7.1 10l3.7-4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WarnIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path
        d="M8 2.8 13.4 12.5H2.6L8 2.8Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M8 6.4v2.6M8 11.1h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

const CONFIG: Record<
  string,
  { label: string; className: string; Icon: (props: { className?: string }) => ReactNode }
> = {
  DRAFT: {
    label: "Draft",
    className: "bg-muted-soft/80 text-muted ring-border",
    Icon: DraftIcon,
  },
  SENT: {
    label: "Sent",
    className: "bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)] text-foreground ring-border",
    Icon: SentIcon,
  },
  VIEWED: {
    label: "Viewed",
    className: "bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)] text-foreground ring-border",
    Icon: EyeIcon,
  },
  PARTIALLY_PAID: {
    label: "Partial",
    className: "bg-warning-soft/70 text-warning ring-warning/15",
    Icon: PaidIcon,
  },
  PAID: {
    label: "Paid",
    className: "bg-success-soft/80 text-success ring-success/15",
    Icon: PaidIcon,
  },
  OVERDUE: {
    label: "Overdue",
    className: "bg-primary-soft/70 text-primary ring-primary/15",
    Icon: WarnIcon,
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-muted-soft text-muted ring-border",
    Icon: DraftIcon,
  },
};

export function InvoiceStatusPill({ status }: { status: string }) {
  const key = status.toUpperCase();
  const config = CONFIG[key] ?? {
    label: status.replaceAll("_", " "),
    className: "bg-muted-soft text-foreground ring-border",
    Icon: DraftIcon,
  };
  const Icon = config.Icon;

  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-lg px-2 text-xs font-medium ring-1 ring-inset",
        config.className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
      {config.label}
    </span>
  );
}
