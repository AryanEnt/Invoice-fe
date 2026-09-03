import { apiRequest } from "@/lib/api/client";
import { getApiBaseUrl } from "@/lib/env";
import { ApiError } from "@/lib/api/types";
import { invoiceListResultSchema, invoiceSchema } from "@/schemas/invoice";
import type { Invoice, InvoiceFormValues, InvoiceListResult, InvoiceStatus, InvoiceSummary, PublicInvoice } from "@/types/invoice";

function invoicePayload(values: InvoiceFormValues, options?: { includeOrganization?: boolean }) {
  return {
    customerId: values.customerId,
    ...(options?.includeOrganization
      ? { organizationId: values.organizationId || undefined }
      : {}),
    invoiceNumber: values.invoiceNumber.trim() || undefined,
    invoiceDate: values.invoiceDate,
    dueDate: values.dueDate,
    currency: values.currency,
    notes: values.notes.trim() || undefined,
    terms: values.terms.trim() || undefined,
    items: values.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: "0",
    })),
  };
}

export async function listInvoices(query: {
  search?: string;
  status?: InvoiceStatus | "";
  boardColumn?: "new" | "sent" | "overdue" | "paid";
  customerId?: string;
  organizationId?: string;
  administratorId?: string;
  assignedMemberId?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}): Promise<InvoiceListResult> {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.boardColumn) params.set("boardColumn", query.boardColumn);
  if (query.customerId) params.set("customerId", query.customerId);
  if (query.organizationId) params.set("organizationId", query.organizationId);
  if (query.administratorId) params.set("administratorId", query.administratorId);
  if (query.assignedMemberId) params.set("assignedMemberId", query.assignedMemberId);
  if (query.dateFrom) params.set("dateFrom", query.dateFrom);
  if (query.dateTo) params.set("dateTo", query.dateTo);
  if (query.sort) params.set("sort", query.sort);
  if (query.sortDir) params.set("sortDir", query.sortDir);
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 10));
  return invoiceListResultSchema.parse(
    await apiRequest<InvoiceListResult>(`/api/invoices?${params}`),
  );
}

export async function getInvoiceSummary(): Promise<InvoiceSummary> {
  const data = await apiRequest<{ summary: InvoiceSummary }>("/api/invoices/summary");
  return data.summary;
}

export async function getInvoice(id: string): Promise<Invoice> {
  const data = await apiRequest<{ invoice: Invoice }>(`/api/invoices/${id}`);
  return invoiceSchema.parse(data.invoice);
}

export async function createInvoice(values: InvoiceFormValues): Promise<Invoice> {
  const data = await apiRequest<{ invoice: Invoice }>("/api/invoices", {
    method: "POST",
    body: JSON.stringify(invoicePayload(values, { includeOrganization: true })),
  });
  return invoiceSchema.parse(data.invoice);
}

export async function updateInvoice(id: string, values: InvoiceFormValues): Promise<Invoice> {
  const data = await apiRequest<{ invoice: Invoice }>(`/api/invoices/${id}`, {
    method: "PATCH",
    body: JSON.stringify(invoicePayload(values)),
  });
  return invoiceSchema.parse(data.invoice);
}

export async function deleteInvoice(id: string): Promise<void> {
  await apiRequest<{ deleted: boolean }>(`/api/invoices/${id}`, { method: "DELETE" });
}

export async function sendInvoice(id: string): Promise<Invoice> {
  const data = await apiRequest<{ invoice: Invoice }>(`/api/invoices/${id}/send`, {
    method: "POST",
  });
  return invoiceSchema.parse(data.invoice);
}

export async function getInvoiceShareLink(id: string): Promise<string> {
  const data = await apiRequest<{ url: string }>(`/api/invoices/${id}/share-link`, {
    method: "POST",
  });
  return data.url;
}

export async function getPublicInvoice(token: string): Promise<PublicInvoice> {
  const data = await apiRequest<{ invoice: PublicInvoice }>(`/api/public/invoices/${token}`);
  return data.invoice;
}

export async function duplicateInvoice(id: string): Promise<Invoice> {
  const data = await apiRequest<{ invoice: Invoice }>(`/api/invoices/${id}/duplicate`, {
    method: "POST",
  });
  return invoiceSchema.parse(data.invoice);
}

export async function cancelInvoice(id: string): Promise<Invoice> {
  const data = await apiRequest<{ invoice: Invoice }>(`/api/invoices/${id}/cancel`, {
    method: "POST",
  });
  return invoiceSchema.parse(data.invoice);
}

export async function recordInvoicePayment(
  id: string,
  amount: string,
): Promise<Invoice> {
  const data = await apiRequest<{ invoice: Invoice }>(`/api/invoices/${id}/payments`, {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
  return invoiceSchema.parse(data.invoice);
}

export async function downloadInvoicePdf(id: string, invoiceNumber: string): Promise<void> {
  const response = await fetch(`${getApiBaseUrl()}/api/invoices/${id}/pdf`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new ApiError(response.status, "PDF_ERROR", "Unable to download invoice PDF.");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${invoiceNumber}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
