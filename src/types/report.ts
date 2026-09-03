import type { UserRole } from "@/types/auth";

export const REPORT_KINDS = [
  "summary",
  "revenue",
  "invoice-status",
  "paid",
  "outstanding",
  "overdue",
  "customer-balances",
  "payments",
  "expenses",
  "tax",
] as const;

export type ReportKind = (typeof REPORT_KINDS)[number];

export const DATE_PRESETS = [
  "today",
  "this_week",
  "this_month",
  "last_month",
  "this_quarter",
  "this_year",
  "custom",
] as const;

export type DatePreset = (typeof DATE_PRESETS)[number];

export interface ReportTable {
  columns: Array<{ key: string; label: string }>;
  rows: Array<Record<string, string>>;
  page: number;
  pageSize: number;
  total: number;
}

export interface Report {
  kind: ReportKind;
  preset: DatePreset;
  dateFrom: string;
  dateTo: string;
  role: UserRole;
  scope: "SYSTEM" | "ORGANIZATION" | "MEMBER" | "ADMIN";
  organizationId: string | null;
  memberId?: string | null;
  currency: string;
  overview: {
    revenue: string;
    taxCollected: string;
    expenses: string;
    payments: string;
    invoices: number;
    paidInvoices: number;
    outstandingBalance: string;
    overdueInvoices: number;
  };
  metrics: Record<string, string | number>;
  series: Array<{ label: string; value: string }>;
  breakdown: Array<{ label: string; value: string }>;
  table: ReportTable;
  organizations: Array<{ id: string; name: string }>;
}

export const REPORT_LABELS: Record<ReportKind, string> = {
  summary: "Summary",
  revenue: "Revenue",
  "invoice-status": "Invoice status",
  paid: "Paid invoices",
  outstanding: "Outstanding invoices",
  overdue: "Overdue invoices",
  "customer-balances": "Customer balances",
  payments: "Payments",
  expenses: "Expenses",
  tax: "Tax summary",
};

export const PRESET_LABELS: Record<DatePreset, string> = {
  today: "Today",
  this_week: "This week",
  this_month: "This month",
  last_month: "Last month",
  this_quarter: "This quarter",
  this_year: "This year",
  custom: "Custom range",
};
