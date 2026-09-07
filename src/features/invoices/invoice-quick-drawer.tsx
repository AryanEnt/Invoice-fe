"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/invoice-calc";
import {
  buildInvoiceTimeline,
  customerInitials,
  formatActivityStampLong,
  formatInvoiceDay,
  invoiceEmailAt,
} from "@/features/invoices/invoice-activity";
import { InvoiceStatusPill } from "@/features/invoices/invoice-status-pill";
import type { Invoice } from "@/types/invoice";

export function InvoiceQuickDrawer({
  invoice,
  sending,
  copyBusy,
  canSend,
  canUpdate,
  onClose,
  onCopyLink,
  onSendEmail,
  onEdit,
  onOpenFull,
}: {
  invoice: Invoice;
  sending?: boolean;
  copyBusy?: boolean;
  canSend: boolean;
  canUpdate: boolean;
  onClose: () => void;
  onCopyLink: () => void;
  onSendEmail: () => void;
  onEdit: () => void;
  onOpenFull: () => void;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const timeline = buildInvoiceTimeline(invoice);
  const emailAt = invoiceEmailAt(invoice);
  const emailStamp = formatActivityStampLong(emailAt);
  const viewedStamp = formatActivityStampLong(invoice.viewedAt);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/20"
        aria-label="Close invoice details"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-drawer-title"
        className="relative flex h-full w-full max-w-md flex-col border-l border-border bg-surface shadow-xl"
      >
        <div className="border-b border-border px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                id="invoice-drawer-title"
                className="text-lg font-semibold tracking-tight text-foreground"
              >
                {invoice.invoiceNumber}
              </h2>
              <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                {formatMoney(invoice.total, invoice.currency)}
              </p>
            </div>
            <button
              type="button"
              className="rounded-lg px-2 py-1 text-sm text-muted hover:bg-muted-soft hover:text-foreground"
              onClick={onClose}
            >
              Close
            </button>
          </div>
          <div className="mt-3">
            <InvoiceStatusPill status={invoice.status} />
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <section>
            <h3 className="text-[11px] font-medium uppercase tracking-wide text-muted">Customer</h3>
            <div className="mt-2 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted-soft text-xs font-semibold text-muted">
                {customerInitials(invoice.customer.name)}
              </span>
              <div>
                <p className="font-medium text-foreground">{invoice.customer.name}</p>
                {invoice.customer.email ? (
                  <p className="text-xs text-muted">{invoice.customer.email}</p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-[11px] font-medium uppercase tracking-wide text-muted">Issued</h3>
              <p className="mt-1 text-sm text-foreground">{formatInvoiceDay(invoice.invoiceDate)}</p>
            </div>
            <div>
              <h3 className="text-[11px] font-medium uppercase tracking-wide text-muted">Due</h3>
              <p className="mt-1 text-sm text-foreground">{formatInvoiceDay(invoice.dueDate)}</p>
            </div>
          </section>

          <section>
            <h3 className="text-[11px] font-medium uppercase tracking-wide text-muted">Delivery</h3>
            <div className="mt-2 rounded-xl border border-border bg-muted-soft/40 px-3.5 py-3">
              {sending ? (
                <>
                  <p className="text-sm font-medium text-warning">Sending…</p>
                  <p className="mt-0.5 text-xs text-muted">Delivering invoice email</p>
                </>
              ) : invoice.emailStatus === "FAILED" ? (
                <>
                  <p className="text-sm font-medium text-primary">Email failed</p>
                  <p className="mt-0.5 text-xs text-muted">{emailStamp ?? "Unable to deliver email"}</p>
                </>
              ) : invoice.emailStatus === "SENT" || emailAt ? (
                <>
                  <p className="text-sm font-medium text-foreground">Email sent</p>
                  <p className="mt-0.5 text-xs text-muted">{emailStamp ?? "Delivered to customer"}</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-muted">Not sent</p>
                  <p className="mt-0.5 text-xs text-muted">
                    This invoice has not been emailed to the customer.
                  </p>
                </>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-[11px] font-medium uppercase tracking-wide text-muted">
              Customer activity
            </h3>
            <div className="mt-2 rounded-xl border border-border bg-muted-soft/40 px-3.5 py-3">
              {invoice.viewedAt ? (
                <>
                  <p className="text-sm font-medium text-foreground">Viewed</p>
                  <p className="mt-0.5 text-xs text-muted">{viewedStamp}</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-muted">Not viewed yet</p>
                  <p className="mt-0.5 text-xs text-muted">Customer has not opened this invoice.</p>
                </>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-[11px] font-medium uppercase tracking-wide text-muted">Timeline</h3>
            <ol className="mt-3 space-y-0">
              {timeline.map((event, index) => (
                <li key={event.key} className="relative flex gap-3 pb-5 last:pb-0">
                  {index < timeline.length - 1 ? (
                    <span className="absolute left-[5px] top-3 bottom-0 w-px bg-border" aria-hidden />
                  ) : null}
                  <span className="relative z-[1] mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-foreground/35" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{event.label}</p>
                    <p className="text-xs text-muted">
                      {event.at ? formatActivityStampLong(event.at) : "Time not recorded"}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border px-5 py-4">
          <Button variant="secondary" onClick={onCopyLink} disabled={copyBusy}>
            {copyBusy ? "Copying…" : "Copy Link"}
          </Button>
          {canSend && invoice.status !== "CANCELLED" ? (
            <Button variant="secondary" onClick={onSendEmail} disabled={!invoice.customer.email}>
              {invoice.emailStatus === "FAILED" ? "Retry Email" : "Send Email"}
            </Button>
          ) : null}
          {canUpdate && invoice.status === "DRAFT" ? (
            <Button variant="secondary" onClick={onEdit}>
              Edit
            </Button>
          ) : null}
          <Button onClick={onOpenFull}>Open full page</Button>
        </div>
      </aside>
    </div>
  );
}
