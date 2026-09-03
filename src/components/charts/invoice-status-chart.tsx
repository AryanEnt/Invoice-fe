"use client";

import { DistributionChart } from "./distribution-chart";
import { INVOICE_STATUS_COLORS, INVOICE_STATUS_LABELS } from "./chart-theme";

interface InvoiceStatusChartProps {
  points: Array<{ status: string; count: number }>;
  loading?: boolean;
  error?: string | null;
}

export function InvoiceStatusChart({ points, loading, error }: InvoiceStatusChartProps) {
  return (
    <DistributionChart
      title="Invoice status"
      subtitle="Issued invoices in this period"
      points={points.map((point) => ({
        label: INVOICE_STATUS_LABELS[point.status] ?? point.status.replaceAll("_", " "),
        value: point.count,
        color: INVOICE_STATUS_COLORS[point.status],
      }))}
      emptyMessage="No invoice data available for this period."
      loading={loading}
      error={error}
    />
  );
}
