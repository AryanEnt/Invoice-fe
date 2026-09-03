import { apiRequest } from "@/lib/api/client";
import { healthDataSchema } from "@/schemas";
import type { HealthData } from "@/types/api";

export async function getHealth(): Promise<HealthData> {
  const data = await apiRequest<HealthData>("/api/health");
  return healthDataSchema.parse(data);
}
