"use client";

import { TimeSeriesChart, type TimeSeriesPoint } from "./time-series-chart";

interface PaymentChartProps {
  points: TimeSeriesPoint[];
  currency: string;
  loading?: boolean;
  error?: string | null;
}

export function PaymentChart({ points, currency, loading, error }: PaymentChartProps) {
  return (
    <TimeSeriesChart
      title="Payment overview"
      subtitle="Amount received in this period"
      points={points}
      currency={currency}
      variant="bar"
      emptyMessage="No payment data available for this period."
      loading={loading}
      error={error}
    />
  );
}
