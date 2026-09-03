import { z } from "zod";
import { organizationSummarySchema } from "@/schemas/admin";
import { addressSchema } from "@/schemas/catalog";
import { paymentSchema } from "@/schemas/payment";

const userSummarySchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
});

export const invoiceItemSchema = z.object({
  id: z.string(),
  productId: z.string().nullable(),
  catalogKind: z.enum(["PRODUCT", "SERVICE"]).nullable(),
  sku: z.string().nullable(),
  unit: z.string().nullable(),
  description: z.string(),
  quantity: z.string(),
  unitPrice: z.string(),
  discount: z.string(),
  taxRate: z.string().nullable(),
  taxAmount: z.string(),
  lineSubtotal: z.string(),
  lineTotal: z.string(),
  sortOrder: z.number(),
});

export const invoiceSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  customerId: z.string(),
  createdById: z.string(),
  assignedMemberId: z.string().nullable(),
  invoiceNumber: z.string(),
  status: z.enum([
    "DRAFT",
    "SENT",
    "VIEWED",
    "PARTIALLY_PAID",
    "PAID",
    "OVERDUE",
    "CANCELLED",
  ]),
  paymentStatus: z.enum(["UNPAID", "PARTIALLY_PAID", "PAID", "NONE"]),
  invoiceDate: z.string(),
  dueDate: z.string(),
  currency: z.string(),
  subtotal: z.string(),
  discountAmount: z.string(),
  taxAmount: z.string(),
  total: z.string(),
  amountPaid: z.string(),
  balanceDue: z.string(),
  notes: z.string().nullable(),
  terms: z.string().nullable(),
  shareUrl: z.string().nullable(),
  emailStatus: z.enum(["NOT_SENT", "SENT", "FAILED"]),
  emailSentAt: z.string().nullable(),
  sentAt: z.string().nullable(),
  viewedAt: z.string().nullable(),
  organization: organizationSummarySchema.nullable(),
  customer: z.object({
    id: z.string(),
    name: z.string(),
    company: z.string().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    taxNumber: z.string().nullable(),
  }),
  createdBy: userSummarySchema,
  assignedMember: userSummarySchema.nullable(),
  billingAddress: addressSchema.nullable(),
  shippingAddress: addressSchema.nullable(),
  items: z.array(invoiceItemSchema),
  payments: z.array(paymentSchema).optional().default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const invoiceListResultSchema = z.object({
  items: z.array(invoiceSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export const invoiceFormSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  organizationId: z.string(),
  invoiceNumber: z.string(),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  currency: z.string().min(1, "Currency is required"),
  notes: z.string(),
  terms: z.string(),
  assignedMemberId: z.string(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        description: z.string().trim().min(1, "Description is required"),
        quantity: z
          .string()
          .min(1, "Quantity is required")
          .refine((value) => Number(value) > 0, "Quantity must be greater than 0"),
        unitPrice: z.string().min(1, "Unit price is required"),
      }),
    )
    .min(1, "Add at least one item"),
});
