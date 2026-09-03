import { z } from "zod";
import { organizationSummarySchema } from "@/schemas/admin";

export const addressSchema = z.object({
  id: z.string(),
  line1: z.string(),
  line2: z.string().nullable(),
  city: z.string(),
  region: z.string().nullable(),
  postalCode: z.string().nullable(),
  country: z.string(),
});

export const customerSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  company: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  taxNumber: z.string().nullable(),
  notes: z.string().nullable(),
  isActive: z.boolean(),
  invoiceLifecycleStatus: z.enum(["NEW", "OLD"]).default("NEW"),
  unsentInvoice: z
    .object({
      id: z.string(),
      invoiceNumber: z.string(),
      emailStatus: z.enum(["NOT_SENT", "FAILED"]),
    })
    .nullable()
    .default(null),
  billingAddress: addressSchema.nullable(),
  shippingAddress: addressSchema.nullable(),
  organization: organizationSummarySchema.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const customerListResultSchema = z.object({
  items: z.array(customerSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
  counts: z
    .object({
      all: z.number(),
      new: z.number(),
      old: z.number(),
    })
    .default({ all: 0, new: 0, old: 0 }),
});

const optionalAddressFormSchema = z.object({
  line1: z.string(),
  line2: z.string(),
  city: z.string(),
  region: z.string(),
  postalCode: z.string(),
  country: z.string(),
});

export const customerFormSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    company: z.string(),
    email: z
      .string()
      .trim()
      .refine((value) => value.length === 0 || z.string().email().safeParse(value).success, {
        message: "Enter a valid email",
      }),
    phone: z.string(),
    taxNumber: z.string(),
    notes: z.string(),
    organizationId: z.string(),
    isActive: z.boolean(),
    billingAddress: optionalAddressFormSchema,
    shippingAddress: optionalAddressFormSchema,
  })
  .superRefine((values, ctx) => {
    for (const key of ["billingAddress", "shippingAddress"] as const) {
      const address = values[key];
      const filled = Object.values(address).some((value) => value.trim().length > 0);
      if (filled && (!address.line1.trim() || !address.city.trim() || !address.country.trim())) {
        ctx.addIssue({
          code: "custom",
          path: [key, "line1"],
          message: "Line 1, city, and country are required when an address is provided",
        });
      }
    }
  });

export const productSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  kind: z.enum(["PRODUCT", "SERVICE"]),
  name: z.string(),
  description: z.string().nullable(),
  sku: z.string().nullable(),
  unit: z.string().nullable(),
  unitPrice: z.number(),
  currency: z.string(),
  taxRate: z.number().nullable(),
  isActive: z.boolean(),
  organization: organizationSummarySchema.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const productListResultSchema = z.object({
  items: z.array(productSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export const productFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  kind: z.enum(["PRODUCT", "SERVICE"]),
  description: z.string(),
  sku: z.string(),
  unit: z.string(),
  unitPrice: z
    .string()
    .trim()
    .min(1, "Price is required")
    .refine((value) => Number.isFinite(Number(value)) && Number(value) >= 0, {
      message: "Enter a valid price",
    }),
  currency: z.string().trim().min(1, "Currency is required"),
  taxRate: z
    .string()
    .refine(
      (value) =>
        value.trim().length === 0 ||
        (Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 100),
      { message: "Tax must be between 0 and 100" },
    ),
  organizationId: z.string(),
  isActive: z.boolean(),
});
