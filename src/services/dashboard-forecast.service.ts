import { z } from "zod";
import { apiRequest } from "@/lib/api/client";

export const FORECAST_TREND_PRESETS = [
  "this_month",
  "last_month",
  "last_3_months",
  "this_year",
] as const;

export type ForecastTrendPreset = (typeof FORECAST_TREND_PRESETS)[number];

export const FORECAST_TREND_LABELS: Record<ForecastTrendPreset, string> = {
  this_month: "This month",
  last_month: "Last month",
  last_3_months: "Last 3 months",
  this_year: "This year",
};

const forecastSchema = z.object({
  currency: z.string(),
  hasEnoughData: z.boolean(),
  expectedThisMonth: z.string(),
  expectedNext30Days: z.string(),
  outstandingAmount: z.string(),
  overdueAmount: z.string(),
  target: z.object({
    amount: z.string().nullable(),
    collected: z.string(),
    remaining: z.string(),
    percentComplete: z.number(),
  }),
  insights: z.array(
    z.object({
      id: z.string(),
      message: z.string(),
      tone: z.enum(["neutral", "positive", "warning"]),
    }),
  ),
  trendPreset: z.enum(FORECAST_TREND_PRESETS),
  trendGranularity: z.enum(["day", "month"]),
  trend: z.array(
    z.object({
      period: z.string(),
      collected: z.string(),
      outstanding: z.string(),
    }),
  ),
});

export type DashboardForecast = z.infer<typeof forecastSchema>;

export async function getDashboardForecast(
  trendPreset: ForecastTrendPreset = "this_month",
): Promise<DashboardForecast> {
  const params = new URLSearchParams({ trendPreset });
  const data = await apiRequest<{ forecast: DashboardForecast }>(
    `/api/dashboard/forecast?${params}`,
  );
  return forecastSchema.parse(data.forecast);
}

export async function getCollectionTarget(): Promise<{ amount: string | null }> {
  const data = await apiRequest<{ target: { amount: string | null } }>(
    "/api/dashboard/collection-target",
  );
  return data.target;
}

export async function updateCollectionTarget(amount: string): Promise<{ amount: string }> {
  const data = await apiRequest<{ target: { amount: string } }>("/api/dashboard/collection-target", {
    method: "PATCH",
    body: JSON.stringify({ amount }),
  });
  return data.target;
}
