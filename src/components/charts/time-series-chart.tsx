"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
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
  hasSeriesAmount,
  toPlotNumber,
  tooltipStyle,
} from "./chart-theme";

export interface TimeSeriesPoint {
  period: string;
  amount: string;
}

interface TimeSeriesChartProps {
  title: string;
  subtitle?: string;
  points: TimeSeriesPoint[];
  currency: string;
  variant?: "line" | "bar";
  valueKind?: "money" | "count";
  emptyMessage: string;
  loading?: boolean;
  error?: string | null;
}

export function TimeSeriesChart({
  title,
  subtitle,
  points,
  currency,
  variant = "line",
  valueKind = "money",
  emptyMessage,
  loading,
  error,
}: TimeSeriesChartProps) {
  const data = points.map((point) => ({
    period: point.period,
    label: formatPeriodLabel(point.period),
    value: valueKind === "count" ? Number(point.amount) : toPlotNumber(point.amount),
    amount: point.amount,
  }));

  const formatValue = (value: number) =>
    valueKind === "count" ? String(value) : formatPlotMoney(value, currency);

  const Chart = variant === "bar" ? BarChart : LineChart;

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      loading={loading}
      error={error}
      empty={!hasSeriesAmount(points)}
      emptyMessage={emptyMessage}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <Chart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={72}
            tickFormatter={(value: number) => formatValue(value)}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [formatValue(Number(value ?? 0)), title]}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ""}
          />
          {variant === "bar" ? (
            <Bar dataKey="value" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} maxBarSize={36} />
          ) : (
            <Line
              type="monotone"
              dataKey="value"
              stroke={CHART_COLORS.primary}
              strokeWidth={2}
              dot={data.length <= 16}
              activeDot={{ r: 4 }}
            />
          )}
        </Chart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
