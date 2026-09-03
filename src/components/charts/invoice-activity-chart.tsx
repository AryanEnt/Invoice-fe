"use client";

import {
  CartesianGrid,
  Legend,
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
  hasSeriesAmount,
  tooltipStyle,
} from "./chart-theme";
import type { TimeSeriesPoint } from "./time-series-chart";

interface InvoiceActivityChartProps {
  created: TimeSeriesPoint[];
  sent: TimeSeriesPoint[];
  paid: TimeSeriesPoint[];
  loading?: boolean;
  error?: string | null;
}

export function InvoiceActivityChart({
  created,
  sent,
  paid,
  loading,
  error,
}: InvoiceActivityChartProps) {
  const periods = created.length ? created : sent.length ? sent : paid;
  const data = periods.map((point, index) => ({
    period: point.period,
    label: formatPeriodLabel(point.period),
    created: Number(created[index]?.amount ?? 0),
    sent: Number(sent[index]?.amount ?? 0),
    paid: Number(paid[index]?.amount ?? 0),
  }));
  const empty =
    !hasSeriesAmount(created) && !hasSeriesAmount(sent) && !hasSeriesAmount(paid);

  return (
    <ChartCard
      title="Invoice activity"
      subtitle="Created, sent, and paid invoices in this period"
      loading={loading}
      error={error}
      empty={empty}
      emptyMessage="Invoice activity will appear here once invoices are created."
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Line type="monotone" dataKey="created" name="Created" stroke={CHART_COLORS.primary} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="sent" name="Sent" stroke={CHART_COLORS.pending} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="paid" name="Paid" stroke={CHART_COLORS.paid} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
