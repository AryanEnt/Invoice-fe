"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { CardSkeleton } from "@/components/ui/skeleton";
import { InvoiceStatusWithViewed } from "@/components/ui/invoice-status-with-viewed";
import { formatMoney } from "@/lib/invoice-calc";
import { ApiError } from "@/lib/api/types";
import { hasPermission } from "@/lib/permissions";
import { useToast } from "@/providers/toast-provider";
import { getInvoiceSummary, listInvoices, sendInvoice } from "@/services/invoices.service";
import { listPayments } from "@/services/payments.service";
import type { PublicUser } from "@/types/auth";
import type { Invoice, InvoiceSummary } from "@/types/invoice";
import type { Payment } from "@/types/payment";

type AttentionKind = "overdue" | "not_sent" | "awaiting";

interface AttentionItem {
  invoice: Invoice;
  kind: AttentionKind;
}

export function MemberDashboardSection({ user }: { user: PublicUser }) {
  const { notify } = useToast();
  const requestIdRef = useRef(0);
  const canCreateInvoice = hasPermission(user, "INVOICES_CREATE");
  const canSend = hasPermission(user, "INVOICES_SEND");

  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>([]);
  const [recentlySent, setRecentlySent] = useState<Invoice[]>([]);
  const [recentlyPaid, setRecentlyPaid] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const load = useCallback(async (options?: { quiet?: boolean }) => {
    const requestId = ++requestIdRef.current;
    if (!options?.quiet) {
      setLoading(true);
    }
    setError(null);
    try {
      const [summaryResult, overdue, drafts, sent, viewed, partial, recentInvoices, payments] =
        await Promise.all([
          getInvoiceSummary(),
          listInvoices({ status: "OVERDUE", pageSize: 5, sort: "dueDate", sortDir: "asc" }),
          listInvoices({ status: "DRAFT", pageSize: 5, sort: "createdAt", sortDir: "desc" }),
          listInvoices({ status: "SENT", pageSize: 5, sort: "dueDate", sortDir: "asc" }),
          listInvoices({ status: "VIEWED", pageSize: 5, sort: "dueDate", sortDir: "asc" }),
          listInvoices({
            status: "PARTIALLY_PAID",
            pageSize: 5,
            sort: "dueDate",
            sortDir: "asc",
          }),
          listInvoices({ pageSize: 50, sort: "createdAt", sortDir: "desc" }),
          listPayments({ status: "COMPLETED", pageSize: 5, page: 1 }),
        ]);

      if (requestId !== requestIdRef.current) {
        return;
      }

      const today = new Date().toISOString().slice(0, 10);
      const awaiting = [...sent.items, ...viewed.items, ...partial.items]
        .filter((invoice) => invoice.dueDate.slice(0, 10) >= today)
        .sort((left, right) => left.dueDate.localeCompare(right.dueDate));

      const attention: AttentionItem[] = [];
      for (const invoice of overdue.items) {
        if (attention.length >= 5) break;
        attention.push({ invoice, kind: "overdue" });
      }
      for (const invoice of drafts.items) {
        if (attention.length >= 5) break;
        attention.push({ invoice, kind: "not_sent" });
      }
      for (const invoice of awaiting) {
        if (attention.length >= 5) break;
        if (attention.some((item) => item.invoice.id === invoice.id)) continue;
        attention.push({ invoice, kind: "awaiting" });
      }

      const sentInvoices = recentInvoices.items
        .filter(
          (invoice) =>
            invoice.status !== "DRAFT" &&
            invoice.status !== "CANCELLED" &&
            invoice.emailStatus === "SENT",
        )
        .sort((left, right) =>
          (right.sentAt ?? right.emailSentAt ?? right.createdAt).localeCompare(
            left.sentAt ?? left.emailSentAt ?? left.createdAt,
          ),
        )
        .slice(0, 5);

      setSummary(summaryResult);
      setAttentionItems(attention);
      setRecentlySent(sentInvoices);
      setRecentlyPaid(payments.items);
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      if (!options?.quiet) {
        setError(err instanceof ApiError ? err.message : "We couldn't load your dashboard.");
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void load({ quiet: true });
    }, 15_000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function handleSend(invoice: Invoice, kind: AttentionKind) {
    setSendingId(invoice.id);
    try {
      await sendInvoice(invoice.id);
      notify(kind === "overdue" ? "Reminder sent" : "Invoice sent successfully");
      await load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to send invoice.", "error");
    } finally {
      setSendingId(null);
    }
  }

  const currency = summary?.currency ?? recentlySent[0]?.currency ?? "USD";

  const statCards = useMemo(
    () =>
      summary
        ? [
            {
              key: "overdue",
              label: "Overdue",
              count: summary.overdue.count,
              amount: summary.overdue.amount,
              href: "/invoices?status=OVERDUE",
              tone: "warning" as const,
              icon: OverdueIcon,
            },
            {
              key: "awaiting",
              label: "Awaiting payment",
              count: summary.awaitingPayment.count,
              amount: summary.awaitingPayment.amount,
              href: "/invoices",
              tone: "default" as const,
              icon: AwaitingIcon,
            },
            {
              key: "not_sent",
              label: "Not sent",
              count: summary.notSent.count,
              amount: summary.notSent.amount,
              href: "/invoices?status=DRAFT",
              tone: "default" as const,
              icon: NotSentIcon,
            },
            {
              key: "paid",
              label: "Paid",
              count: summary.paidInvoices.count,
              amount: summary.paidInvoices.amount,
              href: "/invoices?status=PAID",
              tone: "success" as const,
              icon: PaidIcon,
            },
          ]
        : [],
    [summary],
  );

  if (loading && !summary) {
    return (
      <div className="space-y-8">
        <PageHeader title="Dashboard" description="Your invoices and payments" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <CardSkeleton className="h-64" />
      </div>
    );
  }

  if ((error && !summary) || !summary) {
    return (
      <ErrorState title="We couldn't load your dashboard." message={error} onRetry={() => void load()} />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Your invoices and payments"
        actions={
          canCreateInvoice ? (
            <Link href="/invoices/new" className="inline-flex">
              <Button>+ Create invoice</Button>
            </Link>
          ) : null
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className="group rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-foreground/15 hover:bg-muted-soft/40"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">{card.label}</p>
              <card.icon tone={card.tone} />
            </div>
            <p
              className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums ${
                card.tone === "warning"
                  ? "text-warning"
                  : card.tone === "success"
                    ? "text-success"
                    : "text-foreground"
              }`}
            >
              {card.count}
            </p>
            <p className="mt-1 text-sm tabular-nums text-muted">
              {formatMoney(card.amount, currency)}
            </p>
          </Link>
        ))}
      </div>

      <DashboardSection
        title="Needs attention"
        href="/invoices"
        isEmpty={attentionItems.length === 0}
        empty={
          <EmptyState
            title="You're all caught up"
            description="No invoices need your attention right now."
          />
        }
      >
        <ul className="divide-y divide-border">
          {attentionItems.map(({ invoice, kind }) => (
            <li key={invoice.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
              <Link href={`/invoices/${invoice.id}`} className="min-w-0 flex-1 hover:underline">
                <p className="truncate text-sm font-medium text-foreground">{invoice.invoiceNumber}</p>
                <p className="truncate text-xs text-muted">{invoice.customer.name}</p>
              </Link>
              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                <div className="text-left sm:text-right">
                  <p className="text-sm tabular-nums text-foreground">
                    {formatMoney(invoice.balanceDue, invoice.currency)}
                  </p>
                  <p className="text-xs text-muted">
                    {kind === "not_sent"
                      ? `Created ${invoice.createdAt.slice(0, 10)}`
                      : `Due ${invoice.dueDate.slice(0, 10)}`}
                  </p>
                </div>
                <InvoiceStatusWithViewed
                  status={
                    kind === "not_sent" ? "NOT_SENT" : kind === "overdue" ? "OVERDUE" : invoice.status
                  }
                  viewedAt={invoice.viewedAt}
                  align="end"
                />
                {kind === "not_sent" && canSend ? (
                  <Button
                    variant="secondary"
                    disabled={sendingId === invoice.id}
                    onClick={() => void handleSend(invoice, kind)}
                  >
                    {sendingId === invoice.id ? "Sending…" : "Send invoice"}
                  </Button>
                ) : kind === "overdue" && canSend && invoice.emailStatus === "SENT" ? (
                  <Button
                    variant="secondary"
                    disabled={sendingId === invoice.id}
                    onClick={() => void handleSend(invoice, kind)}
                  >
                    {sendingId === invoice.id ? "Sending…" : "Send reminder"}
                  </Button>
                ) : (
                  <Link href={`/invoices/${invoice.id}`}>
                    <Button variant="secondary">View invoice</Button>
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      </DashboardSection>

      <DashboardSection
        title="Recently sent"
        href="/invoices"
        isEmpty={recentlySent.length === 0}
        empty={<p className="px-5 py-8 text-sm text-muted">No sent invoices yet.</p>}
      >
        <ul className="divide-y divide-border">
          {recentlySent.map((invoice) => (
            <li key={invoice.id}>
              <Link
                href={`/invoices/${invoice.id}`}
                className="flex flex-col gap-2 px-5 py-4 hover:bg-muted-soft sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{invoice.invoiceNumber}</p>
                  <p className="truncate text-xs text-muted">{invoice.customer.name}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <span className="text-sm tabular-nums text-foreground">
                    {formatMoney(invoice.total, invoice.currency)}
                  </span>
                  <InvoiceStatusWithViewed
                    status={invoice.status}
                    viewedAt={invoice.viewedAt}
                    align="end"
                  />
                  <span className="text-xs text-muted">
                    Sent {(invoice.sentAt ?? invoice.emailSentAt ?? invoice.createdAt).slice(0, 10)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </DashboardSection>

      <DashboardSection
        title="Recently paid"
        href="/payments"
        isEmpty={recentlyPaid.length === 0}
        empty={<p className="px-5 py-8 text-sm text-muted">No payments recorded yet.</p>}
      >
        <ul className="divide-y divide-border">
          {recentlyPaid.map((payment) => (
            <li key={payment.id}>
              <Link
                href={`/invoices/${payment.invoiceId}`}
                className="flex flex-col gap-2 px-5 py-4 hover:bg-muted-soft sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {payment.invoice.invoiceNumber}
                  </p>
                  <p className="truncate text-xs text-muted">{payment.customer.name}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <span className="text-sm tabular-nums text-foreground">
                    {formatMoney(payment.amount, payment.currency)}
                  </span>
                  <span className="text-xs text-muted">
                    Paid {(payment.paidAt ?? payment.createdAt).slice(0, 10)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </DashboardSection>
    </div>
  );
}

function DashboardSection({
  title,
  href,
  children,
  empty,
  isEmpty,
}: {
  title: string;
  href: string;
  children: ReactNode;
  empty: ReactNode;
  isEmpty: boolean;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <Link href={href} className="text-xs font-medium text-primary hover:underline">
          View all →
        </Link>
      </div>
      {isEmpty ? empty : children}
    </section>
  );
}

function OverdueIcon({ tone }: { tone: "default" | "warning" | "success" }) {
  return (
    <span
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
        tone === "warning" ? "bg-warning-soft text-warning" : "bg-muted-soft text-muted"
      }`}
      aria-hidden
    >
      !
    </span>
  );
}

function AwaitingIcon({ tone }: { tone: "default" | "warning" | "success" }) {
  return (
    <span
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
        tone === "warning" ? "bg-warning-soft text-warning" : "bg-primary-soft text-primary"
      }`}
      aria-hidden
    >
      ◷
    </span>
  );
}

function NotSentIcon({ tone }: { tone: "default" | "warning" | "success" }) {
  return (
    <span
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
        tone === "warning" ? "bg-warning-soft text-warning" : "bg-muted-soft text-muted"
      }`}
      aria-hidden
    >
      ✉
    </span>
  );
}

function PaidIcon({ tone }: { tone: "default" | "warning" | "success" }) {
  return (
    <span
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
        tone === "success" ? "bg-success-soft text-success" : "bg-muted-soft text-muted"
      }`}
      aria-hidden
    >
      ✓
    </span>
  );
}
