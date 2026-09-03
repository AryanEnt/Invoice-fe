"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ActionGroup, DeleteAction, EditAction } from "@/components/ui/action-buttons";
import { ConfirmDialog } from "@/components/ui/dialog";
import { CustomerForm, valuesFromCustomer } from "@/features/customers/customer-form";
import { ApiError } from "@/lib/api/types";
import { hasPermission } from "@/lib/permissions";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { deleteCustomer, getCustomer, updateCustomer } from "@/services/customers.service";
import type { Address, Customer, CustomerFormValues } from "@/types/catalog";

interface CustomerDetailPageProps {
  customerId: string;
}

export function CustomerDetailPage({ customerId }: CustomerDetailPageProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { notify } = useToast();
  const canUpdate = hasPermission(user, "CUSTOMERS_UPDATE");
  const canDelete = hasPermission(user, "CUSTOMERS_DELETE");

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [formBusy, setFormBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCustomer(await getCustomer(customerId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load customer.");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

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

  async function handleEdit(values: CustomerFormValues) {
    setFormBusy(true);
    try {
      await updateCustomer(customerId, values);
      setEditing(false);
      notify("Customer updated");
      await load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to update customer.", "error");
    } finally {
      setFormBusy(false);
    }
  }

  async function handleDelete() {
    setDeleteBusy(true);
    try {
      await deleteCustomer(customerId);
      notify("Customer deleted");
      router.replace("/customers");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to delete customer.", "error");
      setDeleteBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-sm text-muted">
        Loading customer…
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div role="alert" className="rounded-2xl border border-border bg-primary-soft p-6 text-sm text-primary">
        {error ?? "Customer not found."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm text-muted">
            <Link href="/customers" className="hover:underline">
              Customers
            </Link>
            <span className="mx-2">/</span>
            {customer.name}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">{customer.name}</h2>
          <p className="mt-1 text-sm text-muted">{customer.company || "No company"}</p>
        </div>
        <ActionGroup>
          {canUpdate ? <EditAction onClick={() => setEditing(true)} /> : null}
          {canDelete ? <DeleteAction onClick={() => setDeleteOpen(true)} /> : null}
        </ActionGroup>
      </div>

      <section className="grid gap-4 rounded-2xl border border-border bg-surface p-6 md:grid-cols-3">
        <Detail label="Email" value={customer.email} />
        <Detail label="Phone" value={customer.phone} />
        <Detail label="Tax / VAT / PAN" value={customer.taxNumber} />
        <Detail label="Status" value={customer.isActive ? "Active" : "Inactive"} />
        <Detail label="Notes" value={customer.notes} />
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <AddressCard title="Billing address" address={customer.billingAddress} />
        <AddressCard title="Shipping address" address={customer.shippingAddress} />
      </div>

      {editing ? (
        <CustomerForm
          title="Edit customer"
          mode="edit"
          persistKey={`customer-form:edit:${customer.id}`}
          initialValues={valuesFromCustomer(customer)}
          busy={formBusy}
          onClose={() => setEditing(false)}
          onSubmit={handleEdit}
        />
      ) : null}

      {deleteOpen ? (
        <ConfirmDialog
          title="Delete customer"
          message={`${customer.name} will be permanently removed.`}
          confirmLabel="Delete"
          danger
          busy={deleteBusy}
          onCancel={() => setDeleteOpen(false)}
          onConfirm={() => void handleDelete()}
        />
      ) : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

function AddressCard({ title, address }: { title: string; address: Address | null }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {address ? (
        <p className="mt-3 text-sm leading-6 text-muted">
          {address.line1}
          {address.line2 ? (
            <>
              <br />
              {address.line2}
            </>
          ) : null}
          <br />
          {[address.city, address.region, address.postalCode].filter(Boolean).join(", ")}
          <br />
          {address.country}
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted">No address on file.</p>
      )}
    </section>
  );
}
