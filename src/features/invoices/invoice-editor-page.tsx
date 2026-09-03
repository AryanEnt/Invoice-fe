"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { InvoiceForm, valuesFromInvoice } from "@/features/invoices/invoice-form";
import { ApiError } from "@/lib/api/types";
import { hasPermission } from "@/lib/permissions";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { listCustomers } from "@/services/customers.service";
import { createInvoice, getInvoice, updateInvoice } from "@/services/invoices.service";
import { listMembers } from "@/services/members.service";
import { listProducts } from "@/services/products.service";
import type { Customer, Product } from "@/types/catalog";
import type { InvoiceFormValues } from "@/types/invoice";
import type { MemberUser } from "@/types/member";

interface InvoiceEditorPageProps {
  invoiceId?: string;
}

export function InvoiceEditorPage({ invoiceId }: InvoiceEditorPageProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { notify } = useToast();
  const canCreate = hasPermission(user, "INVOICES_CREATE");
  const canUpdate = hasPermission(user, "INVOICES_UPDATE");
  const canCreateCustomer = hasPermission(user, "CUSTOMERS_CREATE");
  const canSend = hasPermission(user, "INVOICES_SEND");
  const canListOrgMembers = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [members, setMembers] = useState<MemberUser[]>([]);
  const [initialValues, setInitialValues] = useState<Partial<InvoiceFormValues> | undefined>();
  const hasLoadedRef = useRef(false);

  const load = useCallback(async () => {
    if (!hasLoadedRef.current) {
      setLoading(true);
    }
    setError(null);
    try {
      if (!invoiceId && !canCreate) {
        setError("You can inspect invoices but cannot create them.");
        return;
      }
      if (invoiceId && !canUpdate) {
        setError("You can inspect invoices but cannot edit them.");
        return;
      }
      const [customerResult, productResult, memberResult, invoice] = await Promise.all([
        listCustomers({ status: "ACTIVE", pageSize: 100 }),
        listProducts({ status: "ACTIVE", pageSize: 50 }),
        canListOrgMembers
          ? listMembers({ status: "ACTIVE", pageSize: 50 })
          : Promise.resolve({ items: [] as MemberUser[] }),
        invoiceId ? getInvoice(invoiceId) : Promise.resolve(null),
      ]);
      if (invoice && invoice.status !== "DRAFT") {
        setError("Only draft invoices can be edited.");
        return;
      }
      setCustomers(customerResult.items);
      setProducts(productResult.items);
      setMembers(
        canListOrgMembers
          ? memberResult.items
          : user
            ? [
                {
                  ...user,
                  organization: null,
                  administrator: null,
                },
              ]
            : [],
      );
      setInitialValues(invoice ? valuesFromInvoice(invoice) : undefined);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load the invoice form.");
    } finally {
      setLoading(false);
      hasLoadedRef.current = true;
    }
  }, [canCreate, canListOrgMembers, canUpdate, invoiceId, user]);

  const persistKey = `invoice-form:${invoiceId ?? "new"}`;

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

  async function handleSubmit(values: InvoiceFormValues) {
    setBusy(true);
    try {
      const saved = invoiceId
        ? await updateInvoice(invoiceId, values)
        : await createInvoice(values);
      notify(invoiceId ? "Invoice updated successfully." : "Invoice created successfully.");
      router.push(`/invoices/${saved.id}`);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "We couldn't save this invoice.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted">
          <Link href="/invoices" className="hover:underline">
            Invoices
          </Link>
          <span className="mx-2">/</span>
          {invoiceId ? "Edit" : "New"}
        </p>
        <PageHeader
          title={invoiceId ? "Edit invoice" : "Create invoice"}
          description={
            invoiceId
              ? "Update this draft, then send it from the invoice page."
              : "Follow the steps to bill a customer. You can save a draft when you are done."
          }
        />
      </div>
      {loading && !hasLoadedRef.current ? (
        <TableSkeleton cols={3} rows={4} />
      ) : error && !initialValues && invoiceId ? (
        <div role="alert" className="rounded-2xl border border-border bg-primary-soft p-6 text-sm text-primary">
          {error}
        </div>
      ) : (
        <InvoiceForm
          mode={invoiceId ? "edit" : "create"}
          persistKey={persistKey}
          customers={customers}
          products={products}
          members={members}
          canCreateCustomer={canCreateCustomer}
          canSend={canSend}
          initialValues={initialValues}
          busy={busy}
          error={error}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
