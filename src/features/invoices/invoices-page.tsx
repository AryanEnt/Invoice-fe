"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActionGroup, CopyLinkAction, EditAction, SendEmailAction } from "@/components/ui/action-buttons";
import { Button } from "@/components/ui/button";
import { ClickableRow, DataTable, Table, Td, Th, THead } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Field, SelectInput, TextInput } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/ui/skeleton";
import { StatusBadge, statusLabel } from "@/components/ui/status-badge";
import { InvoiceStatusWithViewed } from "@/components/ui/invoice-status-with-viewed";
import { InvoiceBoard, type InvoiceBoardColumnId } from "@/features/invoices/invoice-board";
import { StatCard } from "@/features/dashboard/stat-card";
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
import { getInvoiceShareLink, getInvoiceSummary, listInvoices, sendInvoice } from "@/services/invoices.service";
import type { AdminUser } from "@/types/admin";
import type { Customer } from "@/types/catalog";
import type { MemberUser } from "@/types/member";
import type { Invoice, InvoiceListResult, InvoiceStatus, InvoiceSummary } from "@/types/invoice";

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

function readStoredView(): InvoiceViewMode {
  if (typeof window === "undefined") {
    return "list";
  }
  return window.sessionStorage.getItem(VIEW_STORAGE_KEY) === "board" ? "board" : "list";
}

export function InvoicesPage() {
  const { user } = useAuth();
  const { organizationId, tenantListsReady, scopeLabel } = useWorkspace();
  const searchParams = useSearchParams();
  const canCreate = hasPermission(user, "INVOICES_CREATE");
  const canUpdate = hasPermission(user, "INVOICES_UPDATE");
  const canSend = hasPermission(user, "INVOICES_SEND");
  const canViewCustomers = hasPermission(user, "CUSTOMERS_VIEW");
  const isMember = user?.role === "MEMBER";
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
        if (!cancelled) {
          setAdministrators(admins.items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAdministrators([]);
        }
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
        if (!cancelled) {
          setMembers([]);
        }
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
      if (view !== "list") {
        setLoading(false);
      }
      return;
    }
    if (datePreset === "custom" && (!customFrom || !customTo)) {
      return;
    }

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
          ? listCustomers({
              pageSize: 50,
              organizationId: organizationId || undefined,
            })
          : Promise.resolve({ items: [] as Customer[] }),
        isMember ? getInvoiceSummary() : Promise.resolve(null),
      ]);
      if (requestId !== requestIdRef.current) {
        return;
      }
      setResult(invoices);
      setCustomers(customerResult.items);
      setSummary(summaryResult);
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setError(err instanceof ApiError ? err.message : "We couldn't load your invoices.");
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
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
    isAdmin,
    isMember,
    isSuperAdmin,
    canFilterByMember,
    canViewCustomers,
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
      if (!cancelled) {
        void loadList();
      }
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [loadList]);

  useEffect(() => {
    if (!isMember || !tenantListsReady) {
      return;
    }
    let cancelled = false;
    void getInvoiceSummary()
      .then((summaryResult) => {
        if (!cancelled) {
          setSummary(summaryResult);
        }
      })
      .catch(() => {
        // Board view can still render without summary cards.
      });
    return () => {
      cancelled = true;
    };
  }, [isMember, tenantListsReady, view]);

  function clearFilters() {
    setSearch("");
    setStatus("");
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
    if (!emailTarget) {
      return;
    }
    setEmailBusy(true);
    setSendingId(emailTarget.id);
    try {
      const updated = await sendInvoice(emailTarget.id);
      setResult((current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) => (item.id === updated.id ? updated : item)),
            }
          : current,
      );
      if (isMember) {
        try {
          setSummary(await getInvoiceSummary());
        } catch {
          // List already updated; summary refresh is best-effort.
        }
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
    } finally {
      setEmailBusy(false);
      setSendingId(null);
    }
  }

  const boardReady =
    tenantListsReady &&
    (datePreset !== "custom" || Boolean(customFrom && customTo));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description={
          isSuperAdmin
            ? `View all company invoices by list or board. Filter by team or member. ${scopeLabel}.`
            : isAdmin
              ? `View your team's invoices by list or board. Filter by member. ${scopeLabel}.`
              : canCreate
                ? `Create, send, and track invoices. ${scopeLabel}.`
                : `Inspect invoices for ${scopeLabel}. Editing is limited to operations members.`
        }
        actions={
          canCreate && isMember ? (
            <Link href="/invoices/new">
              <Button>Create invoice</Button>
            </Link>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-full border border-border bg-surface p-1">
          <button
            type="button"
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition",
              view === "list" ? "bg-primary-soft text-primary" : "text-muted hover:text-foreground",
            )}
            onClick={() => changeView("list")}
          >
            List
          </button>
          <button
            type="button"
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition",
              view === "board" ? "bg-primary-soft text-primary" : "text-muted hover:text-foreground",
            )}
            onClick={() => changeView("board")}
          >
            Board
          </button>
        </div>
      </div>

      {isMember ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="All Invoices" value={String(summary?.all ?? 0)} />
          <StatCard label="Paid Invoices" value={String(summary?.paid ?? 0)} tone="success" />
          <StatCard
            label="Outstanding"
            value={String(summary?.outstanding ?? 0)}
            tone="warning"
            hint="Sent, viewed, overdue, or partially paid"
          />
          <StatCard
            label="Overview"
            value={String(summary?.overview ?? 0)}
            hint="Drafts and overdue needing attention"
          />
          <StatCard label="Void" value={String(summary?.void ?? 0)} />
        </div>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="flex-1">
          <Field label="Search" htmlFor="invoice-search">
            <TextInput
              id="invoice-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search invoices..."
            />
          </Field>
        </div>
        {canFilterByMember ? (
          <>
            {isSuperAdmin ? (
              <div className="w-full sm:w-52">
                <Field label="Team (Administrator)" htmlFor="invoice-admin-filter">
                  <SelectInput
                    id="invoice-admin-filter"
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
              </div>
            ) : null}
            <div className="w-full sm:w-52">
              <Field label="Member" htmlFor="invoice-member-filter">
                <SelectInput
                  id="invoice-member-filter"
                  value={assignedMemberId}
                  onChange={(event) => {
                    setAssignedMemberId(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">
                    {isSuperAdmin && administratorId ? "All team members" : "All members"}
                  </option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.firstName} {member.lastName}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            </div>
          </>
        ) : null}
        <div className="w-full sm:w-48">
          <Field label="Date range" htmlFor="invoice-date-preset">
            <SelectInput
              id="invoice-date-preset"
              value={datePreset}
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
          </Field>
        </div>
        {view === "list" ? (
          <Button variant="secondary" onClick={() => setFiltersOpen((open) => !open)}>
            Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}
          </Button>
        ) : null}
        {hasFilters ? (
          <Button variant="ghost" onClick={clearFilters}>
            Clear all
          </Button>
        ) : null}
      </div>

      {datePreset === "custom" ? (
        <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2">
          <Field label="From" htmlFor="invoice-custom-from" required>
            <TextInput
              id="invoice-custom-from"
              type="date"
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

      {view === "list" && filtersOpen ? (
        <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4 md:grid-cols-3 xl:grid-cols-4">
          <Field label="Status" htmlFor="invoice-status">
            <SelectInput
              id="invoice-status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as InvoiceStatus | "");
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              {statuses.map((value) => (
                <option key={value} value={value}>
                  {statusLabel(value)}
                </option>
              ))}
            </SelectInput>
          </Field>
          {canViewCustomers ? (
            <Field label="Customer" htmlFor="invoice-customer-filter">
              <SelectInput
                id="invoice-customer-filter"
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

      {view === "board" ? (
        !tenantListsReady ? (
          <p className="text-sm text-muted">Loading invoices…</p>
        ) : datePreset === "custom" && (!customFrom || !customTo) ? (
          <EmptyState
            title="Choose a custom range"
            description="Pick From and To dates to load the board."
          />
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
        <TableSkeleton cols={5} />
      ) : error && !result ? (
        <ErrorState title="We couldn't load your invoices." message={error} onRetry={() => void loadList()} />
      ) : !result || result.items.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No invoices match these filters" : "No invoices yet"}
          description={
            hasFilters
              ? "Try a different search or clear the filters."
              : "Create your first invoice to start tracking billing."
          }
          action={
            hasFilters ? (
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : canCreate ? (
              <Link href="/invoices/new">
                <Button>Create invoice</Button>
              </Link>
            ) : null
          }
        />
      ) : (
        <DataTable
          footer={<Pagination page={result.page} totalPages={result.totalPages} onPageChange={setPage} />}
        >
          <Table>
            <THead>
              <tr>
                <Th>Invoice</Th>
                <Th>Customer</Th>
                <Th>Date</Th>
                <Th>Due date</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
                <Th>Email</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </THead>
            <tbody>
              {result.items.map((invoice) => (
                <ClickableRow key={invoice.id} onClick={() => router.push(`/invoices/${invoice.id}`)}>
                  <Td>
                    <span className="font-medium">{invoice.invoiceNumber}</span>
                  </Td>
                  <Td muted>{invoice.customer.name}</Td>
                  <Td muted>{invoice.invoiceDate.slice(0, 10)}</Td>
                  <Td muted>{invoice.dueDate.slice(0, 10)}</Td>
                  <Td className="tabular-nums">{formatMoney(invoice.total, invoice.currency)}</Td>
                  <Td>
                    <InvoiceStatusWithViewed status={invoice.status} viewedAt={invoice.viewedAt} />
                  </Td>
                  <Td>
                    <StatusBadge
                      status={sendingId === invoice.id ? "SENDING" : invoice.emailStatus}
                    />
                  </Td>
                  <Td className="text-right">
                    <div
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      <ActionGroup>
                        <EditAction mode="view" onClick={() => router.push(`/invoices/${invoice.id}`)} />
                        <CopyLinkAction
                          loading={copyBusyId === invoice.id}
                          onClick={() => void handleCopyLink(invoice)}
                        />
                        {canSend && invoice.status !== "CANCELLED" ? (
                          <SendEmailAction
                            label={invoice.emailStatus === "FAILED" ? "Retry" : "Send Email"}
                            disabled={!invoice.customer.email}
                            onClick={() => setEmailTarget(invoice)}
                          />
                        ) : null}
                        {canUpdate && invoice.status === "DRAFT" ? (
                          <EditAction onClick={() => router.push(`/invoices/${invoice.id}/edit`)} />
                        ) : null}
                      </ActionGroup>
                    </div>
                  </Td>
                </ClickableRow>
              ))}
            </tbody>
          </Table>
        </DataTable>
      )}

      {emailTarget ? (
        <Dialog
          title="Send Invoice"
          onClose={() => {
            if (!emailBusy) {
              setEmailTarget(null);
            }
          }}
          footer={
            <>
              <Button variant="secondary" onClick={() => setEmailTarget(null)} disabled={emailBusy}>
                Cancel
              </Button>
              <Button onClick={() => void handleSendEmail()} disabled={emailBusy || !emailTarget.customer.email}>
                {emailBusy ? "Sending…" : "Send Invoice"}
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-sm">
            <p className="text-muted">
              Send {emailTarget.invoiceNumber} to this customer by email. You can resend if it was already sent.
            </p>
            <div className="rounded-xl bg-muted-soft px-3 py-2">
              <p className="text-xs font-medium text-muted">Recipient</p>
              <p className="mt-1 font-medium text-foreground">{emailTarget.customer.email ?? "No email on file"}</p>
              <p className="text-muted">{emailTarget.customer.name}</p>
            </div>
            {emailTarget.emailStatus === "FAILED" ? (
              <p className="text-sm text-primary">Email failed. You can retry sending, or copy the invoice link instead.</p>
            ) : null}
            {!emailTarget.customer.email ? (
              <p className="text-sm text-primary">This customer has no email. Copy the invoice link to share it another way.</p>
            ) : null}
          </div>
        </Dialog>
      ) : null}
    </div>
  );
}
