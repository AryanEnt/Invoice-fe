import { z } from "zod";

export const paymentSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  invoiceId: z.string(),
  customerId: z.string(),
  amount: z.string(),
  currency: z.string(),
  method: z.enum(["CASH", "BANK_TRANSFER", "CHECK", "OTHER", "CARD"]),
  provider: z.enum(["MANUAL", "STRIPE", "PAYPAL"]),
  providerTransactionId: z.string().nullable(),
  status: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED", "CANCELLED"]),
  paidAt: z.string().nullable(),
  notes: z.string().nullable(),
  createdById: z.string(),
  invoice: z.object({ id: z.string(), invoiceNumber: z.string() }),
  customer: z.object({
    id: z.string(),
    name: z.string(),
    company: z.string().nullable(),
  }),
  createdBy: z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const paymentListResultSchema = z.object({
  items: z.array(paymentSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
});
