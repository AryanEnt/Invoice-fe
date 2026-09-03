"use client";

import Link from "next/link";
import { InvoiceStatusWithViewed } from "@/components/ui/invoice-status-with-viewed";
import { formatMoney } from "@/lib/invoice-calc";
import { cn } from "@/lib/cn";
import type { Invoice } from "@/types/invoice";

export function InvoiceBoardCard({
  invoice,
  showMember,
}: {
  invoice: Invoice;
  showMember: boolean;
}) {
  const completedPayment = invoice.payments.find((payment) => payment.status === "COMPLETED");
  const secondaryDate =
    invoice.status === "PAID"
      ? completedPayment?.paidAt ?? invoice.updatedAt
      : invoice.sentAt ?? invoice.invoiceDate;
  const secondaryLabel = invoice.status === "PAID" ? "Paid" : invoice.sentAt ? "Sent" : "Issued";

  return (
    <Link
      href={`/invoices/${invoice.id}`}
      className={cn(
        "block rounded-xl border border-border bg-surface px-3.5 py-3 shadow-sm transition",
        "hover:border-primary/40 hover:bg-muted-soft/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-sm font-semibold text-foreground">{invoice.invoiceNumber}</p>
        <InvoiceStatusWithViewed status={invoice.status} viewedAt={invoice.viewedAt} />
      </div>
      <p className="mt-1 truncate text-sm text-muted">{invoice.customer.name}</p>
      <p className="mt-2 text-sm font-medium tabular-nums text-foreground">
        {formatMoney(invoice.total, invoice.currency)}
      </p>
      <div className="mt-3 space-y-1 text-xs text-muted">
        <p>Due {invoice.dueDate.slice(0, 10)}</p>
        <p>
          {secondaryLabel} {secondaryDate.slice(0, 10)}
        </p>
        {showMember && invoice.assignedMember ? (
          <p className="truncate">
            {invoice.assignedMember.firstName} {invoice.assignedMember.lastName}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export function InvoiceBoardCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-surface px-3.5 py-3">
      <div className="h-4 w-24 rounded bg-muted-soft" />
      <div className="mt-2 h-3 w-32 rounded bg-muted-soft" />
      <div className="mt-3 h-4 w-20 rounded bg-muted-soft" />
      <div className="mt-3 h-3 w-28 rounded bg-muted-soft" />
    </div>
  );
}
