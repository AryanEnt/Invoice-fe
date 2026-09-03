import { apiRequest } from "@/lib/api/client";
import { dashboardSchema } from "@/schemas/dashboard";
import type { Dashboard, DashboardDatePreset } from "@/types/dashboard";

export async function getDashboard(query: {
  organizationId?: string;
  preset?: DashboardDatePreset;
  dateFrom?: string;
  dateTo?: string;
} = {}): Promise<Dashboard> {
  const params = new URLSearchParams();
  if (query.organizationId) {
    params.set("organizationId", query.organizationId);
  }
  if (query.preset) {
    params.set("preset", query.preset);
  }
  if (query.preset === "custom" && query.dateFrom && query.dateTo) {
    params.set("dateFrom", query.dateFrom);
    params.set("dateTo", query.dateTo);
  }
  const qs = params.toString();
  const data = await apiRequest<{ dashboard: Dashboard }>(`/api/dashboard${qs ? `?${qs}` : ""}`);
  return dashboardSchema.parse(data.dashboard);
}
