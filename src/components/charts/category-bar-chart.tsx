"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "./chart-card";
import { CHART_COLORS, formatPlotMoney, tooltipStyle } from "./chart-theme";

export interface CategoryBarPoint {
  label: string;
  amount: string;
}

interface CategoryBarChartProps {
  title: string;
  subtitle?: string;
  points: CategoryBarPoint[];
  currency: string;
  emptyMessage: string;
  loading?: boolean;
  error?: string | null;
}

export function CategoryBarChart({
  title,
  subtitle,
  points,
  currency,
  emptyMessage,
  loading,
  error,
}: CategoryBarChartProps) {
  const data = points.map((point) => ({
    label: point.label,
    value: Number(point.amount),
  }));

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      loading={loading}
      error={error}
      empty={points.length === 0 || points.every((point) => point.amount === "0.0000" || point.amount === "0")}
      emptyMessage={emptyMessage}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval={0}
          />
          <YAxis
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={72}
            tickFormatter={(value: number) => formatPlotMoney(value, currency)}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [formatPlotMoney(Number(value ?? 0), currency), title]}
          />
          <Bar dataKey="value" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
