"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { CustomerForm, valuesFromCustomer } from "@/features/customers/customer-form";
import { ApiError } from "@/lib/api/types";
import { hasPermission } from "@/lib/permissions";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { useWorkspace } from "@/providers/workspace-provider";
import {
  createCustomer,
  deleteCustomer,
  listCustomers,
  updateCustomer,
} from "@/services/customers.service";
import type { CatalogStatus, Customer, CustomerFormValues, CustomerListResult } from "@/types/catalog";

export function CustomersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { notify } = useToast();
  const { organizationId, tenantListsReady, scopeLabel } = useWorkspace();
  const canCreate = Boolean(hasPermission(user, "CUSTOMERS_CREATE"));
  const canDelete = hasPermission(user, "CUSTOMERS_DELETE");

  const [result, setResult] = useState<CustomerListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CatalogStatus | "">("");
  const [page, setPage] = useState(1);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
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
      const customers = await listCustomers({
        search: search || undefined,
        status,
        organizationId: organizationId || undefined,
        page,
        pageSize: 10,
      });
      setResult(customers);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load customers.");
    } finally {
      setLoading(false);
    }
  }, [organizationId, page, search, status, tenantListsReady]);

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

  async function handleCreate(values: CustomerFormValues) {
    setFormBusy(true);
    try {
      await createCustomer(values);
      setFormMode(null);
      notify("Customer added.");
      await load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to create customer.", "error");
    } finally {
      setFormBusy(false);
    }
  }

  async function handleEdit(values: CustomerFormValues) {
    if (!editing) {
      return;
    }
    setFormBusy(true);
    try {
      await updateCustomer(editing.id, values);
      setFormMode(null);
      setEditing(null);
      notify("Customer updated.");
      await load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to update customer.", "error");
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
      await deleteCustomer(deleteTarget.id);
      setDeleteTarget(null);
      notify("Customer deleted.");
      await load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to delete customer.", "error");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description={`People and companies you bill. ${scopeLabel}.`}
        actions={canCreate ? <Button onClick={() => setFormMode("create")}>Add customer</Button> : undefined}
      />

      <form
        className="flex w-full flex-wrap items-end gap-6 rounded-2xl border border-border bg-surface p-4"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          void load();
        }}
      >
        <div className="w-64 max-w-full">
          <Field label="Search" htmlFor="customer-search">
            <TextInput
              id="customer-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customers"
            />
          </Field>
        </div>
        <div className="w-40">
          <Field label="Status" htmlFor="customer-status-filter">
            <SelectInput
              id="customer-status-filter"
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
        </div>
        <Button type="submit" variant="secondary">
          Apply filters
        </Button>
      </form>

      {loading && !result ? (
        <TableSkeleton cols={4} />
      ) : error && !result ? (
        <ErrorState title="We couldn't load your customers." message={error} onRetry={() => void load()} />
      ) : !result || result.items.length === 0 ? (
        <EmptyState
          title={search || status ? "No customers match these filters" : "No customers yet"}
          description={
            search || status
              ? "Try a different search or clear the filters."
              : "Add a customer so you can create invoices."
          }
          action={
            canCreate && !search && !status ? (
              <Button onClick={() => setFormMode("create")}>Add customer</Button>
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
                <Th>Email</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </THead>
            <tbody>
              {result.items.map((customer) => (
                <tr key={customer.id} className="border-t border-border hover:bg-muted-soft">
                  <Td>
                    <Link href={`/customers/${customer.id}`} className="font-medium hover:underline">
                      {customer.name}
                    </Link>
                    {customer.company ? (
                      <p className="text-xs text-muted">{customer.company}</p>
                    ) : null}
                  </Td>
                  <Td muted>{customer.email ?? "—"}</Td>
                  <Td>
                    <StatusBadge status={customer.isActive ? "ACTIVE" : "INACTIVE"} />
                  </Td>
                  <Td className="text-right">
                    <ActionGroup>
                      <EditAction mode="view" onClick={() => router.push(`/customers/${customer.id}`)} />
                      <EditAction
                        onClick={() => {
                          setEditing(customer);
                          setFormMode("edit");
                        }}
                      />
                      {canDelete ? (
                        <DeleteAction onClick={() => setDeleteTarget(customer)} />
                      ) : null}
                    </ActionGroup>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </DataTable>
      )}

      {formMode === "create" ? (
        <CustomerForm
          title="Add customer"
          mode="create"
          persistKey="customer-form:create"
          initialValues={{ organizationId: organizationId ?? "" }}
          busy={formBusy}
          onClose={() => setFormMode(null)}
          onSubmit={handleCreate}
        />
      ) : null}

      {formMode === "edit" && editing ? (
        <CustomerForm
          title="Edit customer"
          mode="edit"
          persistKey={`customer-form:edit:${editing.id}`}
          initialValues={valuesFromCustomer(editing)}
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
          title="Delete customer"
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
