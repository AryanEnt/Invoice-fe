"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { TextInput } from "@/components/ui/field";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ApiError } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { listCustomers } from "@/services/customers.service";
import { sendInvoice } from "@/services/invoices.service";
import { useToast } from "@/providers/toast-provider";
import type { Customer, CustomerInvoiceLifecycle } from "@/types/catalog";

type LifecycleFilter = "" | CustomerInvoiceLifecycle;

interface InvoiceCustomerPickerProps {
  selectedCustomerId: string;
  canSend?: boolean;
  onSelect: (customer: Customer) => void;
  onCustomerUpdated?: (customer: Customer) => void;
  addedCustomers?: Customer[];
}

export function InvoiceCustomerPicker({
  selectedCustomerId,
  canSend = false,
  onSelect,
  onCustomerUpdated,
  addedCustomers = [],
}: InvoiceCustomerPickerProps) {
  const { notify } = useToast();
  const [search, setSearch] = useState("");
  const [lifecycle, setLifecycle] = useState<LifecycleFilter>("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [counts, setCounts] = useState({ all: 0, new: 0, old: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendBusyId, setSendBusyId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listCustomers({
        status: "ACTIVE",
        search: debouncedSearch || undefined,
        invoiceLifecycle: lifecycle || undefined,
        page: 1,
        pageSize: 100,
      });
      const addedIds = new Set(result.items.map((item) => item.id));
      const extras = addedCustomers.filter((customer) => {
        if (addedIds.has(customer.id)) {
          return false;
        }
        if (lifecycle && customer.invoiceLifecycleStatus !== lifecycle) {
          return false;
        }
        if (!debouncedSearch) {
          return true;
        }
        const haystack = `${customer.name} ${customer.company ?? ""} ${customer.email ?? ""}`.toLowerCase();
        return haystack.includes(debouncedSearch.toLowerCase());
      });
      setCustomers([...extras, ...result.items]);
      setCounts({
        all: result.counts.all + extras.length,
        new:
          result.counts.new +
          extras.filter((customer) => customer.invoiceLifecycleStatus === "NEW").length,
        old:
          result.counts.old +
          extras.filter((customer) => customer.invoiceLifecycleStatus === "OLD").length,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load customers.");
    } finally {
      setLoading(false);
    }
  }, [addedCustomers, debouncedSearch, lifecycle]);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = customers.find((customer) => customer.id === selectedCustomerId) ?? null;

  async function handleSendUnsent(customer: Customer) {
    if (!customer.unsentInvoice) {
      return;
    }
    setSendBusyId(customer.id);
    try {
      await sendInvoice(customer.unsentInvoice.id);
      const updated: Customer = {
        ...customer,
        invoiceLifecycleStatus: "OLD",
        unsentInvoice: null,
      };
      setCustomers((current) => {
        const next = current.map((item) => (item.id === customer.id ? updated : item));
        return lifecycle === "NEW" ? next.filter((item) => item.id !== customer.id) : next;
      });
      setCounts((current) => ({
        all: current.all,
        new: Math.max(0, current.new - 1),
        old: current.old + 1,
      }));
      onCustomerUpdated?.(updated);
      notify("Invoice sent successfully");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Email failed", "error");
      setCustomers((current) =>
        current.map((item) =>
          item.id === customer.id && item.unsentInvoice
            ? {
                ...item,
                unsentInvoice: { ...item.unsentInvoice, emailStatus: "FAILED" },
              }
            : item,
        ),
      );
    } finally {
      setSendBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-foreground">Select Customer</p>
        <p className="mt-1 text-sm text-muted">
          New customers have never successfully received an invoice email.
        </p>
      </div>

      <TextInput
        id="invoice-customer-search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search customers..."
      />

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "" as LifecycleFilter, label: "All", count: counts.all },
            { id: "NEW" as LifecycleFilter, label: "New", count: counts.new },
            { id: "OLD" as LifecycleFilter, label: "Old", count: counts.old },
          ] as const
        ).map((tab) => (
          <button
            key={tab.label}
            type="button"
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
              lifecycle === tab.id
                ? "border-primary bg-primary-soft text-primary"
                : "border-border bg-surface text-muted hover:bg-muted-soft hover:text-foreground",
            )}
            onClick={() => setLifecycle(tab.id)}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading customers…</p>
      ) : error ? (
        <div className="rounded-xl border border-border bg-primary-soft p-3 text-sm text-primary">
          {error}
          <div className="mt-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => void load()}>
              Retry
            </Button>
          </div>
        </div>
      ) : customers.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
          {lifecycle === "NEW"
            ? "No new customers. Everyone here has already received at least one invoice email."
            : lifecycle === "OLD"
              ? "No old customers yet. Send an invoice email to move a customer here."
              : "No customers match this search."}
        </p>
      ) : (
        <div className="max-h-80 overflow-y-auto rounded-xl border border-border">
          <ul className="divide-y divide-border">
            {customers.map((customer) => {
              const active = customer.id === selectedCustomerId;
              return (
                <li key={customer.id}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors",
                      active ? "bg-primary-soft" : "hover:bg-muted-soft",
                    )}
                    onClick={() => onSelect(customer)}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{customer.name}</p>
                      <p className="truncate text-sm text-muted">
                        {customer.email ?? "No email on file"}
                      </p>
                    </div>
                    <StatusBadge status={customer.invoiceLifecycleStatus} />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {selected?.invoiceLifecycleStatus === "NEW" && selected.unsentInvoice ? (
        <div className="rounded-xl border border-border bg-muted-soft p-4">
          <p className="text-sm font-semibold text-foreground">Invoice already created</p>
          <p className="mt-1 text-sm text-muted">
            This customer has an invoice that has not been sent yet (
            {selected.unsentInvoice.invoiceNumber}).
          </p>
          {selected.unsentInvoice.emailStatus === "FAILED" ? (
            <p className="mt-2 text-sm font-medium text-danger">Email failed</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/invoices/${selected.unsentInvoice.id}`}>
              <Button type="button" variant="secondary" size="sm">
                View Invoice
              </Button>
            </Link>
            {canSend ? (
              <Button
                type="button"
                size="sm"
                loading={sendBusyId === selected.id}
                onClick={() => void handleSendUnsent(selected)}
              >
                {selected.unsentInvoice.emailStatus === "FAILED" ? "Retry" : "Send Invoice"}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
