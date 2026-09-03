"use client";

import { useCallback, useEffect, useState } from "react";
import { ActionGroup, DeleteAction, EditAction } from "@/components/ui/action-buttons";
import { Button } from "@/components/ui/button";
import { DataTable, Table, Td, Th, THead } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Field, SelectInput, TextInput } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatMoney } from "@/lib/invoice-calc";
import { ProductForm, valuesFromProduct } from "@/features/products/product-form";
import { ApiError } from "@/lib/api/types";
import { hasPermission } from "@/lib/permissions";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { useWorkspace } from "@/providers/workspace-provider";
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
} from "@/services/products.service";
import type {
  CatalogKind,
  CatalogStatus,
  Product,
  ProductFormValues,
  ProductListResult,
} from "@/types/catalog";

export function ProductsPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const { organizationId, tenantListsReady, scopeLabel } = useWorkspace();
  const canManage = hasPermission(user, "PRODUCTS_CREATE");

  const [result, setResult] = useState<ProductListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CatalogStatus | "">("");
  const [kind, setKind] = useState<CatalogKind | "">("");
  const [page, setPage] = useState(1);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    if (!tenantListsReady) {
      setResult(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const products = await listProducts({
        search: search || undefined,
        status,
        kind,
        organizationId: organizationId || undefined,
        page,
        pageSize: 10,
      });
      setResult(products);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }, [kind, organizationId, page, search, status, tenantListsReady]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!cancelled) {
        void load();
      }
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [load]);

  async function handleCreate(values: ProductFormValues) {
    setFormBusy(true);
    try {
      await createProduct(values);
      setFormMode(null);
      notify("Product added.");
      await load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to create catalog item.", "error");
    } finally {
      setFormBusy(false);
    }
  }

  async function handleEdit(values: ProductFormValues) {
    if (!editing) {
      return;
    }
    setFormBusy(true);
    try {
      await updateProduct(editing.id, values);
      setFormMode(null);
      setEditing(null);
      notify("Product updated.");
      await load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to update catalog item.", "error");
    } finally {
      setFormBusy(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }
    setDeleteBusy(true);
    try {
      await deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
      notify("Product deleted.");
      await load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to delete catalog item.", "error");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products & services"
        description={`Items you can add to invoices. ${scopeLabel}.`}
        actions={canManage ? <Button onClick={() => setFormMode("create")}>Add product</Button> : undefined}
      />

      <form
        className="grid gap-3 rounded-2xl border border-border bg-surface p-4 md:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          void load();
        }}
      >
        <Field label="Search" htmlFor="product-search">
          <TextInput
            id="product-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products by name or SKU"
          />
        </Field>
        <Field label="Type" htmlFor="product-kind-filter">
          <SelectInput
            id="product-kind-filter"
            value={kind}
            onChange={(event) => {
              setKind(event.target.value as CatalogKind | "");
              setPage(1);
            }}
          >
            <option value="">All types</option>
            <option value="PRODUCT">Products</option>
            <option value="SERVICE">Services</option>
          </SelectInput>
        </Field>
        <Field label="Status" htmlFor="product-status-filter">
          <SelectInput
            id="product-status-filter"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as CatalogStatus | "");
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </SelectInput>
        </Field>
        <div className="flex items-end">
          <Button type="submit" variant="secondary" className="w-full">
            Apply filters
          </Button>
        </div>
      </form>

      {loading && !result ? (
        <TableSkeleton cols={4} />
      ) : error && !result ? (
        <ErrorState title="We couldn't load products." message={error} onRetry={() => void load()} />
      ) : !result || result.items.length === 0 ? (
        <EmptyState
          title={search || status || kind ? "No products match these filters" : "No products yet"}
          description={
            search || status || kind
              ? "Try a different search or clear the filters."
              : "Add a product or service to use on invoices."
          }
          action={
            canManage && !search && !status && !kind ? (
              <Button onClick={() => setFormMode("create")}>Add product</Button>
            ) : null
          }
        />
      ) : (
        <DataTable
          footer={<Pagination page={result.page} totalPages={result.totalPages} onPageChange={setPage} />}
        >
          <Table>
            <THead>
              <tr>
                <Th>Name</Th>
                <Th>Price</Th>
                <Th>Status</Th>
                {canManage ? <Th className="text-right">Actions</Th> : null}
              </tr>
            </THead>
            <tbody>
              {result.items.map((product) => (
                <tr key={product.id} className="border-t border-border hover:bg-muted-soft">
                  <Td>
                    <span className="font-medium">{product.name}</span>
                    <p className="text-xs text-muted">
                      {product.kind === "SERVICE" ? "Service" : "Product"}
                      {product.sku ? ` · ${product.sku}` : ""}
                    </p>
                  </Td>
                  <Td muted>{formatMoney(String(product.unitPrice), product.currency)}</Td>
                  <Td>
                    <StatusBadge status={product.isActive ? "ACTIVE" : "INACTIVE"} />
                  </Td>
                  {canManage ? (
                    <Td className="text-right">
                      <ActionGroup>
                        <EditAction
                          onClick={() => {
                            setEditing(product);
                            setFormMode("edit");
                          }}
                        />
                        <DeleteAction onClick={() => setDeleteTarget(product)} />
                      </ActionGroup>
                    </Td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </Table>
        </DataTable>
      )}

      {formMode === "create" ? (
        <ProductForm
          title="Add product"
          mode="create"
          persistKey="product-form:create"
          initialValues={{ organizationId: organizationId ?? "" }}
          busy={formBusy}
          onClose={() => setFormMode(null)}
          onSubmit={handleCreate}
        />
      ) : null}

      {formMode === "edit" && editing ? (
        <ProductForm
          title="Edit product"
          mode="edit"
          persistKey={`product-form:edit:${editing.id}`}
          initialValues={valuesFromProduct(editing)}
          busy={formBusy}
          onClose={() => {
            setFormMode(null);
            setEditing(null);
          }}
          onSubmit={handleEdit}
        />
      ) : null}

      {deleteTarget ? (
        <ConfirmDialog
          title="Delete product"
          message={`${deleteTarget.name} will be permanently removed. This action cannot be undone.`}
          confirmLabel="Delete"
          danger
          busy={deleteBusy}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void handleDelete()}
        />
      ) : null}
    </div>
  );
}
