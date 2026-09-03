import { apiRequest } from "@/lib/api/client";
import { productListResultSchema, productSchema } from "@/schemas/catalog";
import type {
  CatalogKind,
  CatalogStatus,
  Product,
  ProductFormValues,
  ProductListResult,
} from "@/types/catalog";

function productPayload(values: ProductFormValues) {
  return {
    name: values.name,
    kind: values.kind,
    description: values.description.trim() || undefined,
    sku: values.sku.trim() || undefined,
    unit: values.unit.trim() || undefined,
    unitPrice: Number(values.unitPrice),
    currency: values.currency.trim() || "USD",
    taxRate: values.taxRate.trim() ? Number(values.taxRate) : undefined,
    organizationId: values.organizationId || undefined,
    isActive: values.isActive,
  };
}

export async function listProducts(query: {
  search?: string;
  status?: CatalogStatus | "";
  kind?: CatalogKind | "";
  organizationId?: string;
  page?: number;
  pageSize?: number;
}): Promise<ProductListResult> {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.kind) params.set("kind", query.kind);
  if (query.organizationId) params.set("organizationId", query.organizationId);
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 10));
  return productListResultSchema.parse(
    await apiRequest<ProductListResult>(`/api/products?${params}`),
  );
}

export async function getProduct(id: string): Promise<Product> {
  const data = await apiRequest<{ product: Product }>(`/api/products/${id}`);
  return productSchema.parse(data.product);
}

export async function createProduct(values: ProductFormValues): Promise<Product> {
  const data = await apiRequest<{ product: Product }>("/api/products", {
    method: "POST",
    body: JSON.stringify(productPayload(values)),
  });
  return productSchema.parse(data.product);
}

export async function updateProduct(id: string, values: ProductFormValues): Promise<Product> {
  const data = await apiRequest<{ product: Product }>(`/api/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(productPayload(values)),
  });
  return productSchema.parse(data.product);
}

export async function deleteProduct(id: string): Promise<void> {
  await apiRequest<{ deleted: boolean }>(`/api/products/${id}`, {
    method: "DELETE",
  });
}
