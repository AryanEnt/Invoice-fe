"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  formatActivityStamp,
  invoiceEmailAt,
  invoicePaidAt,
} from "@/features/invoices/invoice-activity";
import type { Invoice } from "@/types/invoice";

function MailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <rect x="2" y="3.5" width="12" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2.5 4.5 8 8.5l5.5-4" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path
        d="M3.5 8.2 6.6 11.2 12.5 4.8"
        stroke="currentColor"
        strokeWidth="1.4"
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

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M1.5 8s2.2-4 6.5-4 6.5 4 6.5 4-2.2 4-6.5 4-6.5-4-6.5-4Z" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="8" r="1.7" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function ActivityLine({
  icon,
  title,
  subtitle,
  tone = "muted",
  action,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  tone?: "muted" | "success" | "warning" | "danger" | "default";
  action?: ReactNode;
}) {
  const titleTone =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : tone === "danger"
          ? "text-primary"
          : tone === "default"
            ? "text-foreground"
            : "text-muted";

  return (
    <div className="flex items-start gap-2">
      <span className={cn("mt-0.5 shrink-0", titleTone)}>{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <p className={cn("text-xs font-medium", titleTone)}>{title}</p>
          {action}
        </div>
        <p className="text-[11px] leading-snug text-muted">{subtitle}</p>
      </div>
    </div>
  );
}

export function InvoiceActivityCell({
  invoice,
  sending,
  canSend,
  onRetry,
}: {
  invoice: Invoice;
  sending?: boolean;
  canSend?: boolean;
  onRetry?: () => void;
}) {
  const emailAt = invoiceEmailAt(invoice);
  const emailStamp = formatActivityStamp(emailAt);
  const viewedStamp = formatActivityStamp(invoice.viewedAt);
  const paidStamp = formatActivityStamp(invoicePaidAt(invoice));

  if (sending) {
    return (
      <ActivityLine
        icon={<MailIcon className="h-3.5 w-3.5" />}
        title="Sending…"
        subtitle="Delivering invoice email"
        tone="warning"
      />
    );
  }

  if (invoice.status === "PAID") {
    return (
      <div className="space-y-1.5">
        <ActivityLine
          icon={<CheckIcon className="h-3.5 w-3.5" />}
          title="Paid"
          subtitle={paidStamp ?? "Payment recorded"}
          tone="success"
        />
        {invoice.viewedAt ? (
          <ActivityLine
            icon={<EyeIcon className="h-3.5 w-3.5" />}
            title="Viewed"
            subtitle={viewedStamp ?? "Customer opened invoice"}
            tone="muted"
          />
        ) : null}
      </div>
    );
  }

  if (invoice.emailStatus === "FAILED") {
    return (
      <ActivityLine
        icon={<WarnIcon className="h-3.5 w-3.5" />}
        title="Delivery failed"
        subtitle={emailStamp ?? "Unable to deliver email"}
        tone="danger"
        action={
          canSend && invoice.customer.email && onRetry ? (
            <button
              type="button"
              className="text-[11px] font-medium text-primary underline-offset-2 hover:underline"
              onClick={(event) => {
                event.stopPropagation();
                onRetry();
              }}
            >
              Retry
            </button>
          ) : null
        }
      />
    );
  }

  if (invoice.emailStatus === "NOT_SENT" && !emailAt) {
    return (
      <ActivityLine
        icon={<MailIcon className="h-3.5 w-3.5" />}
        title="Not sent"
        subtitle={
          invoice.status === "DRAFT"
            ? "This invoice has not been emailed to the customer."
            : "No email activity"
        }
        tone="muted"
      />
    );
  }

  // Sent / Viewed / other
  return (
    <div className="space-y-1.5">
      <ActivityLine
        icon={<CheckIcon className="h-3.5 w-3.5" />}
        title="Email sent"
        subtitle={emailStamp ?? "Delivered to customer"}
        tone="success"
      />
      {invoice.viewedAt ? (
        <ActivityLine
          icon={<EyeIcon className="h-3.5 w-3.5" />}
          title="Viewed by customer"
          subtitle={viewedStamp ?? "Customer opened invoice"}
          tone="default"
        />
      ) : (
        <ActivityLine
          icon={<EyeIcon className="h-3.5 w-3.5" />}
          title="Not viewed yet"
          subtitle="Waiting for customer"
          tone="muted"
        />
      )}
    </div>
  );
}
