export type PaymentRecordStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "CHECK" | "OTHER" | "CARD";

export type PaymentProvider = "MANUAL" | "STRIPE" | "PAYPAL";

export interface Payment {
  id: string;
  organizationId: string;
  invoiceId: string;
  customerId: string;
  amount: string;
  currency: string;
  method: PaymentMethod;
  provider: PaymentProvider;
  providerTransactionId: string | null;
  status: PaymentRecordStatus;
  paidAt: string | null;
  notes: string | null;
  createdById: string;
  invoice: { id: string; invoiceNumber: string };
  customer: { id: string; name: string; company: string | null };
  createdBy: { id: string; firstName: string; lastName: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface PaymentListResult {
  items: Payment[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface RecordPaymentValues {
  invoiceId: string;
  amount: string;
  method: Exclude<PaymentMethod, "CARD">;
  paidAt: string;
  notes: string;
  providerTransactionId: string;
}
