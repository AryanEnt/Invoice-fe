import { apiRequest } from "@/lib/api/client";
import { clampPageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/pagination";
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
  params.set("pageSize", String(clampPageSize(query.pageSize, MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE)));
  return customerListResultSchema.parse(
    await apiRequest<CustomerListResult>(`/api/customers?${params}`),
  );
}

/** Loads all matching customers via bounded pages (never exceeds MAX_PAGE_SIZE per request). */
export async function listAllCustomers(
  query: Omit<Parameters<typeof listCustomers>[0], "page" | "pageSize">,
): Promise<Customer[]> {
  const pageSize = MAX_PAGE_SIZE;
  const first = await listCustomers({ ...query, page: 1, pageSize });
  const totalPages = Math.max(1, Math.ceil(first.total / pageSize));
  if (totalPages === 1) {
    return first.items;
  }
  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      listCustomers({ ...query, page: index + 2, pageSize }),
    ),
  );
  return [...first.items, ...rest.flatMap((page) => page.items)];
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
  const { organizationId: _organizationId, ...body } = customerPayload(values, {
    clearEmptyAddresses: true,
  });
  const data = await apiRequest<{ customer: Customer }>(`/api/customers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return customerSchema.parse(data.customer);
}

export async function deleteCustomer(id: string): Promise<void> {
  await apiRequest<{ deleted: boolean }>(`/api/customers/${id}`, {
    method: "DELETE",
  });
}
