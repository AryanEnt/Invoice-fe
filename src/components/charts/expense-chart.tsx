"use client";

import { TimeSeriesChart, type TimeSeriesPoint } from "./time-series-chart";

interface ExpenseChartProps {
  points: TimeSeriesPoint[];
  currency: string;
  loading?: boolean;
  error?: string | null;
}

export function ExpenseChart({ points, currency, loading, error }: ExpenseChartProps) {
  return (
    <TimeSeriesChart
      title="Expenses"
      subtitle="Expenses incurred in this period"
      points={points}
      currency={currency}
      variant="bar"
      emptyMessage="No expense data available for this period."
      loading={loading}
      error={error}
    />
  );
}
