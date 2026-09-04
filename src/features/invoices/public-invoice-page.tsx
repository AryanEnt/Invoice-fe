"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableSkeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/invoice-calc";
import { ApiError } from "@/lib/api/types";
import {
  capturePublicPayPalOrder,
  createPublicPayPalOrder,
  createPublicStripeCheckout,
  getPublicInvoice,
  getPublicInvoicePaymentStatus,
} from "@/services/invoices.service";
import type { PublicInvoice } from "@/types/invoice";

export function PublicInvoicePage({ token }: { token: string }) {
  const [invoice, setInvoice] = useState<PublicInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payBusy, setPayBusy] = useState(false);
  const [payMessage, setPayMessage] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [captureResult, setCaptureResult] = useState<{
    amount: string;
    currency: string;
    transactionId: string | null;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setInvoice(await getPublicInvoice(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "This invoice link is invalid or expired.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const paypal = params.get("paypal");
    const orderId = params.get("token");
    if (!paypal) return;

    const clean = () => {
      const url = new URL(window.location.href);
      url.searchParams.delete("paypal");
      url.searchParams.delete("token");
      url.searchParams.delete("PayerID");
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    };

    const timer = window.setTimeout(() => {
      if (paypal === "cancel") {
        setPayMessage("Payment cancelled. Your invoice has not been paid.");
        clean();
        return;
      }

      if (paypal === "return" && orderId) {
        void (async () => {
          setPayBusy(true);
          try {
            const result = await capturePublicPayPalOrder(token, orderId);
            setCaptureResult({
              amount: result.amount,
              currency: result.currency,
              transactionId: result.transactionId,
            });
            if (!result.paid) {
              for (let i = 0; i < 8; i += 1) {
                await new Promise((resolve) => window.setTimeout(resolve, 1500));
                const status = await getPublicInvoicePaymentStatus(token);
                if (status.paymentStatus === "COMPLETED") break;
              }
            }
            await load();
          } catch (err) {
            setPayError(
              err instanceof ApiError ? err.message : "Payment could not be completed. Please try again.",
            );
          } finally {
            setPayBusy(false);
            clean();
          }
        })();
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load, token]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const stripe = params.get("stripe");
    if (!stripe) return;

    const clean = () => {
      const url = new URL(window.location.href);
      url.searchParams.delete("stripe");
      url.searchParams.delete("session_id");
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    };

    const timer = window.setTimeout(() => {
      if (stripe === "cancel") {
        setPayMessage("Payment cancelled. Your invoice has not been paid.");
        clean();
        return;
      }

      if (stripe === "success") {
        void (async () => {
          setPayBusy(true);
          try {
            await load();
          } finally {
            setPayBusy(false);
            clean();
          }
        })();
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function handlePayPal() {
    setPayBusy(true);
    setPayError(null);
    setPayMessage(null);
    try {
      const { checkoutUrl } = await createPublicPayPalOrder(token);
      window.location.assign(checkoutUrl);
    } catch (err) {
      setPayBusy(false);
      setPayError(
        err instanceof ApiError ? err.message : "Payment could not be completed. Please try again.",
      );
    }
  }

  async function handleStripe() {
    setPayBusy(true);
    setPayError(null);
    setPayMessage(null);
    try {
      const { checkoutUrl } = await createPublicStripeCheckout(token);
      window.location.assign(checkoutUrl);
    } catch (err) {
      setPayBusy(false);
      setPayError(
        err instanceof ApiError ? err.message : "Payment could not be completed. Please try again.",
      );
    }
  }

  if (loading && !invoice) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <TableSkeleton cols={4} rows={6} />
      </main>
    );
  }

  if (error || !invoice) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <ErrorState
          title="Invoice unavailable"
          message={error ?? "This invoice could not be found."}
          onRetry={() => void load()}
        />
      </main>
    );
  }

  const paid = invoice.paymentStatus === "PAID";
  const paypal = invoice.paypal;
  const stripe = invoice.stripe;
  const showPaymentMethods = !paid && (Boolean(stripe?.available) || Boolean(paypal?.available));
  const paymentMessage = !paid && !showPaymentMethods ? (stripe?.message ?? paypal?.message) : null;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            {invoice.organizationLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={invoice.organizationLogoUrl}
                alt={invoice.organizationName}
                className="mb-3 h-10 w-auto max-w-[160px] object-contain"
              />
            ) : null}
            <p className="text-sm font-medium text-muted">{invoice.organizationName}</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-wide text-foreground">INVOICE</h1>
            <p className="mt-1 text-sm text-muted">#{invoice.invoiceNumber}</p>
          </div>
          <StatusBadge status={invoice.paymentStatus === "UNPAID" ? invoice.status : invoice.paymentStatus} />
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Bill to</p>
            <p className="mt-2 font-medium text-foreground">{invoice.customer.name}</p>
            {invoice.customer.company ? (
              <p className="text-sm text-muted">{invoice.customer.company}</p>
            ) : null}
            {invoice.billingAddress ? (
              <p className="mt-2 whitespace-pre-line text-sm text-muted">
                {[
                  invoice.billingAddress.line1,
                  invoice.billingAddress.line2,
                  [invoice.billingAddress.city, invoice.billingAddress.region, invoice.billingAddress.postalCode]
                    .filter(Boolean)
                    .join(", "),
                  invoice.billingAddress.country,
                ]
                  .filter(Boolean)
                  .join("\n")}
              </p>
            ) : null}
          </div>
          <div className="grid gap-3 text-sm">
            <Detail label="Invoice date" value={invoice.invoiceDate.slice(0, 10)} />
            <Detail label="Due date" value={invoice.dueDate.slice(0, 10)} />
            <Detail label="Currency" value={invoice.currency} />
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-border">
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
                {invoice.items.map((item, index) => (
                  <tr key={`${item.description}-${index}`} className="border-t border-border">
                    <td className="px-4 py-3 text-foreground">{item.description}</td>
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

        {paid ? (
          <div className="mt-6 rounded-xl border border-success/30 bg-success-soft px-4 py-4 text-sm">
            <p className="font-semibold text-success">✓ Paid</p>
            <p className="mt-1 text-foreground">Payment completed successfully.</p>
            {captureResult ? (
              <p className="mt-2 text-muted">
                {formatMoney(captureResult.amount, captureResult.currency)}
                {captureResult.transactionId ? ` · ${captureResult.transactionId}` : null}
              </p>
            ) : stripe?.lastPayment?.transactionId ? (
              <p className="mt-2 text-muted">Transaction ID: {stripe.lastPayment.transactionId}</p>
            ) : paypal?.lastPayment?.transactionId ? (
              <p className="mt-2 text-muted">Transaction ID: {paypal.lastPayment.transactionId}</p>
            ) : null}
          </div>
        ) : showPaymentMethods ? (
          <div className="mt-6 rounded-xl border border-border px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Payment methods</p>
            <p className="mt-2 text-sm text-muted">
              Amount due {formatMoney(invoice.balanceDue, invoice.currency)}
            </p>
            {payMessage ? <p className="mt-3 text-sm text-muted">{payMessage}</p> : null}
            {payError ? <p className="mt-3 text-sm text-primary">{payError}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {stripe?.available ? (
                <Button disabled={payBusy} onClick={() => void handleStripe()}>
                  {payBusy ? "Connecting to Stripe…" : "Pay with Card (Stripe)"}
                </Button>
              ) : null}
              {paypal?.available ? (
                <Button disabled={payBusy} onClick={() => void handlePayPal()}>
                  {payBusy ? "Connecting to PayPal…" : "Pay with PayPal"}
                </Button>
              ) : null}
            </div>
          </div>
        ) : paymentMessage ? (
          <p className="mt-6 text-sm text-muted">{paymentMessage}</p>
        ) : null}

        {invoice.notes ? (
          <p className="mt-6 text-sm text-muted">
            <span className="font-medium text-foreground">Notes. </span>
            {invoice.notes}
          </p>
        ) : null}
        {invoice.terms ? (
          <p className="mt-3 text-sm text-muted">
            <span className="font-medium text-foreground">Terms. </span>
            {invoice.terms}
          </p>
        ) : null}
      </section>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-foreground">{value}</p>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? "font-semibold text-foreground" : "text-muted"}>{label}</span>
      <span className={strong ? "font-semibold text-foreground" : "text-foreground"}>{value}</span>
    </div>
  );
}
