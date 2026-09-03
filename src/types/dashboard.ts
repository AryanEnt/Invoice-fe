import type { InvoiceStatus, PaymentStatus } from "@/types/invoice";
import type { UserRole } from "@/types/auth";

export const DASHBOARD_DATE_PRESETS = [
  "today",
  "this_week",
  "this_month",
  "last_month",
  "last_3_months",
  "last_6_months",
  "this_year",
  "custom",
] as const;

export type DashboardDatePreset = (typeof DASHBOARD_DATE_PRESETS)[number];

export const DASHBOARD_PRESET_LABELS: Record<DashboardDatePreset, string> = {
  today: "Today",
  this_week: "This week",
  this_month: "This month",
  last_month: "Last month",
  last_3_months: "Last 3 months",
  last_6_months: "Last 6 months",
  this_year: "This year",
  custom: "Custom range",
};

export interface DashboardInvoiceSummary {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  total: string;
  amountPaid: string;
  balanceDue: string;
  dueDate: string;
  currency: string;
  customerName: string;
  organizationName: string | null;
}

export interface DashboardPaymentSummary {
  id: string;
  amount: string;
  currency: string;
  paidAt: string | null;
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  organizationName: string | null;
}

export interface DashboardSeriesPoint {
  period: string;
  amount: string;
}

export interface DashboardMemberPerformance {
  memberId: string | null;
  memberName: string;
  invoiceCount: number;
  revenue: string;
  outstanding: string;
}

export interface DashboardTopCustomer {
  customerId: string;
  customerName: string;
  invoiceCount: number;
  total: string;
  paid: string;
  outstanding: string;
}

export interface DashboardOrganizationActivity {
  organizationId: string;
  organizationName: string;
  invoiceCount: number;
  revenue: string;
}

export interface DashboardMoneyByCurrency {
  currency: string;
  amount: string;
}

export interface DashboardEmailDelivery {
  sent: number;
  failed: number;
  notSent: number;
}

export interface DashboardAdministratorOverview {
  administratorId: string;
  administratorName: string;
  status: string;
  memberCount: number;
  customerCount: number;
  invoiceCount: number;
  paidInvoiceCount: number;
  revenue: string;
  outstanding: string;
  currency: string;
}

export interface DashboardRecentCustomer {
  customerId: string;
  customerName: string;
  createdAt: string;
  invoiceCount: number;
  paid: string;
  currency: string;
}

export interface DashboardMetrics {
  organizations: number | null;
  activeOrganizations: number | null;
  inactiveOrganizations: number | null;
  admins: number | null;
  members: number | null;
  customers: number | null;
  invoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  overdueInvoices: number;
  partiallyPaidInvoices: number;
  expenses: string;
  revenue: string;
  paidAmount: string;
  outstandingBalance: string;
  overdueAmount: string;
  draftInvoices: number;
  sentInvoices: number;
  viewedInvoices: number;
  cancelledInvoices: number;
  failedEmails: number;
  adminsWithoutMembers: number;
}

export interface Dashboard {
  role: UserRole;
  scope: "SYSTEM" | "ORGANIZATION" | "MEMBER" | "ADMIN";
  organizationId: string | null;
  currency: string;
  granularity: "day" | "month";
  range: { preset: string; start: string; end: string };
  metrics: DashboardMetrics;
  invoiceStatusSeries: Array<{ status: string; count: number }>;
  revenueSeries: DashboardSeriesPoint[];
  invoiceCountSeries: DashboardSeriesPoint[];
  paymentSeries: DashboardSeriesPoint[];
  expenseSeries: DashboardSeriesPoint[];
  memberPerformance: DashboardMemberPerformance[];
  topCustomers: DashboardTopCustomer[];
  organizationActivity: DashboardOrganizationActivity[];
  recentInvoices: DashboardInvoiceSummary[];
  recentPayments: DashboardPaymentSummary[];
  overdueInvoices: DashboardInvoiceSummary[];
  organizations: Array<{ id: string; name: string }>;
  currencies: string[];
  revenueByCurrency: DashboardMoneyByCurrency[];
  outstandingByCurrency: DashboardMoneyByCurrency[];
  overdueByCurrency: DashboardMoneyByCurrency[];
  emailDelivery: DashboardEmailDelivery;
  invoiceCreatedSeries: DashboardSeriesPoint[];
  invoiceSentSeries: DashboardSeriesPoint[];
  invoicePaidSeries: DashboardSeriesPoint[];
  administratorOverview: DashboardAdministratorOverview[];
  recentCustomers: DashboardRecentCustomer[];
}
