"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartCard } from "./chart-card";
import { CHART_COLORS, tooltipStyle } from "./chart-theme";

export interface DistributionPoint {
  label: string;
  value: number;
  color?: string;
}

interface DistributionChartProps {
  title: string;
  subtitle?: string;
  points: DistributionPoint[];
  emptyMessage: string;
  loading?: boolean;
  error?: string | null;
  formatValue?: (value: number) => string;
}

export function DistributionChart({
  title,
  subtitle,
  points,
  emptyMessage,
  loading,
  error,
  formatValue = (value) => String(value),
}: DistributionChartProps) {
  const data = points.filter((point) => point.value > 0);

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      loading={loading}
      error={error}
      empty={data.length === 0}
      emptyMessage={emptyMessage}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius="58%"
            outerRadius="80%"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((point) => (
              <Cell key={point.label} fill={point.color ?? CHART_COLORS.primary} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [formatValue(Number(value ?? 0)), ""]}
          />
          <Legend
            verticalAlign="bottom"
            formatter={(value) => <span className="text-xs text-muted">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
