import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const administratorSummarySchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
});

export const publicUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
  avatarUrl: z.string().nullable().optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MEMBER"]),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  organizationId: z.string().nullable(),
  permissions: z.array(z.string()),
  administrator: administratorSummarySchema.nullable(),
  lastLoginAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
