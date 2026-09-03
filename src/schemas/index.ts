import { z } from "zod";

export const healthDataSchema = z.object({
  status: z.literal("ok"),
  service: z.string(),
  timestamp: z.string(),
  database: z.enum(["connected", "disconnected"]),
});

export type HealthData = z.infer<typeof healthDataSchema>;
