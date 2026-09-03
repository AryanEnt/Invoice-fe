"use client";

import Link from "next/link";
import { formatMoney } from "@/lib/invoice-calc";
import type { DashboardTopCustomer } from "@/types/dashboard";

interface TopCustomersTableProps {
  customers: DashboardTopCustomer[];
  currency: string;
  loading?: boolean;
  error?: string | null;
}

export function TopCustomersTable({
  customers,
  currency,
  loading,
  error,
}: TopCustomersTableProps) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-surface">
      <header className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Top customers</h3>
          <p className="mt-1 text-xs text-muted">Ranked by invoice amount in this period</p>
        </div>
        <Link href="/customers" className="text-xs font-medium text-primary hover:underline">
          View all
        </Link>
      </header>
      {loading ? (
        <div className="p-5">
          <div className="h-40 animate-pulse rounded-lg bg-muted-soft" />
        </div>
      ) : error ? (
        <p role="alert" className="px-5 py-8 text-sm text-primary">
          {error}
        </p>
      ) : customers.length === 0 ? (
        <p className="px-5 py-8 text-sm text-muted">No customer invoice data available for this period.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted-soft text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Invoices</th>
                <th className="px-5 py-3 font-medium">Invoiced</th>
                <th className="px-5 py-3 font-medium">Paid</th>
                <th className="px-5 py-3 font-medium">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.customerId} className="border-t border-border">
                  <td className="px-5 py-3 font-medium text-foreground">
                    <Link href={`/customers/${customer.customerId}`} className="hover:underline">
                      {customer.customerName}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-muted">{customer.invoiceCount}</td>
                  <td className="px-5 py-3 text-muted">{formatMoney(customer.total, currency)}</td>
                  <td className="px-5 py-3 text-muted">{formatMoney(customer.paid, currency)}</td>
                  <td className="px-5 py-3 text-muted">{formatMoney(customer.outstanding, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
