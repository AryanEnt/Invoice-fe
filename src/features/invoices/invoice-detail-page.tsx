"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ActionGroup, CancelAction, CopyLinkAction, DeleteAction, EditAction } from "@/components/ui/action-buttons";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { InvoiceStatusWithViewed } from "@/components/ui/invoice-status-with-viewed";
import { formatMoney } from "@/lib/invoice-calc";
import { ApiError } from "@/lib/api/types";
import { hasPermission } from "@/lib/permissions";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { RecordPaymentDialog } from "@/features/payments/record-payment-dialog";
import {
  cancelInvoice,
  deleteInvoice,
  downloadInvoicePdf,
  getInvoice,
  getInvoiceShareLink,
  sendInvoice,
} from "@/services/invoices.service";
import { copyText } from "@/lib/copy-text";
import type { Invoice } from "@/types/invoice";

interface InvoiceDetailPageProps {
  invoiceId: string;
}

export function InvoiceDetailPage({ invoiceId }: InvoiceDetailPageProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { notify } = useToast();
  const canSend = hasPermission(user, "INVOICES_SEND");
  const canUpdate = hasPermission(user, "INVOICES_UPDATE");
  const canDelete = hasPermission(user, "INVOICES_DELETE");
  const canPay = hasPermission(user, "PAYMENTS_CREATE");

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setInvoice(await getInvoice(invoiceId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load invoice.");
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!cancelled) {
        void load();
      }
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [load]);

  useEffect(() => {
    if (!invoice || !["SENT", "VIEWED"].includes(invoice.status)) {
      return;
    }
    const timer = window.setInterval(() => {
      void getInvoice(invoiceId)
        .then((next) => setInvoice(next))
        .catch(() => undefined);
    }, 15_000);
    return () => window.clearInterval(timer);
  }, [invoice?.status, invoiceId]);

  async function run(action: () => Promise<unknown>, successMessage: string) {
    setBusy(true);
    try {
      await action();
      notify(successMessage);
      await load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to update invoice.", "error");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <TableSkeleton cols={4} rows={5} />;
  }

  if (error || !invoice) {
    return (
      <ErrorState
        title="We couldn't load this invoice."
        message={error ?? "Invoice not found."}
        onRetry={() => void load()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={invoice.invoiceNumber}
        description={invoice.customer.name}
        actions={
          <>
            <InvoiceStatusWithViewed status={invoice.status} viewedAt={invoice.viewedAt} />
            <StatusBadge status={invoice.emailStatus} />
            <CopyLinkAction
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const url = await getInvoiceShareLink(invoice.id);
                  await copyText(url);
                }, "Invoice link copied")
              }
            />
            {canSend && invoice.status !== "CANCELLED" ? (
              <Button
                onClick={() => void run(() => sendInvoice(invoice.id), "Invoice sent successfully")}
                disabled={busy}
              >
                {busy ? "Sending…" : invoice.emailStatus === "FAILED" ? "Retry email" : invoice.emailStatus === "SENT" ? "Resend email" : "Send invoice"}
              </Button>
            ) : null}
            {canPay && ["SENT", "VIEWED", "OVERDUE", "PARTIALLY_PAID"].includes(invoice.status) ? (
              <Button onClick={() => setPayOpen(true)} disabled={busy}>
                Record payment
              </Button>
            ) : null}
            <Button
              variant="secondary"
              onClick={() =>
                void run(() => downloadInvoicePdf(invoice.id, invoice.invoiceNumber), "PDF downloaded.")
              }
              disabled={busy}
            >
              Download PDF
            </Button>
            <ActionGroup>
              {canUpdate && invoice.status === "DRAFT" ? (
                <EditAction onClick={() => router.push(`/invoices/${invoice.id}/edit`)} disabled={busy} />
              ) : null}
              {canUpdate && ["DRAFT", "SENT", "VIEWED", "OVERDUE"].includes(invoice.status) ? (
                <CancelAction
                  label="Cancel invoice"
                  onClick={() => setCancelOpen(true)}
                  disabled={busy}
                />
              ) : null}
              {canDelete && invoice.status === "DRAFT" ? (
                <DeleteAction onClick={() => setDeleteOpen(true)} disabled={busy} />
              ) : null}
            </ActionGroup>
          </>
        }
      />
      <Link href="/invoices" className="inline-block text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
        ← Back to invoices
      </Link>

      <section className="grid gap-4 rounded-2xl border border-border bg-surface p-6 md:grid-cols-2">
        <div>
          {(invoice.organization?.logoUrl || invoice.organization?.name) && (
            <div className="mb-4">
              {invoice.organization?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={invoice.organization.logoUrl}
                  alt={invoice.organization.name}
                  className="mb-2 h-10 w-auto max-w-[160px] object-contain"
                />
              ) : null}
              {invoice.organization?.name ? (
                <p className="text-sm font-medium text-foreground">{invoice.organization.name}</p>
              ) : null}
            </div>
          )}
          <h2 className="text-sm font-semibold text-foreground">Customer</h2>
          <p className="mt-2 text-sm font-medium text-foreground">{invoice.customer.name}</p>
          {invoice.customer.company ? (
            <p className="text-sm text-muted">{invoice.customer.company}</p>
          ) : null}
          {invoice.customer.email ? (
            <p className="text-sm text-muted">{invoice.customer.email}</p>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Detail label="Invoice date" value={invoice.invoiceDate.slice(0, 10)} />
          <Detail label="Due date" value={invoice.dueDate.slice(0, 10)} />
          <Detail label="Currency" value={invoice.currency} />
          <Detail
            label="Assigned"
            value={
              invoice.assignedMember
                ? `${invoice.assignedMember.firstName} ${invoice.assignedMember.lastName}`
                : "—"
            }
          />
        </div>
      </section>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted-soft text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium text-right">Qty</th>
              <th className="px-4 py-3 font-medium text-right">Unit Price</th>
              <th className="px-4 py-3 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{item.description}</p>
                  <p className="text-xs text-muted">
                    {[item.sku, item.unit, item.catalogKind].filter(Boolean).join(" · ")}
                  </p>
                </td>
                <td className="px-4 py-3 text-right text-muted">{item.quantity}</td>
                <td className="px-4 py-3 text-right text-muted">
                  {formatMoney(item.unitPrice, invoice.currency)}
                </td>
                <td className="px-4 py-3 text-right text-muted">
                  {formatMoney(item.lineTotal, invoice.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <div className="grid gap-2 border-t border-border px-4 py-4 text-sm md:ml-auto md:w-80">
          <Row label="Subtotal" value={formatMoney(invoice.subtotal, invoice.currency)} />
          <Row label="Total" value={formatMoney(invoice.total, invoice.currency)} strong />
          <Row label="Paid" value={formatMoney(invoice.amountPaid, invoice.currency)} />
          <Row label="Balance due" value={formatMoney(invoice.balanceDue, invoice.currency)} />
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h3 className="text-sm font-semibold text-foreground">Payment history</h3>
          <p className="text-sm text-muted">
            Paid {formatMoney(invoice.amountPaid, invoice.currency)} of{" "}
            {formatMoney(invoice.total, invoice.currency)} · Balance{" "}
            {formatMoney(invoice.balanceDue, invoice.currency)}
          </p>
        </div>
        {invoice.payments.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No payments recorded yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium">Amount</th>
                  <th className="py-2 pr-4 font-medium">Method</th>
                  <th className="py-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map((payment) => (
                  <tr key={payment.id} className="border-t border-border">
                    <td className="py-2 pr-4 text-muted">
                      {(payment.paidAt ?? payment.createdAt).slice(0, 10)}
                    </td>
                    <td className="py-2 pr-4 text-muted">
                      {formatMoney(payment.amount, payment.currency)}
                    </td>
                    <td className="py-2 pr-4 text-muted">
                      {payment.method.replaceAll("_", " ")}
                    </td>
                    <td className="py-2 text-muted">{payment.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {(invoice.notes || invoice.terms) && (
        <section className="grid gap-4 md:grid-cols-2">
          {invoice.notes ? (
            <div className="rounded-2xl border border-border bg-surface p-6">
              <h3 className="text-sm font-semibold text-foreground">Notes</h3>
              <p className="mt-2 text-sm text-muted">{invoice.notes}</p>
            </div>
          ) : null}
          {invoice.terms ? (
            <div className="rounded-2xl border border-border bg-surface p-6">
              <h3 className="text-sm font-semibold text-foreground">Terms</h3>
              <p className="mt-2 text-sm text-muted">{invoice.terms}</p>
            </div>
          ) : null}
        </section>
      )}

      {cancelOpen ? (
        <ConfirmDialog
          title="Cancel invoice"
          message={`${invoice.invoiceNumber} will be cancelled and can no longer be edited or paid.`}
          confirmLabel="Cancel invoice"
          danger
          busy={busy}
          onCancel={() => setCancelOpen(false)}
          onConfirm={() =>
            void run(async () => {
              await cancelInvoice(invoice.id);
              setCancelOpen(false);
            }, "Invoice cancelled.")
          }
        />
      ) : null}

      {deleteOpen ? (
        <ConfirmDialog
          title="Delete invoice"
          message={`${invoice.invoiceNumber} will be permanently removed.`}
          confirmLabel="Delete"
          danger
          busy={busy}
          onCancel={() => setDeleteOpen(false)}
          onConfirm={() =>
            void (async () => {
              setBusy(true);
              try {
                await deleteInvoice(invoice.id);
                notify("Invoice deleted");
                router.replace("/invoices");
              } catch (err) {
                notify(err instanceof ApiError ? err.message : "Unable to delete invoice.", "error");
                setBusy(false);
              }
            })()
          }
        />
      ) : null}

      {payOpen ? (
        <RecordPaymentDialog
          invoice={invoice}
          onClose={() => setPayOpen(false)}
          onRecorded={(updated) => {
            setInvoice(updated);
            setPayOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "font-semibold text-foreground" : "text-muted"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
