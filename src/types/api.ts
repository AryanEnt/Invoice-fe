export interface HealthData {
  status: "ok";
  service: string;
  timestamp: string;
  database: "connected" | "disconnected";
}

export type { ApiError, ApiResponse, ErrorResponse, SuccessResponse } from "@/lib/api/types";
