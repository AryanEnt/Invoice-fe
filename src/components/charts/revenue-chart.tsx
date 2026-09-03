"use client";

import { TimeSeriesChart, type TimeSeriesPoint } from "./time-series-chart";

interface RevenueChartProps {
  points: TimeSeriesPoint[];
  currency: string;
  granularity: "day" | "month";
  loading?: boolean;
  error?: string | null;
}

export function RevenueChart({ points, currency, granularity, loading, error }: RevenueChartProps) {
  return (
    <TimeSeriesChart
      title="Revenue overview"
      subtitle={granularity === "day" ? "Collected payments by day" : "Collected payments by month"}
      points={points}
      currency={currency}
      variant="line"
      emptyMessage="No revenue data available for this period."
      loading={loading}
      error={error}
    />
  );
}
