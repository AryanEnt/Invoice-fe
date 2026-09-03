import { apiRequest } from "@/lib/api/client";
import { customerListResultSchema, customerSchema } from "@/schemas/catalog";
import type {
  AddressFormValues,
  Customer,
  CustomerFormValues,
  CustomerInvoiceLifecycle,
  CustomerListResult,
} from "@/types/catalog";
import type { CatalogStatus } from "@/types/catalog";

function compactAddress(address: AddressFormValues) {
  const filled = Object.values(address).some((value) => value.trim().length > 0);
  if (!filled) {
    return null;
  }
  return {
    line1: address.line1.trim(),
    line2: address.line2.trim() || undefined,
    city: address.city.trim(),
    region: address.region.trim() || undefined,
    postalCode: address.postalCode.trim() || undefined,
    country: address.country.trim(),
  };
}

function customerPayload(values: CustomerFormValues, options?: { clearEmptyAddresses?: boolean }) {
  const billingAddress = compactAddress(values.billingAddress);
  const shippingAddress = compactAddress(values.shippingAddress);
  return {
    name: values.name,
    company: values.company.trim() || undefined,
    email: values.email.trim() || undefined,
    phone: values.phone.trim() || undefined,
    taxNumber: values.taxNumber.trim() || undefined,
    notes: values.notes.trim() || undefined,
    organizationId: values.organizationId || undefined,
    isActive: values.isActive,
    billingAddress: billingAddress ?? (options?.clearEmptyAddresses ? null : undefined),
    shippingAddress: shippingAddress ?? (options?.clearEmptyAddresses ? null : undefined),
  };
}

export async function listCustomers(query: {
  search?: string;
  status?: CatalogStatus | "";
  organizationId?: string;
  invoiceLifecycle?: CustomerInvoiceLifecycle | "";
  page?: number;
  pageSize?: number;
}): Promise<CustomerListResult> {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.organizationId) params.set("organizationId", query.organizationId);
  if (query.invoiceLifecycle) params.set("invoiceLifecycle", query.invoiceLifecycle);
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 10));
  return customerListResultSchema.parse(
    await apiRequest<CustomerListResult>(`/api/customers?${params}`),
  );
}

export async function getCustomer(id: string): Promise<Customer> {
  const data = await apiRequest<{ customer: Customer }>(`/api/customers/${id}`);
  return customerSchema.parse(data.customer);
}

export async function createCustomer(values: CustomerFormValues): Promise<Customer> {
  const data = await apiRequest<{ customer: Customer }>("/api/customers", {
    method: "POST",
    body: JSON.stringify(customerPayload(values)),
  });
  return customerSchema.parse(data.customer);
}

export async function updateCustomer(id: string, values: CustomerFormValues): Promise<Customer> {
  const data = await apiRequest<{ customer: Customer }>(`/api/customers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(customerPayload(values, { clearEmptyAddresses: true })),
  });
  return customerSchema.parse(data.customer);
}

export async function deleteCustomer(id: string): Promise<void> {
  await apiRequest<{ deleted: boolean }>(`/api/customers/${id}`, {
    method: "DELETE",
  });
}
