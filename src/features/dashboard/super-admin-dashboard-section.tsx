"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { InvoiceActivityChart, InvoiceStatusChart, RevenueChart } from "@/components/charts";
import { Button } from "@/components/ui/button";
import { DataTable, Table, Td, Th, THead } from "@/components/ui/data-table";
import { SelectInput } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { CardSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatMoney } from "@/lib/invoice-calc";
import type { Dashboard, DashboardDatePreset } from "@/types/dashboard";
import { DateRangeFilter } from "./date-range-filter";
import { StatCard } from "./stat-card";

interface SuperAdminDashboardSectionProps {
  dashboard: Dashboard;
  loading: boolean;
  error: string | null;
  preset: DashboardDatePreset;
  dateFrom: string;
  dateTo: string;
  onPresetChange: (preset: DashboardDatePreset) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
}

type AdminMetric = "revenue" | "invoices" | "paid";

function hasAmount(value: string): boolean {
  return value !== "0" && value !== "0.0000";
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) {
    return "";
  }
  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (minutes < 1) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function SuperAdminDashboardSection({
  dashboard,
  loading,
  error,
  preset,
  dateFrom,
  dateTo,
  onPresetChange,
  onDateFromChange,
  onDateToChange,
}: SuperAdminDashboardSectionProps) {
  const { metrics, currency } = dashboard;
  const [adminMetric, setAdminMetric] = useState<AdminMetric>("revenue");

  const revenue = metrics.revenue;
  const outstanding = metrics.outstandingBalance;
  const overdue = metrics.overdueAmount;

  const rankedAdmins = useMemo(() => {
    const rows = [...dashboard.administratorOverview];
    rows.sort((left, right) => {
      if (adminMetric === "invoices") {
        return right.invoiceCount - left.invoiceCount;
      }
      if (adminMetric === "paid") {
        return right.paidInvoiceCount - left.paidInvoiceCount;
      }
      return Number(right.revenue) - Number(left.revenue);
    });
    return rows.slice(0, 5);
  }, [adminMetric, dashboard.administratorOverview]);

  const alerts = [
    metrics.overdueInvoices > 0
      ? {
          href: "/reports?kind=outstanding",
          title: `${metrics.overdueInvoices} invoice${metrics.overdueInvoices === 1 ? "" : "s"} ${metrics.overdueInvoices === 1 ? "is" : "are"} overdue`,
        }
      : null,
    metrics.failedEmails > 0
      ? {
          href: "/reports?kind=outstanding",
          title: `${metrics.failedEmails} invoice email${metrics.failedEmails === 1 ? "" : "s"} failed`,
        }
      : null,
    metrics.adminsWithoutMembers > 0
      ? {
          href: "/administrators",
          title: `${metrics.adminsWithoutMembers} administrator${metrics.adminsWithoutMembers === 1 ? " has" : "s have"} no members`,
        }
      : null,
  ].filter(Boolean) as Array<{ href: string; title: string }>;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Company Overview"
        description="Monitor organization activity, invoices, revenue, and team performance."
        actions={
          <DateRangeFilter
            preset={preset}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onPresetChange={onPresetChange}
            onDateFromChange={onDateFromChange}
            onDateToChange={onDateToChange}
          />
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue"
          value={loading ? "…" : formatMoney(revenue, currency)}
          hint="Company-wide collected revenue"
        />
        <StatCard
          label="Outstanding"
          value={loading ? "…" : formatMoney(outstanding, currency)}
          hint="Unpaid balance on open invoices"
          tone={!loading && hasAmount(outstanding) ? "warning" : "default"}
        />
        <StatCard
          label="Overdue invoices"
          value={loading ? "…" : String(metrics.overdueInvoices)}
          hint={
            !loading && hasAmount(overdue)
              ? `${formatMoney(overdue, currency)} past due`
              : "Past due and still unpaid"
          }
          tone={!loading && metrics.overdueInvoices > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Payments"
          value={loading ? "…" : formatMoney(revenue, currency)}
          hint="Payments recorded in this period"
        />
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Administrators" value={String(metrics.admins ?? 0)} hint="ADMIN accounts" />
          <StatCard label="Members" value={String(metrics.members ?? 0)} />
          <StatCard label="Customers" value={String(metrics.customers ?? 0)} />
          <StatCard label="Invoices" value={String(metrics.invoices)} hint="Issued in this period" />
        </div>
      )}

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <RevenueChart
          points={dashboard.revenueSeries}
          currency={currency}
          granularity={dashboard.granularity}
          loading={loading}
          error={error}
        />
        <InvoiceStatusChart points={dashboard.invoiceStatusSeries} loading={loading} error={error} />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-foreground">Financial Overview</h2>
          <p className="mt-1 text-xs text-muted">Collected vs still outstanding.</p>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted">Paid revenue</dt>
              <dd className="tabular-nums font-medium">{formatMoney(revenue, currency)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted">Outstanding</dt>
              <dd className="tabular-nums font-medium">{formatMoney(outstanding, currency)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted">Overdue</dt>
              <dd className="tabular-nums font-medium text-warning">{formatMoney(overdue, currency)}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-foreground">Attention Required</h2>
          {alerts.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No critical issues for this period.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {alerts.map((alert) => (
                <li key={alert.title}>
                  <Link href={alert.href} className="block py-3 text-sm font-medium text-foreground hover:underline">
                    {alert.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <InvoiceActivityChart
        created={dashboard.invoiceCreatedSeries}
        sent={dashboard.invoiceSentSeries}
        paid={dashboard.invoicePaidSeries}
        loading={loading}
        error={error}
      />

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Administrator Overview</h2>
            <p className="mt-1 text-xs text-muted">Members, customers, and invoices by administrator.</p>
          </div>
          <Link href="/administrators">
            <Button variant="secondary" size="sm">
              View Administrators
            </Button>
          </Link>
        </div>
        {loading ? (
          <TableSkeleton cols={6} rows={4} />
        ) : dashboard.administratorOverview.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-5 py-8 text-sm text-muted">
            No administrators yet.
          </p>
        ) : (
          <DataTable>
            <Table>
              <THead>
                <tr>
                  <Th>Administrator</Th>
                  <Th>Members</Th>
                  <Th>Customers</Th>
                  <Th>Invoices</Th>
                  <Th>Paid</Th>
                  <Th>Outstanding</Th>
                  <Th className="text-right"> </Th>
                </tr>
              </THead>
              <tbody>
                {dashboard.administratorOverview.map((admin) => (
                  <tr key={admin.administratorId} className="border-t border-border">
                    <Td>
                      <p className="font-medium">{admin.administratorName}</p>
                      <p className="text-xs text-muted">{admin.status === "ACTIVE" ? "Active" : "Inactive"}</p>
                    </Td>
                    <Td muted>{admin.memberCount}</Td>
                    <Td muted>{admin.customerCount}</Td>
                    <Td muted>{admin.invoiceCount}</Td>
                    <Td muted>{formatMoney(admin.revenue, admin.currency)}</Td>
                    <Td muted>{formatMoney(admin.outstanding, admin.currency)}</Td>
                    <Td className="text-right">
                      <Link href="/administrators" className="text-xs font-medium text-primary hover:underline">
                        View Administrator
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </DataTable>
        )}
      </section>

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Activity Overview</h2>
              <p className="mt-1 text-xs text-muted">Administrators ranked by the selected metric.</p>
            </div>
            <SelectInput
              id="admin-metric"
              value={adminMetric}
              onChange={(event) => setAdminMetric(event.target.value as AdminMetric)}
            >
              <option value="revenue">Revenue</option>
              <option value="invoices">Invoices</option>
              <option value="paid">Paid invoices</option>
            </SelectInput>
          </div>
          {rankedAdmins.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No administrator activity in this period.</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {rankedAdmins.map((admin, index) => (
                <li key={admin.administratorId} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted">{index + 1}.</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{admin.administratorName}</span>
                  <span className="tabular-nums text-muted">
                    {adminMetric === "revenue"
                      ? formatMoney(admin.revenue, admin.currency)
                      : adminMetric === "paid"
                        ? admin.paidInvoiceCount
                        : admin.invoiceCount}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-foreground">Invoice Delivery</h2>
          <p className="mt-1 text-xs text-muted">Email status from invoices in this period.</p>
          <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-muted">Sent</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">{dashboard.emailDelivery.sent}</dd>
            </div>
            <div>
              <dt className="text-muted">Failed</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">{dashboard.emailDelivery.failed}</dd>
            </div>
            <div>
              <dt className="text-muted">Not Sent</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">{dashboard.emailDelivery.notSent}</dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Recent Invoice Activity</h2>
            <Link href="/reports" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          {dashboard.recentInvoices.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border px-5 py-8 text-sm text-muted">
              Invoice activity will appear here once invoices are created.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
              {dashboard.recentInvoices.map((invoice) => (
                <li key={invoice.id}>
                  <Link
                    href="/reports"
                    className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-muted-soft"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{invoice.invoiceNumber}</p>
                      <p className="truncate text-xs text-muted">{invoice.customerName}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusBadge status={invoice.status} />
                      <span className="text-sm tabular-nums">
                        {formatMoney(invoice.total, invoice.currency)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Recent Customers</h2>
            <Link href="/administrators" className="text-xs font-medium text-primary hover:underline">
              View All Customers
            </Link>
          </div>
          {dashboard.recentCustomers.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border px-5 py-8 text-sm text-muted">
              Customers will appear here once they are added.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
              {dashboard.recentCustomers.map((customer) => (
                <li key={customer.customerId} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{customer.customerName}</p>
                    <p className="text-xs text-muted">
                      {customer.invoiceCount} invoice{customer.invoiceCount === 1 ? "" : "s"} ·{" "}
                      {relativeTime(customer.createdAt)}
                    </p>
                  </div>
                  <span className="text-sm tabular-nums text-muted">
                    {formatMoney(customer.paid, customer.currency)} paid
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-foreground">Payment Summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Paid</dt>
              <dd className="tabular-nums font-medium">{formatMoney(revenue, currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Pending</dt>
              <dd className="tabular-nums font-medium">{formatMoney(outstanding, currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Overdue</dt>
              <dd className="tabular-nums font-medium">{formatMoney(overdue, currency)}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-foreground">Organization Health</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Administrators</dt>
              <dd>{metrics.admins ?? 0}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Active members</dt>
              <dd>{metrics.members ?? 0}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Customers</dt>
              <dd>{metrics.customers ?? 0}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Invoices</dt>
              <dd>{metrics.invoices}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Overdue invoices</dt>
              <dd className={metrics.overdueInvoices > 0 ? "text-warning" : undefined}>
                {metrics.overdueInvoices}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Failed emails</dt>
              <dd className={metrics.failedEmails > 0 ? "text-warning" : undefined}>{metrics.failedEmails}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-foreground">Quick Actions</h2>
          <div className="mt-4 grid gap-2">
            <Link href="/administrators">
              <Button className="w-full" variant="secondary">
                Add Administrator
              </Button>
            </Link>
            <Link href="/administrators">
              <Button className="w-full" variant="secondary">
                View Administrators
              </Button>
            </Link>
            <Link href="/reports">
              <Button className="w-full" variant="secondary">
                View Reports
              </Button>
            </Link>
            <Link href="/settings/invoice">
              <Button className="w-full" variant="secondary">
                Invoice Settings
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
