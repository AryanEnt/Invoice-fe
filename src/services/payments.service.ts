import { apiRequest } from "@/lib/api/client";
import { paymentListResultSchema, paymentSchema } from "@/schemas/payment";
import { invoiceSchema } from "@/schemas/invoice";
import type { Invoice } from "@/types/invoice";
import type { Payment, PaymentListResult, PaymentRecordStatus, RecordPaymentValues } from "@/types/payment";

export async function listPayments(query: {
  search?: string;
  status?: PaymentRecordStatus | "";
  customerId?: string;
  invoiceId?: string;
  organizationId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaymentListResult> {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.customerId) params.set("customerId", query.customerId);
  if (query.invoiceId) params.set("invoiceId", query.invoiceId);
  if (query.organizationId) params.set("organizationId", query.organizationId);
  if (query.dateFrom) params.set("dateFrom", query.dateFrom);
  if (query.dateTo) params.set("dateTo", query.dateTo);
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 10));
  return paymentListResultSchema.parse(
    await apiRequest<PaymentListResult>(`/api/payments?${params}`),
  );
}

export async function getPayment(id: string): Promise<Payment> {
  const data = await apiRequest<{ payment: Payment }>(`/api/payments/${id}`);
  return paymentSchema.parse(data.payment);
}

export async function recordPayment(
  values: RecordPaymentValues,
): Promise<{ payment: Payment; invoice: Invoice }> {
  const data = await apiRequest<{ payment: Payment; invoice: Invoice }>("/api/payments", {
    method: "POST",
    body: JSON.stringify({
      invoiceId: values.invoiceId,
      amount: values.amount,
      method: values.method,
      paidAt: values.paidAt || undefined,
      notes: values.notes.trim() || undefined,
      providerTransactionId: values.providerTransactionId.trim() || undefined,
    }),
  });
  return {
    payment: paymentSchema.parse(data.payment),
    invoice: invoiceSchema.parse(data.invoice),
  };
}
