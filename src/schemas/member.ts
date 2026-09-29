import { z } from "zod";
import { organizationSummarySchema } from "@/schemas/admin";
import { publicUserSchema } from "@/schemas/auth";

export const administratorSummarySchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
});

export const memberUserSchema = publicUserSchema.extend({
  organization: organizationSummarySchema.nullable(),
  administrator: administratorSummarySchema.nullable(),
});

export const memberListResultSchema = z.object({
  items: z.array(memberUserSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export const memberFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Enter a valid email"),
  organizationId: z.string().optional(),
  administratorId: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const credentialUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.string(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});
