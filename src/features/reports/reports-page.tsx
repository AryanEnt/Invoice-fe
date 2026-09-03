"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { Dialog } from "@/components/ui/dialog";
import { Field, SelectInput, TextArea, TextInput } from "@/components/ui/field";
import { Pagination } from "@/components/ui/pagination";
import { DistributionChart, TimeSeriesChart } from "@/components/charts";
import { StatCard } from "@/features/dashboard/stat-card";
import { formatMoney } from "@/lib/invoice-calc";
import { ApiError } from "@/lib/api/types";
import { hasPermission } from "@/lib/permissions";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { useWorkspace } from "@/providers/workspace-provider";
import { createExpense } from "@/services/expenses.service";
import { listAdmins } from "@/services/admins.service";
import { listAllMembers } from "@/services/members.service";
import { downloadReportCsv, getReport } from "@/services/reports.service";
import {
  DATE_PRESETS,
  PRESET_LABELS,
  REPORT_KINDS,
  REPORT_LABELS,
  type DatePreset,
  type Report,
  type ReportKind,
} from "@/types/report";
import type { AdminUser } from "@/types/admin";
import type { MemberUser } from "@/types/member";

const REPORT_KIND_VALUES = new Set<string>(REPORT_KINDS);

export function ReportsPage() {
  const { user } = useAuth();
  const { organizationId, scopeLabel } = useWorkspace();
  const requestIdRef = useRef(0);
  const { notify } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedKind = searchParams.get("kind");
  const kind: ReportKind =
    requestedKind && REPORT_KIND_VALUES.has(requestedKind) ? (requestedKind as ReportKind) : "summary";
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const canFilterMembers = user?.role === "ADMIN" || isSuperAdmin;
  const [preset, setPreset] = useState<DatePreset>("this_month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [administratorId, setAdministratorId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [administrators, setAdministrators] = useState<AdminUser[]>([]);
  const [members, setMembers] = useState<MemberUser[]>([]);
  const [page, setPage] = useState(1);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expenseOpen, setExpenseOpen] = useState(false);

  function setKind(next: ReportKind) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "summary") {
      params.delete("kind");
    } else {
      params.set("kind", next);
    }
    const query = params.toString();
    router.replace(query ? `/reports?${query}` : "/reports");
    setPage(1);
  }

  useEffect(() => {
    if (!isSuperAdmin) {
      setAdministrators([]);
      return;
    }
    let cancelled = false;
    void listAdmins({ page: 1, pageSize: 50 })
      .then((result) => {
        if (!cancelled) {
          setAdministrators(result.items);
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
    if (!canFilterMembers) {
      setMembers([]);
      return;
    }
    let cancelled = false;
    void listAllMembers({
      status: "ACTIVE",
      organizationId: isSuperAdmin ? undefined : organizationId || undefined,
      administratorId: isSuperAdmin && administratorId ? administratorId : undefined,
    })
      .then((items) => {
        if (!cancelled) {
          setMembers(items);
          setMemberId((current) =>
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
  }, [administratorId, canFilterMembers, isSuperAdmin, organizationId]);

  const load = useCallback(async () => {
    if (preset === "custom" && (!dateFrom || !dateTo)) {
      return;
    }
    const query = {
      kind,
      preset,
      dateFrom: preset === "custom" ? dateFrom : undefined,
      dateTo: preset === "custom" ? dateTo : undefined,
      organizationId: organizationId || undefined,
      administratorId: isSuperAdmin && administratorId ? administratorId : undefined,
      memberId: canFilterMembers && memberId ? memberId : undefined,
      page,
    };
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const next = await getReport(query);
      if (requestId !== requestIdRef.current) {
        return;
      }
      setReport(next);
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setError(err instanceof ApiError ? err.message : "Unable to load report.");
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [
    administratorId,
    canFilterMembers,
    dateFrom,
    dateTo,
    isSuperAdmin,
    kind,
    memberId,
    organizationId,
    page,
    preset,
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

  const canRecordExpense = hasPermission(user, "EXPENSES_CREATE");
  const currency = report?.currency ?? "USD";
  const selectedAdmin = administrators.find((admin) => admin.id === administratorId);
  const selectedMember = members.find((member) => member.id === memberId);
  const scopeDescription = (() => {
    if (selectedMember) {
      return `Financial reports for ${formatMemberLabel(selectedMember).toLowerCase()}. ${scopeLabel}.`;
    }
    if (selectedAdmin) {
      return `Financial reports for ${formatAdminLabel(selectedAdmin)}'s team. ${scopeLabel}.`;
    }
    if (canFilterMembers) {
      return `Financial reports for all members. ${scopeLabel}.`;
    }
    return `Financial reports for your authorized scope. ${scopeLabel}.`;
  })();

  const reportQuery = {
    kind,
    preset,
    dateFrom: preset === "custom" ? dateFrom : undefined,
    dateTo: preset === "custom" ? dateTo : undefined,
    organizationId: organizationId || undefined,
    administratorId: isSuperAdmin && administratorId ? administratorId : undefined,
    memberId: canFilterMembers && memberId ? memberId : undefined,
    page,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={kind === "expenses" ? "Expenses" : "Reports"}
        description={
          kind === "expenses"
            ? `Track expenses for the selected period. ${scopeLabel}.`
            : scopeDescription
        }
        actions={
          <>
            {canRecordExpense && kind === "expenses" ? (
              <Button onClick={() => setExpenseOpen(true)}>Record expense</Button>
            ) : null}
            <Button
              variant="secondary"
              onClick={() =>
                void downloadReportCsv(reportQuery).catch((err) =>
                  notify(err instanceof ApiError ? err.message : "Export failed.", "error"),
                )
              }
            >
              Export CSV
            </Button>
          </>
        }
      />

      <form
        className="grid gap-3 rounded-2xl border border-border bg-surface p-4 md:grid-cols-2 xl:grid-cols-6"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          void load();
        }}
      >
        <Field label="Report" htmlFor="report-kind">
          <SelectInput
            id="report-kind"
            value={kind}
            onChange={(event) => {
              setKind(event.target.value as ReportKind);
              setPage(1);
            }}
          >
            {REPORT_KINDS.map((item) => (
              <option key={item} value={item}>
                {REPORT_LABELS[item]}
              </option>
            ))}
          </SelectInput>
        </Field>
        {isSuperAdmin ? (
          <Field label="Team (Administrator)" htmlFor="report-admin">
            <SelectInput
              id="report-admin"
              value={administratorId}
              onChange={(event) => {
                setAdministratorId(event.target.value);
                setMemberId("");
                setPage(1);
              }}
            >
              <option value="">All teams</option>
              {administrators.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {formatAdminLabel(admin)}
                </option>
              ))}
            </SelectInput>
          </Field>
        ) : null}
        {canFilterMembers ? (
          <Field label="Select Member" htmlFor="report-member">
            <SelectInput
              id="report-member"
              value={memberId}
              onChange={(event) => {
                setMemberId(event.target.value);
                setPage(1);
              }}
            >
              <option value="">
                {administratorId ? "All team members" : "All Members"}
              </option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {formatMemberLabel(member)}
                </option>
              ))}
            </SelectInput>
          </Field>
        ) : null}
        <Field label="Date range" htmlFor="report-preset">
          <SelectInput
            id="report-preset"
            value={preset}
            onChange={(event) => {
              setPreset(event.target.value as DatePreset);
              setPage(1);
            }}
          >
            {DATE_PRESETS.map((item) => (
              <option key={item} value={item}>
                {PRESET_LABELS[item]}
              </option>
            ))}
          </SelectInput>
        </Field>
        {preset === "custom" ? (
          <>
            <Field label="From" htmlFor="report-from" required>
              <TextInput
                id="report-from"
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                required
              />
            </Field>
            <Field label="To" htmlFor="report-to" required>
              <TextInput
                id="report-to"
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                required
              />
            </Field>
          </>
        ) : null}
        <div className="flex items-end">
          <Button type="submit">Apply</Button>
        </div>
      </form>

      {loading && !report ? (
        <p className="text-sm text-muted">Loading report…</p>
      ) : error || !report ? (
        <ErrorState title="We couldn't load this report." message={error} onRetry={() => void load()} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Revenue" value={formatMoney(report.overview.revenue, currency)} />
            <StatCard
              label="Outstanding"
              value={formatMoney(report.overview.outstandingBalance, currency)}
            />
            <StatCard
              label="Overdue invoices"
              value={String(report.overview.overdueInvoices)}
              tone={report.overview.overdueInvoices > 0 ? "warning" : "default"}
            />
            <StatCard
              label={kind === "expenses" ? "Expenses" : "Payments"}
              value={formatMoney(kind === "expenses" ? report.overview.expenses : report.overview.payments, currency)}
            />
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
            <TimeSeriesChart
              title={`${REPORT_LABELS[report.kind]} trend`}
              points={report.series.map((point) => ({
                period: point.label,
                amount: point.value,
              }))}
              currency={currency}
              variant="bar"
              emptyMessage="No report data available for this period."
              loading={loading}
            />
            <DistributionChart
              title="Breakdown"
              points={report.breakdown.map((point) => ({
                label: point.label.replaceAll("_", " "),
                value: Number(point.value),
              }))}
              emptyMessage="No breakdown available for this period."
              loading={loading}
              formatValue={(value) =>
                Number.isInteger(value) ? String(value) : formatMoney(String(value), currency)
              }
            />
          </div>

          <section className="rounded-2xl border border-border bg-surface">
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-sm font-semibold text-foreground">{REPORT_LABELS[report.kind]}</h3>
              <p className="mt-1 text-xs text-muted">
                {report.dateFrom.slice(0, 10)} – {report.dateTo.slice(0, 10)} · {report.scope.replaceAll("_", " ")}
                {selectedAdmin ? ` · ${formatAdminLabel(selectedAdmin)}` : ""}
                {selectedMember ? ` · ${formatMemberLabel(selectedMember)}` : ""}
              </p>
            </div>
            {report.table.rows.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted">No aggregated rows for this range.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-muted-soft text-xs uppercase tracking-wide text-muted">
                    <tr>
                      {report.table.columns.map((column) => (
                        <th key={column.key} className="px-5 py-3 font-medium">
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.table.rows.map((row, index) => (
                      <tr key={`${row[report.table.columns[0]?.key ?? "id"]}-${index}`} className="border-t border-border">
                        {report.table.columns.map((column) => (
                          <td key={column.key} className="px-5 py-3 text-muted">
                            {formatCell(row[column.key], column.key, currency)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {report.table.total > report.table.pageSize ? (
              <div className="border-t border-border px-5 py-3">
                <Pagination
                  page={report.table.page}
                  totalPages={Math.max(1, Math.ceil(report.table.total / report.table.pageSize))}
                  onPageChange={setPage}
                />
              </div>
            ) : null}
          </section>
        </>
      )}

      {expenseOpen ? (
        <ExpenseDialog
          onClose={() => setExpenseOpen(false)}
          onSaved={() => {
            setExpenseOpen(false);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}

function formatMemberLabel(member: MemberUser): string {
  const name = `${member.firstName} ${member.lastName}`.trim();
  return name || member.email;
}

function formatAdminLabel(admin: AdminUser): string {
  const name = `${admin.firstName} ${admin.lastName}`.trim();
  return name || admin.email;
}

function formatCell(value: string | undefined, key: string, currency: string): string {
  if (!value) {
    return "—";
  }
  if (["amount", "total", "balance", "billed", "paid", "taxAmount", "value"].includes(key) && /^-?\d+(\.\d+)?$/.test(value)) {
    return formatMoney(value, currency);
  }
  return value.replaceAll("_", " ");
}

function ExpenseDialog({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const { notify } = useToast();
  const [busy, setBusy] = useState(false);
  const [categoryName, setCategoryName] = useState("Office");
  const [amount, setAmount] = useState("");
  const [incurredOn, setIncurredOn] = useState(new Date().toISOString().slice(0, 10));
  const [vendor, setVendor] = useState("");
  const [notes, setNotes] = useState("");

  async function submit() {
    setBusy(true);
    try {
      await createExpense({
        categoryName,
        amount,
        incurredOn,
        vendor: vendor || undefined,
        notes: notes || undefined,
      });
      notify("Expense recorded");
      onSaved();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to record expense.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      title="Record expense"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Close
          </Button>
          <Button onClick={() => void submit()} disabled={busy || !amount || !categoryName}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Category" htmlFor="exp-cat" required>
          <TextInput
            id="exp-cat"
            value={categoryName}
            onChange={(event) => setCategoryName(event.target.value)}
            required
          />
        </Field>
        <Field label="Amount" htmlFor="exp-amount" required>
          <TextInput
            id="exp-amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />
        </Field>
        <Field label="Date" htmlFor="exp-date" required>
          <TextInput
            id="exp-date"
            type="date"
            value={incurredOn}
            onChange={(event) => setIncurredOn(event.target.value)}
            required
          />
        </Field>
        <Field label="Vendor" htmlFor="exp-vendor">
          <TextInput id="exp-vendor" value={vendor} onChange={(event) => setVendor(event.target.value)} />
        </Field>
        <Field label="Notes" htmlFor="exp-notes">
          <TextArea id="exp-notes" rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </Field>
      </div>
    </Dialog>
  );
}
