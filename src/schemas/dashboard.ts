import { z } from "zod";

const invoiceSummarySchema = z.object({
  id: z.string(),
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
  total: z.string(),
  amountPaid: z.string(),
  balanceDue: z.string(),
  dueDate: z.string(),
  currency: z.string(),
  customerName: z.string(),
  organizationName: z.string().nullable(),
});

const paymentSummarySchema = z.object({
  id: z.string(),
  amount: z.string(),
  currency: z.string(),
  paidAt: z.string().nullable(),
  invoiceId: z.string(),
  invoiceNumber: z.string(),
  customerName: z.string(),
  organizationName: z.string().nullable(),
});

const seriesPointSchema = z.object({
  period: z.string(),
  amount: z.string(),
});

const moneyByCurrencySchema = z.object({
  currency: z.string(),
  amount: z.string(),
});

export const dashboardSchema = z.object({
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MEMBER"]),
  scope: z.enum(["SYSTEM", "ORGANIZATION", "MEMBER", "ADMIN"]),
  organizationId: z.string().nullable(),
  currency: z.string(),
  granularity: z.enum(["day", "month"]),
  range: z.object({
    preset: z.string(),
    start: z.string(),
    end: z.string(),
  }),
  metrics: z.object({
    organizations: z.number().nullable(),
    activeOrganizations: z.number().nullable(),
    inactiveOrganizations: z.number().nullable(),
    admins: z.number().nullable(),
    members: z.number().nullable(),
    customers: z.number().nullable(),
    invoices: z.number(),
    paidInvoices: z.number(),
    unpaidInvoices: z.number(),
    overdueInvoices: z.number(),
    partiallyPaidInvoices: z.number(),
    expenses: z.string(),
    revenue: z.string(),
    paidAmount: z.string(),
    outstandingBalance: z.string(),
    overdueAmount: z.string(),
    draftInvoices: z.number().default(0),
    sentInvoices: z.number().default(0),
    viewedInvoices: z.number().default(0),
    cancelledInvoices: z.number().default(0),
    failedEmails: z.number().default(0),
    adminsWithoutMembers: z.number().default(0),
  }),
  invoiceStatusSeries: z.array(z.object({ status: z.string(), count: z.number() })),
  revenueSeries: z.array(seriesPointSchema),
  invoiceCountSeries: z.array(seriesPointSchema),
  paymentSeries: z.array(seriesPointSchema),
  expenseSeries: z.array(seriesPointSchema),
  memberPerformance: z.array(
    z.object({
      memberId: z.string().nullable(),
      memberName: z.string(),
      invoiceCount: z.number(),
      revenue: z.string(),
      outstanding: z.string(),
    }),
  ),
  topCustomers: z.array(
    z.object({
      customerId: z.string(),
      customerName: z.string(),
      invoiceCount: z.number(),
      total: z.string(),
      paid: z.string(),
      outstanding: z.string(),
    }),
  ),
  organizationActivity: z.array(
    z.object({
      organizationId: z.string(),
      organizationName: z.string(),
      invoiceCount: z.number(),
      revenue: z.string(),
    }),
  ),
  recentInvoices: z.array(invoiceSummarySchema),
  recentPayments: z.array(paymentSummarySchema),
  overdueInvoices: z.array(invoiceSummarySchema),
  organizations: z.array(z.object({ id: z.string(), name: z.string() })),
  currencies: z.array(z.string()).default([]),
  revenueByCurrency: z.array(moneyByCurrencySchema).default([]),
  outstandingByCurrency: z.array(moneyByCurrencySchema).default([]),
  overdueByCurrency: z.array(moneyByCurrencySchema).default([]),
  emailDelivery: z
    .object({
      sent: z.number(),
      failed: z.number(),
      notSent: z.number(),
    })
    .default({ sent: 0, failed: 0, notSent: 0 }),
  invoiceCreatedSeries: z.array(seriesPointSchema).default([]),
  invoiceSentSeries: z.array(seriesPointSchema).default([]),
  invoicePaidSeries: z.array(seriesPointSchema).default([]),
  administratorOverview: z
    .array(
      z.object({
        administratorId: z.string(),
        administratorName: z.string(),
        status: z.string(),
        memberCount: z.number(),
        customerCount: z.number(),
        invoiceCount: z.number(),
        paidInvoiceCount: z.number(),
        revenue: z.string(),
        outstanding: z.string(),
        currency: z.string(),
      }),
    )
    .default([]),
  recentCustomers: z
    .array(
      z.object({
        customerId: z.string(),
        customerName: z.string(),
        createdAt: z.string(),
        invoiceCount: z.number(),
        paid: z.string(),
        currency: z.string(),
      }),
    )
    .default([]),
});
