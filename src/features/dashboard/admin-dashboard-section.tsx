"use client";

import Link from "next/link";
import {
  CategoryBarChart,
  DistributionChart,
  InvoiceStatusChart,
  RevenueChart,
  TimeSeriesChart,
} from "@/components/charts";
import { CHART_COLORS } from "@/components/charts/chart-theme";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { CardSkeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/invoice-calc";
import { hasPermission } from "@/lib/permissions";
import type { PublicUser } from "@/types/auth";
import type { Dashboard, DashboardDatePreset } from "@/types/dashboard";
import { DateRangeFilter } from "./date-range-filter";
import { AdminForecastSection } from "./admin-forecast-section";
import { StatCard } from "./stat-card";

interface AdminDashboardSectionProps {
  user: PublicUser;
  dashboard: Dashboard;
  scopeLabel: string;
  loading: boolean;
  error: string | null;
  preset: DashboardDatePreset;
  dateFrom: string;
  dateTo: string;
  onPresetChange: (preset: DashboardDatePreset) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
}

export function AdminDashboardSection({
  user,
  dashboard,
  scopeLabel,
  loading,
  error,
  preset,
  dateFrom,
  dateTo,
  onPresetChange,
  onDateFromChange,
  onDateToChange,
}: AdminDashboardSectionProps) {
  const { metrics, currency } = dashboard;
  const canCreateMember = hasPermission(user, "USERS_CREATE");
  const pendingInvoices = Math.max(0, metrics.unpaidInvoices - metrics.overdueInvoices);

  const memberRevenuePoints = dashboard.memberPerformance.map((member) => ({
    label: member.memberName,
    amount: member.revenue,
  }));

  const paymentCollectionPoints = [
    {
      label: "Collected",
      value: Number(metrics.paidAmount),
      color: CHART_COLORS.paid,
    },
    {
      label: "Outstanding",
      value: Number(metrics.outstandingBalance),
      color: CHART_COLORS.overdue,
    },
  ].filter((point) => point.value > 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Office reports"
        description={`${scopeLabel}. Performance for members and business data in your office.`}
        actions={
          <>
            <DateRangeFilter
              preset={preset}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onPresetChange={onPresetChange}
              onDateFromChange={onDateFromChange}
              onDateToChange={onDateToChange}
            />
            {canCreateMember ? (
              <Link href="/members" className="inline-flex">
                <Button>Add member</Button>
              </Link>
            ) : null}
          </>
        }
      />

      {loading && !dashboard ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total members" value={String(metrics.members ?? 0)} hint="In your office" />
        <StatCard label="Total customers" value={String(metrics.customers ?? 0)} hint="Linked to your office" />
        <StatCard label="Total invoices" value={String(metrics.invoices)} hint="Issued in this period" />
        <StatCard
          label="Paid invoices"
          value={String(metrics.paidInvoices)}
          hint="Fully paid in this period"
          tone="success"
        />
        <StatCard
          label="Pending invoices"
          value={String(pendingInvoices)}
          hint="Awaiting payment, not yet overdue"
        />
        <StatCard
          label="Overdue invoices"
          value={String(metrics.overdueInvoices)}
          hint="Past due date"
          tone={metrics.overdueInvoices > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Total revenue"
          value={formatMoney(metrics.revenue, currency)}
          hint="Payments received in this period"
        />
        <StatCard
          label="Outstanding amount"
          value={formatMoney(metrics.outstandingBalance, currency)}
          hint="Unpaid balance on open invoices"
          tone={Number(metrics.outstandingBalance) > 0 ? "warning" : "default"}
        />
      </div>

      {canCreateMember && (metrics.members ?? 0) === 0 ? (
        <section className="rounded-2xl border border-border bg-surface px-5 py-4">
          <p className="text-sm font-medium text-foreground">Add your first member</p>
          <p className="mt-1 text-sm text-muted">
            Members handle customers, invoices, and payments for your office. Reports will populate once
            members start working.
          </p>
          <Link href="/members" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
            Go to members
          </Link>
        </section>
      ) : null}

      <AdminForecastSection currencyHint={currency} />

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <RevenueChart
          points={dashboard.revenueSeries}
          currency={currency}
          granularity={dashboard.granularity}
          loading={loading}
          error={error}
        />
        <InvoiceStatusChart
          points={dashboard.invoiceStatusSeries}
          loading={loading}
          error={error}
        />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <TimeSeriesChart
          title="Invoices over time"
          subtitle="Invoice count by period"
          points={dashboard.invoiceCountSeries}
          currency={currency}
          variant="bar"
          valueKind="count"
          emptyMessage="No invoices were issued in this period."
          loading={loading}
          error={error}
        />
        <CategoryBarChart
          title="Revenue by member"
          subtitle="Payments collected per member in this period"
          points={memberRevenuePoints}
          currency={currency}
          emptyMessage="No member revenue recorded in this period."
          loading={loading}
          error={error}
        />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <DistributionChart
          title="Payment collection"
          subtitle="Collected vs outstanding in this period"
          points={paymentCollectionPoints}
          emptyMessage="No payment activity in this period."
          loading={loading}
          error={error}
          formatValue={(value) => formatMoney(String(value), currency)}
        />
      </div>
    </div>
  );
}
