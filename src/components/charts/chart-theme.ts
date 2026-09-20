import { formatMoney } from "@/lib/invoice-calc";

export const CHART_HEIGHT = 280;

export const CHART_COLORS = {
  primary: "var(--chart-primary)",
  secondary: "var(--chart-secondary)",
  tertiary: "var(--chart-tertiary)",
  quaternary: "var(--chart-quaternary)",
  muted: "var(--chart-muted)",
  grid: "var(--chart-grid)",
  axis: "var(--chart-axis)",
  success: "var(--chart-success)",
  warning: "var(--chart-warning)",
  danger: "var(--chart-danger)",
  info: "var(--chart-info)",
  neutral: "var(--chart-neutral)",
  /** Semantic series aliases used across dashboards */
  paid: "var(--chart-paid)",
  pending: "var(--chart-sent)",
  partial: "var(--chart-partial)",
  overdue: "var(--chart-overdue)",
  cancelled: "var(--chart-cancelled)",
  draft: "var(--chart-draft)",
  viewed: "var(--chart-viewed)",
  collected: "var(--chart-success)",
  outstanding: "var(--chart-warning)",
};

export const INVOICE_STATUS_COLORS: Record<string, string> = {
  DRAFT: CHART_COLORS.draft,
  SENT: CHART_COLORS.pending,
  VIEWED: CHART_COLORS.viewed,
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
  borderRadius: 10,
  fontSize: 12,
  color: "var(--foreground)",
  boxShadow: "var(--chart-tooltip-shadow)",
  padding: "8px 10px",
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
