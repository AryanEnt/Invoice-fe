import Link from "next/link";
import { formatMoney } from "@/lib/invoice-calc";
import type { DashboardInvoiceSummary, DashboardPaymentSummary } from "@/types/dashboard";

export function InvoiceSummaryTable({
  title,
  empty,
  invoices,
}: {
  title: string;
  empty: string;
  invoices: DashboardInvoiceSummary[];
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <Link href="/invoices" className="text-xs font-medium text-muted hover:underline">
          View all
        </Link>
      </div>
      {invoices.length === 0 ? (
        <p className="px-5 py-8 text-sm text-muted">{empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted-soft text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Invoice</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Due</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-t border-border">
                  <td className="px-5 py-3 font-medium text-foreground">
                    <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-muted">{invoice.customerName}</td>
                  <td className="px-5 py-3 text-muted">{invoice.dueDate.slice(0, 10)}</td>
                  <td className="px-5 py-3 text-muted">
                    {formatMoney(invoice.total, invoice.currency)}
                  </td>
                  <td className="px-5 py-3 text-muted">{invoice.status.replaceAll("_", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function PaymentSummaryTable({
  title,
  empty,
  payments,
}: {
  title: string;
  empty: string;
  payments: DashboardPaymentSummary[];
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <Link href="/payments" className="text-xs font-medium text-muted hover:underline">
          View all
        </Link>
      </div>
      {payments.length === 0 ? (
        <p className="px-5 py-8 text-sm text-muted">{empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted-soft text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Invoice</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-t border-border">
                  <td className="px-5 py-3 text-muted">
                    {(payment.paidAt ?? "").slice(0, 10) || "—"}
                  </td>
                  <td className="px-5 py-3 font-medium text-foreground">
                    <Link href={`/invoices/${payment.invoiceId}`} className="hover:underline">
                      {payment.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-muted">{payment.customerName}</td>
                  <td className="px-5 py-3 text-muted">
                    {formatMoney(payment.amount, payment.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
