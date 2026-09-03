import type { OrganizationSummary } from "@/types/admin";
import type { Address, CatalogKind } from "@/types/catalog";
import type { Payment } from "@/types/payment";

export type InvoiceStatus =
  | "DRAFT"
  | "SENT"
  | "VIEWED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

export type InvoiceEmailStatus = "NOT_SENT" | "SENT" | "FAILED";

export type PaymentStatus =
  | "UNPAID"
  | "PARTIALLY_PAID"
  | "PAID"
  | "NONE";

export interface InvoiceItem {
  id: string;
  productId: string | null;
  catalogKind: CatalogKind | null;
  sku: string | null;
  unit: string | null;
  description: string;
  quantity: string;
  unitPrice: string;
  discount: string;
  taxRate: string | null;
  taxAmount: string;
  lineSubtotal: string;
  lineTotal: string;
  sortOrder: number;
}

export interface Invoice {
  id: string;
  organizationId: string;
  customerId: string;
  createdById: string;
  assignedMemberId: string | null;
  invoiceNumber: string;
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  total: string;
  amountPaid: string;
  balanceDue: string;
  notes: string | null;
  terms: string | null;
  shareUrl: string | null;
  emailStatus: InvoiceEmailStatus;
  emailSentAt: string | null;
  sentAt: string | null;
  viewedAt: string | null;
  organization: OrganizationSummary | null;
  customer: {
    id: string;
    name: string;
    company: string | null;
    email: string | null;
    phone: string | null;
    taxNumber: string | null;
  };
  createdBy: { id: string; firstName: string; lastName: string; email: string };
  assignedMember: { id: string; firstName: string; lastName: string; email: string } | null;
  billingAddress: Address | null;
  shippingAddress: Address | null;
  items: InvoiceItem[];
  payments: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceListResult {
  items: Invoice[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface InvoiceBucketSummary {
  count: number;
  amount: string;
}

export interface InvoiceSummary {
  all: number;
  paid: number;
  outstanding: number;
  overview: number;
  void: number;
  currency: string;
  overdue: InvoiceBucketSummary;
  awaitingPayment: InvoiceBucketSummary;
  notSent: InvoiceBucketSummary;
  paidInvoices: InvoiceBucketSummary;
}

export interface PublicInvoice {
  invoiceNumber: string;
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  subtotal: string;
  total: string;
  amountPaid: string;
  balanceDue: string;
  notes: string | null;
  terms: string | null;
  organizationName: string;
  organizationLogoUrl: string | null;
  customer: {
    name: string;
    company: string | null;
  };
  billingAddress: Address | null;
  items: Array<{
    description: string;
    quantity: string;
    unitPrice: string;
    lineTotal: string;
  }>;
}

export interface InvoiceItemFormValues {
  productId: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

export interface InvoiceFormValues {
  customerId: string;
  organizationId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  notes: string;
  terms: string;
  assignedMemberId: string;
  items: InvoiceItemFormValues[];
}
