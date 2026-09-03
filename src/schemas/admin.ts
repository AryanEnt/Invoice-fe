import { z } from "zod";
import { publicUserSchema } from "@/schemas/auth";

export const organizationSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  isActive: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  admin: z
    .object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      email: z.string(),
    })
    .nullable()
    .optional(),
  adminCount: z.number().optional(),
  memberCount: z.number().optional(),
  customerCount: z.number().optional(),
  invoiceCount: z.number().optional(),
});

export const organizationFormSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required"),
  slug: z
    .string()
    .trim()
    .refine((value) => value.length === 0 || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value), {
      message: "Slug may only contain lowercase letters, numbers, and hyphens",
    }),
});

export const adminUserSchema = publicUserSchema.extend({
  organization: organizationSummarySchema.nullable(),
  memberCount: z.number().default(0),
});

export const adminListResultSchema = z.object({
  items: z.array(adminUserSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export const createAdminFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Enter a valid email"),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});
