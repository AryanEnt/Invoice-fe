import type { OrganizationSummary } from "@/types/admin";

export type CatalogKind = "PRODUCT" | "SERVICE";
export type CatalogStatus = "ACTIVE" | "INACTIVE";
export type CustomerInvoiceLifecycle = "NEW" | "OLD";

export interface Address {
  id: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postalCode: string | null;
  country: string;
}

export interface AddressFormValues {
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface CustomerUnsentInvoice {
  id: string;
  invoiceNumber: string;
  emailStatus: "NOT_SENT" | "FAILED";
}

export interface Customer {
  id: string;
  organizationId: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  taxNumber: string | null;
  notes: string | null;
  isActive: boolean;
  invoiceLifecycleStatus: CustomerInvoiceLifecycle;
  unsentInvoice: CustomerUnsentInvoice | null;
  billingAddress: Address | null;
  shippingAddress: Address | null;
  organization: OrganizationSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerListResult {
  items: Customer[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  counts: {
    all: number;
    new: number;
    old: number;
  };
}

export interface CustomerFormValues {
  name: string;
  company: string;
  email: string;
  phone: string;
  taxNumber: string;
  notes: string;
  organizationId: string;
  isActive: boolean;
  billingAddress: AddressFormValues;
  shippingAddress: AddressFormValues;
}

export interface Product {
  id: string;
  organizationId: string;
  kind: CatalogKind;
  name: string;
  description: string | null;
  sku: string | null;
  unit: string | null;
  unitPrice: number;
  currency: string;
  taxRate: number | null;
  isActive: boolean;
  organization: OrganizationSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResult {
  items: Product[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ProductFormValues {
  name: string;
  kind: CatalogKind;
  description: string;
  sku: string;
  unit: string;
  unitPrice: string;
  currency: string;
  taxRate: string;
  organizationId: string;
  isActive: boolean;
}
