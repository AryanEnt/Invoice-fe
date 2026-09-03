"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "./chart-card";
import {
  CHART_COLORS,
  formatPeriodLabel,
  formatPlotMoney,
  toPlotNumber,
  tooltipStyle,
} from "./chart-theme";

export interface CollectedOutstandingPoint {
  period: string;
  collected: string;
  outstanding: string;
}

interface CollectedOutstandingChartProps {
  points: CollectedOutstandingPoint[];
  currency: string;
  loading?: boolean;
  error?: string | null;
}

export function CollectedOutstandingChart({
  points,
  currency,
  loading,
  error,
}: CollectedOutstandingChartProps) {
  const data = points.map((point) => ({
    period: point.period,
    label: formatPeriodLabel(point.period),
    collected: toPlotNumber(point.collected),
    outstanding: toPlotNumber(point.outstanding),
  }));

  const empty = data.every((point) => point.collected === 0 && point.outstanding === 0);

  return (
    <ChartCard
      title="Collected vs outstanding"
      subtitle="Forecast trend from invoice due dates and payments received"
      loading={loading}
      error={error}
      empty={empty}
      emptyMessage="No collection activity in this period."
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={64}
            tickFormatter={(value: number) => formatPlotMoney(value, currency)}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, name) => [
              formatPlotMoney(Number(value ?? 0), currency),
              name === "collected" ? "Collected" : "Outstanding",
            ]}
          />
          <Legend
            formatter={(value) => (value === "collected" ? "Collected" : "Outstanding")}
          />
          <Bar dataKey="collected" fill={CHART_COLORS.paid} radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar
            dataKey="outstanding"
            fill={CHART_COLORS.overdue}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
