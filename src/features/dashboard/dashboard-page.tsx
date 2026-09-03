"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { InvoiceStatusChart, RevenueChart } from "@/components/charts";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { CardSkeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminDashboardSection } from "@/features/dashboard/admin-dashboard-section";
import { MemberDashboardSection } from "@/features/dashboard/member-dashboard-section";
import { OnboardingCard } from "@/features/dashboard/onboarding-card";
import { SuperAdminDashboardSection } from "@/features/dashboard/super-admin-dashboard-section";
import { formatMoney } from "@/lib/invoice-calc";
import { hasPermission } from "@/lib/permissions";
import { ApiError } from "@/lib/api/types";
import { useAuth } from "@/providers/auth-provider";
import { useWorkspace } from "@/providers/workspace-provider";
import { getDashboard } from "@/services/dashboard.service";
import type { Dashboard, DashboardDatePreset } from "@/types/dashboard";
import { DateRangeFilter } from "./date-range-filter";
import { StatCard } from "./stat-card";

export function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { organizationId, scopeLabel } = useWorkspace();
  const requestIdRef = useRef(0);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [preset, setPreset] = useState<DashboardDatePreset>("this_year");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (preset === "custom" && (!dateFrom || !dateTo)) {
      return;
    }
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const next = await getDashboard({
        organizationId: user?.role === "SUPER_ADMIN" ? undefined : organizationId || undefined,
        preset,
        dateFrom: preset === "custom" ? dateFrom : undefined,
        dateTo: preset === "custom" ? dateTo : undefined,
      });
      if (requestId !== requestIdRef.current) {
        return;
      }
      setDashboard(next);
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setError(err instanceof ApiError ? err.message : "We couldn't load your dashboard.");
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [dateFrom, dateTo, organizationId, preset, user?.role]);

  useEffect(() => {
    if (authLoading || user?.role === "MEMBER") {
      return;
    }
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
  }, [authLoading, load, user?.role]);

  if (authLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Loading your workspace summary." />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <ErrorState title="We couldn't load your dashboard." message="Your session could not be verified." />
    );
  }

  if (user.role === "MEMBER") {
    return <MemberDashboardSection user={user} />;
  }

  if (loading && !dashboard) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Loading your workspace summary." />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if ((error && !dashboard) || !dashboard) {
    return (
      <ErrorState title="We couldn't load your dashboard." message={error} onRetry={() => void load()} />
    );
  }

  if (user.role === "SUPER_ADMIN") {
    return (
      <SuperAdminDashboardSection
        dashboard={dashboard}
        loading={loading}
        error={error}
        preset={preset}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onPresetChange={setPreset}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
      />
    );
  }

  if (user.role === "ADMIN" || dashboard.scope === "ADMIN") {
    return (
      <AdminDashboardSection
        user={user}
        dashboard={dashboard}
        scopeLabel={scopeLabel}
        loading={loading}
        error={error}
        preset={preset}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onPresetChange={setPreset}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
      />
    );
  }

  const { currency } = dashboard;
  const description = `${scopeLabel}. Revenue, receivables, and member activity.`;
  const canCreateInvoice = hasPermission(user, "INVOICES_CREATE");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={description}
        actions={
          <>
            <DateRangeFilter
              preset={preset}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onPresetChange={setPreset}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
            />
            {canCreateInvoice ? (
              <Link href="/invoices/new" className="inline-flex">
                <Button>Create invoice</Button>
              </Link>
            ) : null}
          </>
        }
      />

      {canCreateInvoice && user.role !== "SUPER_ADMIN" ? <OnboardingCard /> : null}

      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
        <RevenueChart
          points={dashboard.revenueSeries}
          currency={currency}
          granularity={dashboard.granularity}
          loading={loading}
        />
        <InvoiceStatusChart points={dashboard.invoiceStatusSeries} loading={loading} />
      </div>

      <NeedsAttention dashboard={dashboard} canOperate={canCreateInvoice} />

      <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2">
        <RecentList
          title="Recent invoices"
          href="/invoices"
          empty="No invoices in this period."
          rows={dashboard.recentInvoices.map((invoice) => ({
            id: invoice.id,
            href: `/invoices/${invoice.id}`,
            primary: invoice.invoiceNumber,
            secondary: invoice.customerName,
            meta: formatMoney(invoice.total, invoice.currency),
            status: invoice.status,
          }))}
        />
        <RecentList
          title="Recent payments"
          href="/payments"
          empty="No payments in this period."
          rows={dashboard.recentPayments.map((payment) => ({
            id: payment.id,
            href: `/invoices/${payment.invoiceId}`,
            primary: formatMoney(payment.amount, payment.currency),
            secondary: payment.invoiceNumber,
            meta: (payment.paidAt ?? "").slice(0, 10) || "—",
          }))}
        />
      </div>
    </div>
  );
}

function NeedsAttention({
  dashboard,
  canOperate,
}: {
  dashboard: Dashboard;
  canOperate: boolean;
}) {
  const items = [
    dashboard.metrics.overdueInvoices > 0
      ? {
          href: "/invoices",
          title: `You have ${dashboard.metrics.overdueInvoices} overdue invoice${dashboard.metrics.overdueInvoices === 1 ? "" : "s"}`,
          detail: `${formatMoney(dashboard.metrics.overdueAmount, dashboard.currency)} in overdue receivables.`,
        }
      : null,
    dashboard.metrics.unpaidInvoices > 0
      ? {
          href: "/invoices",
          title: `You have ${dashboard.metrics.unpaidInvoices} invoice${dashboard.metrics.unpaidInvoices === 1 ? "" : "s"} awaiting payment`,
          detail: "Open invoices that are not fully paid.",
        }
      : null,
    canOperate && dashboard.metrics.customers === 0
      ? {
          href: "/customers",
          title: "Add your first customer",
          detail: "You need a customer before you can create an invoice.",
        }
      : canOperate && dashboard.metrics.invoices === 0
        ? {
            href: "/invoices/new",
            title: "Create your first invoice",
            detail: "Start tracking billing for your customers.",
          }
        : null,
  ].filter(Boolean) as Array<{ href: string; title: string; detail: string }>;

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-foreground">Needs attention</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted">Nothing needs attention in this period.</p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {items.map((item) => (
            <li key={item.title}>
              <Link href={item.href} className="block px-5 py-4 hover:bg-muted-soft">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="mt-1 text-sm text-muted">{item.detail}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RecentList({
  title,
  href,
  empty,
  rows,
}: {
  title: string;
  href: string;
  empty: string;
  rows: Array<{ id: string; href: string; primary: string; secondary: string; meta: string; status?: string }>;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <Link href={href} className="text-xs font-medium text-primary hover:underline">
          View all
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {rows.map((row) => (
            <li key={row.id}>
              <Link href={row.href} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-muted-soft">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{row.primary}</p>
                  <p className="truncate text-xs text-muted">{row.secondary}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {row.status ? <StatusBadge status={row.status} /> : null}
                  <span className="text-sm tabular-nums text-foreground">{row.meta}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
