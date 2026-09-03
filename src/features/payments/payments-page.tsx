"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, Table, Td, Th, THead } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Field, SelectInput, TextInput } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { formatMoney } from "@/lib/invoice-calc";
import { ApiError } from "@/lib/api/types";
import { useAuth } from "@/providers/auth-provider";
import { useWorkspace } from "@/providers/workspace-provider";
import { hasPermission } from "@/lib/permissions";
import { listCustomers } from "@/services/customers.service";
import { listInvoices } from "@/services/invoices.service";
import { listPayments } from "@/services/payments.service";
import type { Customer } from "@/types/catalog";
import type { Invoice } from "@/types/invoice";
import type { PaymentListResult, PaymentRecordStatus } from "@/types/payment";
import { RecordPaymentDialog } from "./record-payment-dialog";

const statuses: PaymentRecordStatus[] = [
  "PENDING",
  "COMPLETED",
  "FAILED",
  "REFUNDED",
  "CANCELLED",
];

export function PaymentsPage() {
  const { user } = useAuth();
  const { organizationId, tenantListsReady, scopeLabel } = useWorkspace();
  const canRecord = hasPermission(user, "PAYMENTS_CREATE");
  const requestIdRef = useRef(0);

  const [result, setResult] = useState<PaymentListResult | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PaymentRecordStatus | "">("");
  const [customerId, setCustomerId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [recordInvoice, setRecordInvoice] = useState<Invoice | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const load = useCallback(async () => {
    if (!tenantListsReady) {
      setResult(null);
      setLoading(false);
      setError(null);
      return;
    }
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const [payments, customerResult, invoiceResult] = await Promise.all([
        listPayments({
          search: search || undefined,
          status,
          customerId: customerId || undefined,
          invoiceId: invoiceId || undefined,
          organizationId: organizationId || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          page,
          pageSize: 10,
        }),
        listCustomers({ pageSize: 50, organizationId: organizationId || undefined }),
        listInvoices({
          pageSize: 50,
          sort: "createdAt",
          sortDir: "desc",
          organizationId: organizationId || undefined,
        }),
      ]);
      if (requestId !== requestIdRef.current) {
        return;
      }
      setResult(payments);
      setCustomers(customerResult.items);
      setInvoices(invoiceResult.items);
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setError(err instanceof ApiError ? err.message : "Unable to load payments.");
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [
    customerId,
    dateFrom,
    dateTo,
    invoiceId,
    organizationId,
    page,
    search,
    status,
    tenantListsReady,
  ]);

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

  const payableInvoices = invoices.filter((invoice) =>
    ["SENT", "VIEWED", "OVERDUE", "PARTIALLY_PAID"].includes(invoice.status),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description={`Record money received against invoices. ${scopeLabel}.`}
        actions={
          canRecord && payableInvoices.length > 0 ? (
            <Button onClick={() => setPickerOpen(true)}>Record payment</Button>
          ) : undefined
        }
      />

      <form
        className="grid gap-3 rounded-2xl border border-border bg-surface p-4 md:grid-cols-3 xl:grid-cols-7"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          void load();
        }}
      >
        <Field label="Search" htmlFor="payment-search">
          <TextInput
            id="payment-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search invoice or customer"
          />
        </Field>
        <Field label="Status" htmlFor="payment-status">
          <SelectInput
            id="payment-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as PaymentRecordStatus | "")}
          >
            <option value="">All</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("_", " ")}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Customer" htmlFor="payment-customer">
          <SelectInput
            id="payment-customer"
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
          >
            <option value="">All</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Invoice" htmlFor="payment-invoice">
          <SelectInput
            id="payment-invoice"
            value={invoiceId}
            onChange={(event) => setInvoiceId(event.target.value)}
          >
            <option value="">All</option>
            {invoices.map((invoice) => (
              <option key={invoice.id} value={invoice.id}>
                {invoice.invoiceNumber}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="From" htmlFor="payment-from">
          <TextInput
            id="payment-from"
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
          />
        </Field>
        <Field label="To" htmlFor="payment-to">
          <TextInput
            id="payment-to"
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
          />
        </Field>
        <div className="flex items-end">
          <Button type="submit">Apply</Button>
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-muted">Loading payments…</p>
      ) : error ? (
        <ErrorState title="We couldn't load your payments." message={error} onRetry={() => void load()} />
      ) : !result || result.items.length === 0 ? (
        <EmptyState
          title={search || status ? "No payments match these filters" : "No payments yet"}
          description="Record a payment after an invoice has been sent."
        />
      ) : (
        <DataTable
          footer={<Pagination page={result.page} totalPages={result.totalPages} onPageChange={setPage} />}
        >
          <Table>
            <THead>
              <tr>
                <Th>Date</Th>
                <Th>Invoice</Th>
                <Th>Customer</Th>
                <Th>Amount</Th>
                <Th>Method</Th>
              </tr>
            </THead>
            <tbody>
              {result.items.map((payment) => (
                <tr key={payment.id} className="border-t border-border hover:bg-muted-soft">
                  <Td muted>{(payment.paidAt ?? payment.createdAt).slice(0, 10)}</Td>
                  <Td>
                    <Link href={`/invoices/${payment.invoiceId}`} className="font-medium hover:underline">
                      {payment.invoice.invoiceNumber}
                    </Link>
                  </Td>
                  <Td muted>{payment.customer.name}</Td>
                  <Td muted>{formatMoney(payment.amount, payment.currency)}</Td>
                  <Td muted>{payment.method.replaceAll("_", " ")}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </DataTable>
      )}

      {pickerOpen ? (
        <Dialog title="Choose an invoice" onClose={() => setPickerOpen(false)}>
          <p className="mb-4 text-sm text-muted">Select the invoice this payment belongs to.</p>
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {payableInvoices.map((invoice) => (
              <button
                key={invoice.id}
                type="button"
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-muted-soft"
                onClick={() => {
                  setPickerOpen(false);
                  setRecordInvoice(invoice);
                }}
              >
                <span className="font-medium text-foreground">{invoice.invoiceNumber}</span>
                <span className="text-muted">{invoice.customer.name}</span>
              </button>
            ))}
          </div>
        </Dialog>
      ) : null}

      {recordInvoice ? (
        <RecordPaymentDialog
          invoice={recordInvoice}
          onClose={() => setRecordInvoice(null)}
          onRecorded={() => {
            setRecordInvoice(null);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}
