import { formatMoney } from "@/lib/invoice-calc";

export const CHART_HEIGHT = 280;

export const CHART_COLORS = {
  primary: "var(--chart-primary)",
  secondary: "var(--chart-secondary)",
  muted: "var(--chart-muted)",
  grid: "var(--chart-grid)",
  axis: "var(--chart-axis)",
  paid: "#141517",
  pending: "#6b6d70",
  partial: "#9a9b9d",
  overdue: "#d41920",
  cancelled: "#c8c9cb",
};

export const INVOICE_STATUS_COLORS: Record<string, string> = {
  DRAFT: CHART_COLORS.muted,
  SENT: CHART_COLORS.pending,
  VIEWED: CHART_COLORS.partial,
  PAID: CHART_COLORS.paid,
  OVERDUE: CHART_COLORS.overdue,
  CANCELLED: CHART_COLORS.cancelled,
  PENDING: CHART_COLORS.pending,
  PARTIALLY_PAID: CHART_COLORS.partial,
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  VIEWED: "Viewed",
  PAID: "Paid",
  OVERDUE: "Overdue",
  CANCELLED: "Cancelled",
  PENDING: "Pending",
  PARTIALLY_PAID: "Partially paid",
};

export const tooltipStyle = {
  backgroundColor: "var(--chart-tooltip-bg)",
  border: "1px solid var(--chart-tooltip-border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--foreground)",
};

export function formatPeriodLabel(period: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(period)) {
    const [year, month, day] = period.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  }
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }
  return period.replaceAll("_", " ");
}

export function formatMoneyLabel(value: string, currency: string): string {
  return formatMoney(value, currency);
}

export function formatPlotMoney(value: number, currency: string): string {
  return formatMoney(String(value), currency);
}

export function hasSeriesAmount(points: Array<{ amount: string }>): boolean {
  return points.some((point) => point.amount !== "0.0000" && point.amount !== "0");
}

export function toPlotNumber(value: string): number {
  return Number(value);
}
