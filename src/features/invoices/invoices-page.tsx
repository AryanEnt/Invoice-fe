"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, Table, Td, Th, THead } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Field, SelectInput, TextInput } from "@/components/ui/field";
import { Pagination } from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/ui/skeleton";
import { statusLabel } from "@/components/ui/status-badge";
import {
  formatInvoiceDay,
  invoiceEmailAt,
} from "@/features/invoices/invoice-activity";
import { InvoiceBoard, type InvoiceBoardColumnId } from "@/features/invoices/invoice-board";
import { InvoiceQuickDrawer } from "@/features/invoices/invoice-quick-drawer";
import { InvoiceRowActions } from "@/features/invoices/invoice-row-actions";
import { InvoiceStatusPill } from "@/features/invoices/invoice-status-pill";
import { SendingEmailOverlay } from "@/features/invoices/sending-email-overlay";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/cn";
import { copyText } from "@/lib/copy-text";
import { formatMoney } from "@/lib/invoice-calc";
import {
  INVOICE_DATE_PRESET_LABELS,
  INVOICE_DATE_PRESETS,
  resolveInvoiceDatePreset,
  type InvoiceDatePreset,
} from "@/lib/invoice-date-presets";
import { ApiError } from "@/lib/api/types";
import { hasPermission } from "@/lib/permissions";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { useWorkspace } from "@/providers/workspace-provider";
import { listCustomers } from "@/services/customers.service";
import { listAdmins } from "@/services/admins.service";
import { listAllMembers } from "@/services/members.service";
import {
  deleteInvoice,
  getInvoiceShareLink,
  getInvoiceSummary,
  listInvoices,
  sendInvoice,
} from "@/services/invoices.service";
import type { AdminUser } from "@/types/admin";
import type { Customer } from "@/types/catalog";
import type { MemberUser } from "@/types/member";
import type {
  Invoice,
  InvoiceEmailStatus,
  InvoiceListResult,
  InvoiceStatus,
  InvoiceSummary,
} from "@/types/invoice";

const statuses: InvoiceStatus[] = [
  "DRAFT",
  "SENT",
  "VIEWED",
  "PARTIALLY_PAID",
  "PAID",
  "OVERDUE",
  "CANCELLED",
];

const VIEW_STORAGE_KEY = "outinvoice.invoices.view";

type InvoiceViewMode = "list" | "board";
/** Email/activity filter: includes Viewed (viewedAt set). */
type ActivityFilter = "" | InvoiceEmailStatus | "VIEWED";

function readStoredView(): InvoiceViewMode {
  if (typeof window === "undefined") return "list";
  return window.sessionStorage.getItem(VIEW_STORAGE_KEY) === "board" ? "board" : "list";
}

export function InvoicesPage() {
  const { user } = useAuth();
  const { organizationId, tenantListsReady } = useWorkspace();
  const searchParams = useSearchParams();
  const canCreate = hasPermission(user, "INVOICES_CREATE");
  const canUpdate = hasPermission(user, "INVOICES_UPDATE");
  const canSend = hasPermission(user, "INVOICES_SEND");
  const canDelete = hasPermission(user, "INVOICES_DELETE");
  const canViewCustomers = hasPermission(user, "CUSTOMERS_VIEW");
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isAdmin = user?.role === "ADMIN";
  const canFilterByMember = isSuperAdmin || isAdmin;
  const showMemberOnCards = isSuperAdmin || isAdmin;
  const requestIdRef = useRef(0);
  const router = useRouter();
  const { notify } = useToast();

  const [view, setView] = useState<InvoiceViewMode>("list");
  const [result, setResult] = useState<InvoiceListResult | null>(null);
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [administrators, setAdministrators] = useState<AdminUser[]>([]);
  const [members, setMembers] = useState<MemberUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "">("");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("");
  const [customerId, setCustomerId] = useState("");
  const [administratorId, setAdministratorId] = useState("");
  const [assignedMemberId, setAssignedMemberId] = useState("");
  const [datePreset, setDatePreset] = useState<InvoiceDatePreset>("this_month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [emailTarget, setEmailTarget] = useState<Invoice | null>(null);
  const [emailBusy, setEmailBusy] = useState(false);
  const [copyBusyId, setCopyBusyId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [drawerInvoice, setDrawerInvoice] = useState<Invoice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const debouncedSearch = useDebouncedValue(search);

  const dateBounds = useMemo(
    () => resolveInvoiceDatePreset(datePreset, customFrom, customTo),
    [customFrom, customTo, datePreset],
  );

  useEffect(() => {
    setView(readStoredView());
  }, []);

  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam && statuses.includes(statusParam as InvoiceStatus)) {
      setStatus(statusParam as InvoiceStatus);
      setPage(1);
    }
  }, [searchParams]);

  const activeFilterCount = [
    status,
    activityFilter,
    customerId,
    administratorId,
    assignedMemberId,
    datePreset !== "this_month" && datePreset !== "all_time" ? datePreset : "",
    datePreset === "custom" && (customFrom || customTo) ? "custom" : "",
  ].filter(Boolean).length;
  const hasFilters = Boolean(debouncedSearch || activeFilterCount);

  useEffect(() => {
    if (!isSuperAdmin) {
      setAdministrators([]);
      return;
    }
    let cancelled = false;
    void listAdmins({ page: 1, pageSize: 50 })
      .then((admins) => {
        if (!cancelled) setAdministrators(admins.items);
      })
      .catch(() => {
        if (!cancelled) setAdministrators([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!canFilterByMember) {
      setMembers([]);
      return;
    }
    let cancelled = false;
    void listAllMembers({
      status: "ACTIVE",
      administratorId: isSuperAdmin && administratorId ? administratorId : undefined,
    })
      .then((items) => {
        if (!cancelled) {
          setMembers(items);
          setAssignedMemberId((current) =>
            current && !items.some((member) => member.id === current) ? "" : current,
          );
        }
      })
      .catch(() => {
        if (!cancelled) setMembers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [administratorId, canFilterByMember, isSuperAdmin]);

  function changeView(next: InvoiceViewMode) {
    setView(next);
    window.sessionStorage.setItem(VIEW_STORAGE_KEY, next);
  }

  const loadList = useCallback(async () => {
    if (!tenantListsReady || view !== "list") {
      if (view !== "list") setLoading(false);
      return;
    }
    if (datePreset === "custom" && (!customFrom || !customTo)) return;

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const [invoices, customerResult, summaryResult] = await Promise.all([
        listInvoices({
          search: debouncedSearch || undefined,
          status,
          customerId: customerId || undefined,
          organizationId: organizationId || undefined,
          administratorId: isSuperAdmin && administratorId ? administratorId : undefined,
          assignedMemberId: canFilterByMember && assignedMemberId ? assignedMemberId : undefined,
          dateFrom: dateBounds.dateFrom,
          dateTo: dateBounds.dateTo,
          sort,
          sortDir,
          page,
          pageSize: 10,
        }),
        canViewCustomers
          ? listCustomers({ pageSize: 50, organizationId: organizationId || undefined })
          : Promise.resolve({ items: [] as Customer[] }),
        getInvoiceSummary(),
      ]);
      if (requestId !== requestIdRef.current) return;
      setResult(invoices);
      setCustomers(customerResult.items);
      setSummary(summaryResult);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof ApiError ? err.message : "We couldn't load your invoices.");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [
    administratorId,
    assignedMemberId,
    customerId,
    customFrom,
    customTo,
    dateBounds.dateFrom,
    dateBounds.dateTo,
    datePreset,
    debouncedSearch,
    canFilterByMember,
    canViewCustomers,
    isSuperAdmin,
    organizationId,
    page,
    sort,
    sortDir,
    status,
    tenantListsReady,
    view,
  ]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!cancelled) void loadList();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [loadList]);

  useEffect(() => {
    if (!tenantListsReady || view !== "board") return;
    let cancelled = false;
    void getInvoiceSummary()
      .then((summaryResult) => {
        if (!cancelled) setSummary(summaryResult);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [tenantListsReady, view]);

  function clearFilters() {
    setSearch("");
    setStatus("");
    setActivityFilter("");
    setCustomerId("");
    setAdministratorId("");
    setAssignedMemberId("");
    setDatePreset("this_month");
    setCustomFrom("");
    setCustomTo("");
    setSort("createdAt");
    setSortDir("desc");
    setPage(1);
  }

  function handleViewAll(_column: InvoiceBoardColumnId, listStatus: InvoiceStatus | "") {
    setStatus(listStatus);
    setPage(1);
    changeView("list");
    setFiltersOpen(true);
  }

  async function handleCopyLink(invoice: Invoice) {
    setCopyBusyId(invoice.id);
    try {
      const url = await getInvoiceShareLink(invoice.id);
      await copyText(url);
      notify("Invoice link copied");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to copy invoice link.", "error");
    } finally {
      setCopyBusyId(null);
    }
  }

  async function handleSendEmail() {
    if (!emailTarget) return;
    setEmailBusy(true);
    setSendingId(emailTarget.id);
    try {
      const updated = await sendInvoice(emailTarget.id);
      setResult((current) =>
        current
          ? { ...current, items: current.items.map((item) => (item.id === updated.id ? updated : item)) }
          : current,
      );
      setDrawerInvoice((current) => (current?.id === updated.id ? updated : current));
      try {
        setSummary(await getInvoiceSummary());
      } catch {
        /* best-effort */
      }
      setEmailTarget(null);
      notify("Invoice sent successfully");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Email failed", "error");
      setResult((current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) =>
                item.id === emailTarget.id ? { ...item, emailStatus: "FAILED" } : item,
              ),
            }
          : current,
      );
      setDrawerInvoice((current) =>
        current?.id === emailTarget.id ? { ...current, emailStatus: "FAILED" } : current,
      );
    } finally {
      setEmailBusy(false);
      setSendingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await deleteInvoice(deleteTarget.id);
      setResult((current) =>
        current
          ? {
              ...current,
              items: current.items.filter((item) => item.id !== deleteTarget.id),
              total: Math.max(0, current.total - 1),
            }
          : current,
      );
      if (drawerInvoice?.id === deleteTarget.id) setDrawerInvoice(null);
      setDeleteTarget(null);
      notify("Invoice deleted");
      try {
        setSummary(await getInvoiceSummary());
      } catch {
        /* best-effort */
      }
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to delete invoice.", "error");
    } finally {
      setDeleteBusy(false);
    }
  }

  const boardReady =
    tenantListsReady && (datePreset !== "custom" || Boolean(customFrom && customTo));

  const visibleItems = useMemo(() => {
    if (!result) return [];
    if (!activityFilter) return result.items;
    return result.items.filter((invoice) => {
      if (activityFilter === "VIEWED") return Boolean(invoice.viewedAt);
      if (activityFilter === "SENT") {
        return invoice.emailStatus === "SENT" || Boolean(invoiceEmailAt(invoice));
      }
      return invoice.emailStatus === activityFilter;
    });
  }, [activityFilter, result]);

  const pageFrom = result ? (result.page - 1) * result.pageSize + (visibleItems.length ? 1 : 0) : 0;
  const pageTo = result ? (result.page - 1) * result.pageSize + visibleItems.length : 0;

  const filterControlClass = "h-9 w-full min-w-[7.5rem] border-border bg-surface py-0 shadow-none sm:w-auto";

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-foreground">
            Invoices
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Manage invoices, track customer activity, and monitor payments.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <div className="inline-flex rounded-[8px] border border-border bg-surface p-0.5">
            <button
              type="button"
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition",
                view === "list" ? "bg-muted-soft text-foreground" : "text-muted hover:text-foreground",
              )}
              onClick={() => changeView("list")}
            >
              List
            </button>
            <button
              type="button"
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition",
                view === "board" ? "bg-muted-soft text-foreground" : "text-muted hover:text-foreground",
              )}
              onClick={() => changeView("board")}
            >
              Board
            </button>
          </div>
          {canCreate ? (
            <Link href="/invoices/new">
              <Button size="sm" className="h-8 px-3 text-xs">
                + Create Invoice
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      {summary ? (
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Metric
            label="Total"
            value={summary.all}
            tone="neutral"
            icon={
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
                <rect x="2.5" y="3" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M5 6.5h6M5 9h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            }
          />
          <Metric
            label="Draft"
            value={summary.notSent.count}
            tone="draft"
            icon={
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
                <path
                  d="M4.5 2.5h5.2L12 4.8v8.7H4.5V2.5Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                <path d="M9.5 2.5v2.6H12" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
              </svg>
            }
          />
          <Metric
            label="Outstanding"
            value={summary.outstanding}
            tone="outstanding"
            icon={
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
                <circle cx="8" cy="8" r="5.2" stroke="currentColor" strokeWidth="1.2" />
                <path d="M8 5.2v3.2L10 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            }
          />
          <Metric
            label="Paid"
            value={summary.paidInvoices.count}
            tone="paid"
            icon={
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
                <circle cx="8" cy="8" r="5.2" stroke="currentColor" strokeWidth="1.2" />
                <path
                  d="M5.2 8.1 7.1 10l3.7-4"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="rounded-[10px] border border-border bg-surface px-2.5 py-2 sm:px-3">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative min-w-0 w-full lg:w-[42%] lg:shrink-0">
              <span
                className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-muted"
                aria-hidden
              >
                <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
                  <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
                  <path
                    d="M10.5 10.5L14 14"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <TextInput
                id="invoice-search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search invoices or customers"
                aria-label="Search invoices or customers"
                className="h-9 border-border bg-surface py-0 pl-8 shadow-none"
              />
            </div>

            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor="invoice-status">
                Status
              </label>
              <SelectInput
                id="invoice-status"
                className={cn(filterControlClass, status && "border-border bg-muted-soft/60")}
                value={status}
                aria-label="Status filter"
                onChange={(event) => {
                  setStatus(event.target.value as InvoiceStatus | "");
                  setPage(1);
                }}
              >
                <option value="">Status</option>
                {statuses.map((value) => (
                  <option key={value} value={value}>
                    {statusLabel(value)}
                  </option>
                ))}
              </SelectInput>

              <label className="sr-only" htmlFor="invoice-activity-filter">
                Email
              </label>
              <SelectInput
                id="invoice-activity-filter"
                className={cn(filterControlClass, activityFilter && "border-border bg-muted-soft/60")}
                value={activityFilter}
                aria-label="Email activity filter"
                onChange={(event) => {
                  setActivityFilter(event.target.value as ActivityFilter);
                  setPage(1);
                }}
              >
                <option value="">Email</option>
                <option value="NOT_SENT">Not sent</option>
                <option value="SENT">Sent</option>
                <option value="VIEWED">Viewed</option>
                <option value="FAILED">Failed</option>
              </SelectInput>

              <label className="sr-only" htmlFor="invoice-date-preset">
                Date
              </label>
              <SelectInput
                id="invoice-date-preset"
                className={cn(filterControlClass, "min-w-[8.5rem]")}
                value={datePreset}
                aria-label="Date filter"
                onChange={(event) => {
                  setDatePreset(event.target.value as InvoiceDatePreset);
                  setPage(1);
                }}
              >
                {INVOICE_DATE_PRESETS.map((preset) => (
                  <option key={preset} value={preset}>
                    {INVOICE_DATE_PRESET_LABELS[preset]}
                  </option>
                ))}
              </SelectInput>

              <Button
                variant={filtersOpen || activeFilterCount ? "secondary" : "outline"}
                size="sm"
                className="h-9 gap-1.5 px-2.5 text-xs"
                aria-expanded={filtersOpen}
                onClick={() => setFiltersOpen((open) => !open)}
              >
                <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
                  <path
                    d="M2.5 3.5h11M4.5 8h7M6.5 12.5h3"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
                More filters
                {activeFilterCount ? (
                  <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground/90 px-1 text-[10px] font-semibold text-background">
                    {activeFilterCount}
                  </span>
                ) : null}
              </Button>

              {hasFilters ? (
                <Button variant="ghost" size="sm" className="h-9 px-2 text-xs text-muted" onClick={clearFilters}>
                  Reset
                </Button>
              ) : null}
            </div>
          </div>

          {datePreset === "custom" ? (
            <div className="mt-2 grid gap-2 border-t border-border pt-2 sm:grid-cols-2">
              <Field label="From" htmlFor="invoice-custom-from" required>
                <TextInput
                  id="invoice-custom-from"
                  type="date"
                  className="h-9 py-0"
                  value={customFrom}
                  onChange={(event) => {
                    setCustomFrom(event.target.value);
                    setPage(1);
                  }}
                  required
                />
              </Field>
              <Field label="To" htmlFor="invoice-custom-to" required>
                <TextInput
                  id="invoice-custom-to"
                  type="date"
                  className="h-9 py-0"
                  value={customTo}
                  onChange={(event) => {
                    setCustomTo(event.target.value);
                    setPage(1);
                  }}
                  required
                />
              </Field>
            </div>
          ) : null}

          {filtersOpen ? (
            <div className="mt-2 grid gap-2 border-t border-border pt-2 md:grid-cols-2 xl:grid-cols-4">
              {canFilterByMember ? (
                <>
                  {isSuperAdmin ? (
                    <Field label="Team" htmlFor="invoice-admin-filter">
                      <SelectInput
                        id="invoice-admin-filter"
                        className="h-9 py-0"
                        value={administratorId}
                        onChange={(event) => {
                          setAdministratorId(event.target.value);
                          setAssignedMemberId("");
                          setPage(1);
                        }}
                      >
                        <option value="">All teams</option>
                        {administrators.map((admin) => (
                          <option key={admin.id} value={admin.id}>
                            {admin.firstName} {admin.lastName}
                          </option>
                        ))}
                      </SelectInput>
                    </Field>
                  ) : null}
                  <Field label="Member" htmlFor="invoice-member-filter">
                    <SelectInput
                      id="invoice-member-filter"
                      className="h-9 py-0"
                      value={assignedMemberId}
                      onChange={(event) => {
                        setAssignedMemberId(event.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="">All members</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.firstName} {member.lastName}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                </>
              ) : null}
              {canViewCustomers ? (
                <Field label="Customer" htmlFor="invoice-customer-filter">
                  <SelectInput
                    id="invoice-customer-filter"
                    className="h-9 py-0"
                    value={customerId}
                    onChange={(event) => {
                      setCustomerId(event.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">All customers</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
              ) : null}
              <Field label="Sort" htmlFor="invoice-sort">
                <SelectInput
                  id="invoice-sort"
                  className="h-9 py-0"
                  value={`${sort}:${sortDir}`}
                  onChange={(event) => {
                    const [nextSort, nextDir] = event.target.value.split(":");
                    setSort(nextSort);
                    setSortDir(nextDir as "asc" | "desc");
                  }}
                >
                  <option value="createdAt:desc">Newest first</option>
                  <option value="createdAt:asc">Oldest first</option>
                  <option value="dueDate:asc">Due date</option>
                  <option value="total:desc">Highest total</option>
                  <option value="invoiceNumber:asc">Invoice number</option>
                </SelectInput>
              </Field>
            </div>
          ) : null}
        </div>

        {hasFilters ? (
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            {status ? (
              <FilterChip
                label={`Status: ${statusLabel(status)}`}
                onRemove={() => {
                  setStatus("");
                  setPage(1);
                }}
              />
            ) : null}
            {activityFilter ? (
              <FilterChip
                label={`Email: ${
                  activityFilter === "NOT_SENT"
                    ? "Not sent"
                    : activityFilter === "SENT"
                      ? "Sent"
                      : activityFilter === "VIEWED"
                        ? "Viewed"
                        : "Failed"
                }`}
                onRemove={() => {
                  setActivityFilter("");
                  setPage(1);
                }}
              />
            ) : null}
            {customerId ? (
              <FilterChip
                label={`Customer: ${customers.find((c) => c.id === customerId)?.name ?? "Selected"}`}
                onRemove={() => {
                  setCustomerId("");
                  setPage(1);
                }}
              />
            ) : null}
            {assignedMemberId ? (
              <FilterChip
                label={`Member: ${
                  (() => {
                    const member = members.find((m) => m.id === assignedMemberId);
                    return member ? `${member.firstName} ${member.lastName}` : "Selected";
                  })()
                }`}
                onRemove={() => {
                  setAssignedMemberId("");
                  setPage(1);
                }}
              />
            ) : null}
            {administratorId ? (
              <FilterChip
                label={`Team: ${
                  (() => {
                    const admin = administrators.find((a) => a.id === administratorId);
                    return admin ? `${admin.firstName} ${admin.lastName}` : "Selected";
                  })()
                }`}
                onRemove={() => {
                  setAdministratorId("");
                  setAssignedMemberId("");
                  setPage(1);
                }}
              />
            ) : null}
            {debouncedSearch ? (
              <FilterChip
                label={`Search: ${debouncedSearch}`}
                onRemove={() => {
                  setSearch("");
                  setPage(1);
                }}
              />
            ) : null}
          </div>
        ) : null}
      </div>

      {view === "board" ? (
        !tenantListsReady ? (
          <p className="text-sm text-muted">Loading invoices…</p>
        ) : datePreset === "custom" && (!customFrom || !customTo) ? (
          <EmptyState title="Choose a custom range" description="Pick From and To dates to load the board." />
        ) : (
          <InvoiceBoard
            search={debouncedSearch || undefined}
            dateFrom={dateBounds.dateFrom}
            dateTo={dateBounds.dateTo}
            organizationId={organizationId || undefined}
            administratorId={isSuperAdmin && administratorId ? administratorId : undefined}
            assignedMemberId={canFilterByMember && assignedMemberId ? assignedMemberId : undefined}
            showMember={showMemberOnCards}
            enabled={boardReady}
            onViewAll={handleViewAll}
          />
        )
      ) : loading && !result ? (
        <TableSkeleton cols={8} />
      ) : error && !result ? (
        <ErrorState title="We couldn't load your invoices." message={error} onRetry={() => void loadList()} />
      ) : !result || visibleItems.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No invoices match these filters" : "No invoices yet"}
          description={
            hasFilters
              ? "Try a different search or clear the filters."
              : "Create your first invoice to start tracking customer payments and activity."
          }
          action={
            hasFilters ? (
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : canCreate ? (
              <Link href="/invoices/new">
                <Button size="sm">+ Create Invoice</Button>
              </Link>
            ) : null
          }
        />
      ) : (
        <>
          <div className="hidden lg:block">
            <DataTable
              footer={
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted">
                    Showing {pageFrom}–{pageTo} of {result.total} invoices
                    {activityFilter ? " (filtered on this page)" : ""}
                  </p>
                  <Pagination page={result.page} totalPages={result.totalPages} onPageChange={setPage} />
                </div>
              }
            >
              <Table>
                <THead>
                  <tr>
                    <Th className="px-3 py-2.5">Invoice</Th>
                    <Th className="px-3 py-2.5">Customer</Th>
                    <Th className="px-3 py-2.5">Issue date</Th>
                    <Th className="px-3 py-2.5">Due date</Th>
                    <Th className="px-3 py-2.5 text-right">Amount</Th>
                    <Th className="px-3 py-2.5">Status</Th>
                    <Th className="px-3 py-2.5">Email status</Th>
                    <Th className="w-12 px-2 py-2.5 text-right"> </Th>
                  </tr>
                </THead>
                <tbody>
                  {visibleItems.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="group cursor-pointer border-t border-border/80 transition-colors duration-100 hover:bg-muted-soft/50"
                      onClick={() => setDrawerInvoice(invoice)}
                    >
                      <Td className="px-3 py-2.5">
                        <span className="text-sm font-medium tracking-tight text-foreground">
                          {invoice.invoiceNumber}
                        </span>
                      </Td>
                      <Td className="max-w-[12rem] truncate px-3 py-2.5 text-sm font-medium">
                        {invoice.customer.name}
                      </Td>
                      <Td className="px-3 py-2.5 text-sm text-muted" muted>
                        {formatInvoiceDay(invoice.invoiceDate)}
                      </Td>
                      <Td className="px-3 py-2.5 text-sm text-muted" muted>
                        {formatInvoiceDay(invoice.dueDate)}
                      </Td>
                      <Td className="px-3 py-2.5 text-right text-sm font-semibold tabular-nums text-foreground">
                        {formatMoney(invoice.total, invoice.currency)}
                      </Td>
                      <Td className="px-3 py-2.5">
                        <InvoiceStatusPill status={invoice.status} />
                      </Td>
                      <Td className="px-3 py-2.5">
                        <div onClick={(event) => event.stopPropagation()}>
                          <CompactEmailStatus
                            invoice={invoice}
                            sending={sendingId === invoice.id}
                            canSend={canSend}
                            onRetry={() => setEmailTarget(invoice)}
                          />
                        </div>
                      </Td>
                      <Td className="px-2 py-2.5 text-right">
                        <div onClick={(event) => event.stopPropagation()}>
                          <InvoiceRowActions
                            invoice={invoice}
                            canSend={canSend}
                            canUpdate={canUpdate}
                            canDelete={canDelete}
                            copyBusy={copyBusyId === invoice.id}
                            onView={() => setDrawerInvoice(invoice)}
                            onCopyLink={() => void handleCopyLink(invoice)}
                            onSendEmail={() => setEmailTarget(invoice)}
                            onEdit={() => router.push(`/invoices/${invoice.id}/edit`)}
                            onDelete={() => setDeleteTarget(invoice)}
                          />
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </DataTable>
          </div>

          <div className="space-y-2 lg:hidden">
            {visibleItems.map((invoice) => (
              <article
                key={invoice.id}
                className="rounded-[10px] border border-border bg-surface p-3"
                onClick={() => setDrawerInvoice(invoice)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{invoice.invoiceNumber}</p>
                    <p className="mt-0.5 truncate text-sm text-foreground">{invoice.customer.name}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <InvoiceStatusPill status={invoice.status} />
                    <div onClick={(event) => event.stopPropagation()}>
                      <InvoiceRowActions
                        invoice={invoice}
                        canSend={canSend}
                        canUpdate={canUpdate}
                        canDelete={canDelete}
                        copyBusy={copyBusyId === invoice.id}
                        onView={() => setDrawerInvoice(invoice)}
                        onCopyLink={() => void handleCopyLink(invoice)}
                        onSendEmail={() => setEmailTarget(invoice)}
                        onEdit={() => router.push(`/invoices/${invoice.id}/edit`)}
                        onDelete={() => setDeleteTarget(invoice)}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <div className="text-xs text-muted">
                    <p>Issued {formatInvoiceDay(invoice.invoiceDate)}</p>
                    <p>Due {formatInvoiceDay(invoice.dueDate)}</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums text-foreground">
                    {formatMoney(invoice.total, invoice.currency)}
                  </p>
                </div>
                <div className="mt-2 border-t border-border/80 pt-2" onClick={(e) => e.stopPropagation()}>
                  <CompactEmailStatus
                    invoice={invoice}
                    sending={sendingId === invoice.id}
                    canSend={canSend}
                    onRetry={() => setEmailTarget(invoice)}
                  />
                </div>
              </article>
            ))}
            <div className="flex flex-col gap-2 rounded-[10px] border border-border bg-surface px-3 py-2.5">
              <p className="text-xs text-muted">
                Showing {pageFrom}–{pageTo} of {result.total} invoices
              </p>
              <Pagination page={result.page} totalPages={result.totalPages} onPageChange={setPage} />
            </div>
          </div>
        </>
      )}

      {drawerInvoice ? (
        <InvoiceQuickDrawer
          invoice={drawerInvoice}
          sending={sendingId === drawerInvoice.id}
          copyBusy={copyBusyId === drawerInvoice.id}
          canSend={canSend}
          canUpdate={canUpdate}
          onClose={() => setDrawerInvoice(null)}
          onCopyLink={() => void handleCopyLink(drawerInvoice)}
          onSendEmail={() => setEmailTarget(drawerInvoice)}
          onEdit={() => router.push(`/invoices/${drawerInvoice.id}/edit`)}
          onOpenFull={() => router.push(`/invoices/${drawerInvoice.id}`)}
        />
      ) : null}

      {emailTarget ? (
        <Dialog
          title="Send Invoice"
          onClose={() => {
            if (!emailBusy) setEmailTarget(null);
          }}
          footer={
            <>
              <Button variant="secondary" onClick={() => setEmailTarget(null)} disabled={emailBusy}>
                Cancel
              </Button>
              <Button
                loading={emailBusy}
                onClick={() => void handleSendEmail()}
                disabled={emailBusy || !emailTarget.customer.email}
              >
                {emailBusy ? "Sending…" : "Send Invoice"}
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-sm">
            <p className="text-muted">
              Send {emailTarget.invoiceNumber} to this customer by email.
            </p>
            <div className="rounded-xl bg-muted-soft px-3 py-2">
              <p className="text-xs font-medium text-muted">Recipient</p>
              <p className="mt-1 font-medium text-foreground">
                {emailTarget.customer.email ?? "No email on file"}
              </p>
              <p className="text-muted">{emailTarget.customer.name}</p>
            </div>
            {emailTarget.emailStatus === "FAILED" ? (
              <p className="text-sm text-primary">Email failed. You can retry sending.</p>
            ) : null}
          </div>
        </Dialog>
      ) : null}

      <SendingEmailOverlay
        open={emailBusy}
        invoiceNumber={emailTarget?.invoiceNumber}
        recipient={emailTarget?.customer.email}
      />

      {deleteTarget ? (
        <Dialog
          title="Delete Invoice"
          onClose={() => {
            if (!deleteBusy) setDeleteTarget(null);
          }}
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleteBusy}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => void handleDelete()} disabled={deleteBusy}>
                {deleteBusy ? "Deleting…" : "Delete"}
              </Button>
            </>
          }
        >
          <p className="text-sm text-muted">
            Delete draft invoice{" "}
            <span className="font-medium text-foreground">{deleteTarget.invoiceNumber}</span>? This cannot
            be undone.
          </p>
        </Dialog>
      ) : null}
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: "neutral" | "draft" | "outstanding" | "paid";
  icon: ReactNode;
}) {
  const toneStyles = {
    neutral: {
      card: "border-border bg-surface",
      icon: "bg-muted-soft text-muted",
      value: "text-foreground",
    },
    draft: {
      card: "border-sky-100 bg-sky-50/40",
      icon: "bg-sky-100/80 text-sky-700",
      value: "text-sky-900",
    },
    outstanding: {
      card: "border-warning/15 bg-warning-soft/40",
      icon: "bg-warning-soft text-warning",
      value: "text-warning",
    },
    paid: {
      card: "border-success/15 bg-success-soft/50",
      icon: "bg-success-soft text-success",
      value: "text-success",
    },
  }[tone];

  return (
    <div className={cn("rounded-[10px] border px-3 py-2.5", toneStyles.card)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted">{label}</p>
        <span
          className={cn(
            "inline-flex h-6 w-6 items-center justify-center rounded-md",
            toneStyles.icon,
          )}
        >
          {icon}
        </span>
      </div>
      <p className={cn("mt-1 text-2xl font-semibold tabular-nums tracking-tight", toneStyles.value)}>
        {value}
      </p>
    </div>
  );
}

function CompactEmailStatus({
  invoice,
  sending,
  canSend,
  onRetry,
}: {
  invoice: Invoice;
  sending?: boolean;
  canSend?: boolean;
  onRetry?: () => void;
}) {
  if (sending) {
    return (
      <span className="inline-flex h-6 items-center rounded-md bg-warning-soft/80 px-1.5 text-[11px] font-medium text-warning ring-1 ring-inset ring-warning/20">
        Sending…
      </span>
    );
  }

  if (invoice.emailStatus === "FAILED") {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-flex h-6 items-center rounded-md bg-danger-soft/80 px-1.5 text-[11px] font-medium text-danger ring-1 ring-inset ring-danger/20">
          Failed
        </span>
        {canSend && invoice.customer.email && onRetry ? (
          <button
            type="button"
            className="text-[11px] font-medium text-primary underline-offset-2 hover:underline"
            onClick={(event) => {
              event.stopPropagation();
              onRetry();
            }}
          >
            Retry
          </button>
        ) : null}
      </span>
    );
  }

  if (invoice.viewedAt) {
    return (
      <span className="inline-flex h-6 items-center rounded-md bg-sky-50 px-1.5 text-[11px] font-medium text-sky-800 ring-1 ring-inset ring-sky-200/70">
        Viewed
      </span>
    );
  }

  if (invoice.emailStatus === "SENT" || invoiceEmailAt(invoice)) {
    return (
      <span className="inline-flex h-6 items-center rounded-md bg-success-soft/80 px-1.5 text-[11px] font-medium text-success ring-1 ring-inset ring-success/20">
        Sent
      </span>
    );
  }

  return (
    <span className="inline-flex h-6 items-center rounded-md bg-muted-soft px-1.5 text-[11px] font-medium text-muted ring-1 ring-inset ring-border">
      Not sent
    </span>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-muted-soft/60 py-0.5 pl-2 pr-0.5 text-[11px] font-medium text-foreground">
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted transition-colors hover:bg-surface hover:text-foreground"
        aria-label={`Remove filter ${label}`}
      >
        <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3" aria-hidden>
          <path d="M3 3l6 6M9 3L3 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
    </span>
  );
}
