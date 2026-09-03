import { apiRequest } from "@/lib/api/client";
import { getApiBaseUrl } from "@/lib/env";
import { ApiError } from "@/lib/api/types";
import { reportSchema } from "@/schemas/report";
import type { DatePreset, Report, ReportKind } from "@/types/report";

export interface ReportQuery {
  kind: ReportKind;
  preset: DatePreset;
  dateFrom?: string;
  dateTo?: string;
  organizationId?: string;
  administratorId?: string;
  memberId?: string;
  page?: number;
}

function queryString(query: ReportQuery): string {
  const params = new URLSearchParams();
  params.set("preset", query.preset);
  if (query.preset === "custom" && query.dateFrom) params.set("dateFrom", query.dateFrom);
  if (query.preset === "custom" && query.dateTo) params.set("dateTo", query.dateTo);
  if (query.organizationId) params.set("organizationId", query.organizationId);
  if (query.administratorId) params.set("administratorId", query.administratorId);
  if (query.memberId) params.set("memberId", query.memberId);
  params.set("page", String(query.page ?? 1));
  return params.toString();
}

export async function getReport(query: ReportQuery): Promise<Report> {
  const data = await apiRequest<{ report: Report }>(
    `/api/reports/${query.kind}?${queryString(query)}`,
  );
  return reportSchema.parse(data.report);
}

export async function downloadReportCsv(query: ReportQuery): Promise<void> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/reports/${query.kind}/csv?${queryString(query)}`,
    { credentials: "include" },
  );
  if (!response.ok) {
    throw new ApiError(response.status, "CSV_ERROR", "Unable to export report.");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${query.kind}-${query.preset}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
