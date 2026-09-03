"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, SelectInput, TextArea, TextInput } from "@/components/ui/field";
import { FormSection } from "@/components/ui/form-section";
import { Surface } from "@/components/ui/page-header";
import { Stepper } from "@/components/ui/stepper";
import { CustomerForm } from "@/features/customers/customer-form";
import { InvoiceCustomerPicker } from "@/features/invoices/invoice-customer-picker";
import { InvoiceItemsSection } from "@/features/invoices/invoice-items-section";
import { clearFormDrafts, usePersistedFormState } from "@/hooks/use-persisted-form-state";
import { calculateInvoiceTotals, calculateLineAmount, formatMoney } from "@/lib/invoice-calc";
import { ApiError } from "@/lib/api/types";
import { invoiceFormSchema } from "@/schemas/invoice";
import { createCustomer } from "@/services/customers.service";
import { useToast } from "@/providers/toast-provider";
import type { Customer, CustomerFormValues, Product } from "@/types/catalog";
import type { Invoice, InvoiceFormValues, InvoiceItemFormValues } from "@/types/invoice";
import type { MemberUser } from "@/types/member";

interface InvoiceFormProps {
  mode: "create" | "edit";
  persistKey: string;
  customers: Customer[];
  products: Product[];
  members: MemberUser[];
  canCreateCustomer?: boolean;
  canSend?: boolean;
  initialValues?: Partial<InvoiceFormValues>;
  busy: boolean;
  error?: string | null;
  onSubmit: (values: InvoiceFormValues) => Promise<void>;
}

const emptyItem: InvoiceItemFormValues = {
  productId: "",
  description: "",
  quantity: "1",
  unitPrice: "0",
};

const STEPS = [
  { id: "customer", label: "Customer", description: "Who you are billing" },
  { id: "details", label: "Details", description: "Dates and currency" },
  { id: "items", label: "Items", description: "What you are charging" },
  { id: "review", label: "Review", description: "Check and save" },
];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function inDays(days: number, fromDate = today()): string {
  const date = new Date(`${fromDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const PAYMENT_TERM_OPTIONS = [
  { value: "0", label: "Due on receipt" },
  { value: "7", label: "Net 7" },
  { value: "14", label: "Net 14" },
  { value: "30", label: "Net 30" },
  { value: "60", label: "Net 60" },
  { value: "custom", label: "Custom date" },
] as const;

type PaymentTermValue = (typeof PAYMENT_TERM_OPTIONS)[number]["value"];

function paymentTermsLabel(days: number): string {
  if (days === 0) {
    return "Payment due on receipt.";
  }
  return `Payment due within ${days} days.`;
}

function inferPaymentTerm(invoiceDate: string, dueDate: string): PaymentTermValue {
  const start = new Date(`${invoiceDate}T00:00:00.000Z`).getTime();
  const end = new Date(`${dueDate}T00:00:00.000Z`).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return "custom";
  }
  const diff = Math.round((end - start) / (24 * 60 * 60 * 1000));
  const match = PAYMENT_TERM_OPTIONS.find((option) => option.value === String(diff));
  return match?.value ?? "custom";
}

export function InvoiceForm({
  mode,
  persistKey,
  customers,
  products,
  members,
  canCreateCustomer = true,
  canSend = false,
  initialValues,
  busy,
  error,
  onSubmit,
}: InvoiceFormProps) {
  const { notify } = useToast();
  const defaultValues: InvoiceFormValues = {
    customerId: initialValues?.customerId ?? "",
    organizationId: initialValues?.organizationId ?? "",
    invoiceNumber: initialValues?.invoiceNumber ?? "",
    invoiceDate: initialValues?.invoiceDate ?? today(),
    dueDate: initialValues?.dueDate ?? inDays(14),
    currency: initialValues?.currency ?? "USD",
    notes: initialValues?.notes ?? "",
    terms: initialValues?.terms ?? paymentTermsLabel(14),
    assignedMemberId: initialValues?.assignedMemberId ?? "",
    items: initialValues?.items?.length ? initialValues.items : [{ ...emptyItem }],
  };
  const [step, setStep] = usePersistedFormState(`${persistKey}:step`, 0);
  const [highestReached, setHighestReached] = usePersistedFormState(`${persistKey}:highest`, 0);
  const [values, setValues] = usePersistedFormState(`${persistKey}:values`, defaultValues);
  const [paymentTerm, setPaymentTerm] = usePersistedFormState<PaymentTermValue>(
    `${persistKey}:payment-term`,
    inferPaymentTerm(defaultValues.invoiceDate, defaultValues.dueDate),
  );
  const [addedCustomers, setAddedCustomers] = useState<Customer[]>([]);
  const [pickedCustomer, setPickedCustomer] = useState<Customer | null>(null);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [customerBusy, setCustomerBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  function clearDrafts() {
    clearFormDrafts([
      `${persistKey}:step`,
      `${persistKey}:highest`,
      `${persistKey}:values`,
      `${persistKey}:payment-term`,
    ]);
  }

  function updateInvoiceDate(invoiceDate: string) {
    setValues((current) => {
      const next = { ...current, invoiceDate };
      if (paymentTerm !== "custom") {
        next.dueDate = inDays(Number(paymentTerm), invoiceDate);
        next.terms = paymentTermsLabel(Number(paymentTerm));
      } else if (next.dueDate < invoiceDate) {
        next.dueDate = invoiceDate;
      }
      return next;
    });
  }

  function updatePaymentTerm(nextTerm: PaymentTermValue) {
    setPaymentTerm(nextTerm);
    if (nextTerm === "custom") {
      return;
    }
    const days = Number(nextTerm);
    setValues((current) => ({
      ...current,
      dueDate: inDays(days, current.invoiceDate),
      terms: paymentTermsLabel(days),
    }));
  }

  function updateDueDate(dueDate: string) {
    setPaymentTerm("custom");
    update("dueDate", dueDate);
  }

  const customerList = useMemo(() => {
    const ids = new Set(customers.map((customer) => customer.id));
    return [...addedCustomers.filter((customer) => !ids.has(customer.id)), ...customers];
  }, [addedCustomers, customers]);

  const selectedCustomer =
    (pickedCustomer?.id === values.customerId ? pickedCustomer : null) ??
    customerList.find((customer) => customer.id === values.customerId);
  const totals = useMemo(() => {
    try {
      return calculateInvoiceTotals(
        values.items.map((item) => ({
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      );
    } catch {
      return {
        subtotal: "0.0000",
        discountAmount: "0.0000",
        taxAmount: "0.0000",
        total: "0.0000",
      };
    }
  }, [values.items]);

  function update<K extends keyof InvoiceFormValues>(key: K, value: InvoiceFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function updateItem(index: number, patch: Partial<InvoiceItemFormValues>) {
    setValues((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    }));
  }

  function applyProduct(index: number, productId: string) {
    const product = products.find((item) => item.id === productId);
    updateItem(index, {
      productId,
      description: product?.name ?? values.items[index].description,
      unitPrice: product ? String(product.unitPrice) : values.items[index].unitPrice,
    });
    if (product?.currency) {
      update("currency", product.currency);
    }
  }

  function addItem() {
    update("items", [...values.items, { ...emptyItem }]);
  }

  function removeItem(index: number) {
    if (values.items.length === 1) {
      return;
    }
    update(
      "items",
      values.items.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  function goTo(next: number) {
    setStep(next);
    setHighestReached((current) => Math.max(current, next));
    setFormError(null);
  }

  function validateStep(index: number): boolean {
    if (index === 0) {
      if (!values.customerId) {
        setFormError("Please select a customer before continuing.");
        return false;
      }
      return true;
    }
    if (index === 1) {
      if (!values.invoiceDate) {
        setFormError("Invoice date is required.");
        return false;
      }
      if (!values.dueDate) {
        setFormError("Please set a due date before continuing.");
        return false;
      }
      if (values.dueDate < values.invoiceDate) {
        setFormError("Due date cannot be before the invoice date.");
        return false;
      }
      if (!values.currency.trim()) {
        setFormError("Currency is required.");
        return false;
      }
      return true;
    }
    if (index === 2) {
      const parsed = invoiceFormSchema.shape.items.safeParse(values.items);
      if (!parsed.success) {
        setFormError(parsed.error.issues[0]?.message ?? "Add at least one complete line item.");
        return false;
      }
      return true;
    }
    return true;
  }

  function handleNext() {
    if (!validateStep(step)) {
      return;
    }
    goTo(Math.min(step + 1, STEPS.length - 1));
  }

  async function save() {
    const parsed = invoiceFormSchema.safeParse(values);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Check the form and try again.");
      return;
    }
    setFormError(null);
    await onSubmit(values);
    clearDrafts();
  }

  async function handleCreateCustomer(formValues: CustomerFormValues) {
    setCustomerBusy(true);
    try {
      const created = await createCustomer(formValues);
      setAddedCustomers((current) => [created, ...current]);
      setPickedCustomer(created);
      update("customerId", created.id);
      if (formValues.organizationId) {
        update("organizationId", formValues.organizationId);
      }
      setAddCustomerOpen(false);
      notify("Customer added.");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to add customer.", "error");
    } finally {
      setCustomerBusy(false);
    }
  }

  function handleSelectCustomer(customer: Customer) {
    setPickedCustomer(customer);
    update("customerId", customer.id);
    if (customer.organizationId) {
      update("organizationId", customer.organizationId);
    }
    setFormError(null);
  }

  return (
    <div className="space-y-6">
      <Stepper
        steps={STEPS}
        current={step}
        highestReached={highestReached}
        onStepSelect={(index) => {
          if (index < step || validateStep(step)) {
            goTo(index);
          }
        }}
      />

      {step === 0 ? (
        <Surface>
          <FormSection
            title="Customer"
            description={
              mode === "create"
                ? "Pick who you are billing. Use New to find customers who have never successfully received an invoice."
                : "Who are you billing?"
            }
          >
            {mode === "create" ? (
              <div className="space-y-4">
                <InvoiceCustomerPicker
                  selectedCustomerId={values.customerId}
                  canSend={canSend}
                  addedCustomers={addedCustomers}
                  onSelect={handleSelectCustomer}
                  onCustomerUpdated={(customer) => {
                    setPickedCustomer(customer);
                    setAddedCustomers((current) =>
                      current.map((item) => (item.id === customer.id ? customer : item)),
                    );
                  }}
                />
                {canCreateCustomer ? (
                  <Button type="button" variant="outline" onClick={() => setAddCustomerOpen(true)}>
                    Add new customer
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Customer"
                  htmlFor="invoice-customer"
                  required
                  hint="Choose an existing customer, or add a new one."
                >
                  <SelectInput
                    id="invoice-customer"
                    value={values.customerId}
                    onChange={(event) => update("customerId", event.target.value)}
                    required
                    aria-invalid={!values.customerId && Boolean(formError)}
                  >
                    <option value="">Select a customer</option>
                    {customerList.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                        {customer.company ? ` — ${customer.company}` : ""}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
              </div>
            )}
          </FormSection>
        </Surface>
      ) : null}

      {step === 1 ? (
        <Surface>
          <FormSection title="Invoice details" description="Set when this invoice is issued and when payment is due.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Invoice date" htmlFor="invoice-date" required hint="Defaults to today.">
                <TextInput
                  id="invoice-date"
                  type="date"
                  value={values.invoiceDate}
                  onChange={(event) => updateInvoiceDate(event.target.value)}
                  required
                />
              </Field>
              <Field
                label="Payment terms"
                htmlFor="invoice-payment-terms"
                required
                hint="Choose standard terms or pick a custom due date."
              >
                <SelectInput
                  id="invoice-payment-terms"
                  value={paymentTerm}
                  onChange={(event) =>
                    updatePaymentTerm(event.target.value as PaymentTermValue)
                  }
                >
                  {PAYMENT_TERM_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field
                label="Due date"
                htmlFor="invoice-due"
                required
                hint={
                  paymentTerm === "custom"
                    ? "Pick any due date on or after the invoice date."
                    : "Calculated from your payment terms. Switch to Custom date to override."
                }
              >
                <TextInput
                  id="invoice-due"
                  type="date"
                  value={values.dueDate}
                  min={values.invoiceDate}
                  onChange={(event) => updateDueDate(event.target.value)}
                  required
                />
              </Field>
              <Field label="Currency" htmlFor="invoice-currency" required>
                <TextInput
                  id="invoice-currency"
                  value={values.currency}
                  onChange={(event) => update("currency", event.target.value)}
                  placeholder="USD"
                  required
                />
              </Field>
              <Field
                label="Invoice number"
                htmlFor="invoice-number"
                hint={mode === "create" ? "Leave blank to generate one automatically." : undefined}
              >
                <TextInput
                  id="invoice-number"
                  value={values.invoiceNumber}
                  onChange={(event) => update("invoiceNumber", event.target.value)}
                  placeholder={mode === "create" ? "Generated if left blank" : undefined}
                />
              </Field>
            </div>
          </FormSection>
        </Surface>
      ) : null}

      {step === 2 ? (
        <InvoiceItemsSection
          items={values.items}
          currency={values.currency}
          totals={totals}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onUpdateItem={updateItem}
        />
      ) : null}

      {step === 3 ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <Surface className="space-y-6">
            <FormSection title="Review" description="Confirm the details before you save.">
              <dl className="grid gap-4 sm:grid-cols-2">
                <ReviewItem label="Customer" value={selectedCustomer?.name ?? "—"} />
                <ReviewItem
                  label="Company"
                  value={selectedCustomer?.company || "—"}
                />
                <ReviewItem label="Invoice date" value={values.invoiceDate} />
                <ReviewItem label="Due date" value={values.dueDate} />
                <ReviewItem label="Currency" value={values.currency} />
                <ReviewItem
                  label="Invoice number"
                  value={values.invoiceNumber || "Generated on save"}
                />
              </dl>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs font-medium uppercase tracking-wide text-muted">
                    <tr>
                      <th className="py-2 pr-3">Description</th>
                      <th className="py-2 pr-3 text-right">Qty</th>
                      <th className="py-2 pr-3 text-right">Unit Price</th>
                      <th className="py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {values.items.map((item, index) => (
                      <tr key={`review-${index}`} className="border-t border-border">
                        <td className="py-2 pr-3">{item.description || "—"}</td>
                        <td className="py-2 pr-3 text-right text-muted">{item.quantity}</td>
                        <td className="py-2 pr-3 text-right text-muted">
                          {item.unitPrice ? formatMoney(item.unitPrice, values.currency) : "—"}
                        </td>
                        <td className="py-2 text-right text-muted">
                          {formatMoney(calculateLineAmount(item.quantity, item.unitPrice), values.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
                onClick={() => setAdvancedOpen((open) => !open)}
              >
                {advancedOpen ? "Hide notes and terms" : "Notes and terms (optional)"}
              </button>
              {advancedOpen ? (
                <div className="space-y-4">
                  <Field label="Notes" htmlFor="invoice-notes">
                    <TextArea
                      id="invoice-notes"
                      rows={3}
                      value={values.notes}
                      placeholder="Thank you for your business."
                      onChange={(event) => update("notes", event.target.value)}
                    />
                  </Field>
                  <Field label="Terms" htmlFor="invoice-terms">
                    <TextArea
                      id="invoice-terms"
                      rows={3}
                      value={values.terms}
                      onChange={(event) => update("terms", event.target.value)}
                    />
                  </Field>
                </div>
              ) : null}
            </FormSection>
          </Surface>
          <aside className="rounded-2xl border border-border bg-surface p-5 lg:sticky lg:top-6">
            <h2 className="text-sm font-semibold text-foreground">Total</h2>
            <p className="mt-1 text-xs text-muted">The saved invoice uses server-calculated amounts.</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd>{formatMoney(totals.subtotal, values.currency)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatMoney(totals.total, values.currency)}</dd>
              </div>
            </dl>
          </aside>
        </div>
      ) : null}

      {formError || error ? (
        <p className="text-sm text-danger" role="alert">
          {formError ?? error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div>
          {step > 0 ? (
            <Button variant="ghost" onClick={() => goTo(step - 1)} disabled={busy}>
              Back
            </Button>
          ) : (
            <Link href="/invoices">
              <Button variant="ghost">Cancel</Button>
            </Link>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {step < STEPS.length - 1 ? (
            <Button onClick={handleNext}>{step === 2 ? "Continue" : "Next"}</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => void save()} disabled={busy}>
                {busy ? "Saving…" : "Save draft"}
              </Button>
              <Button onClick={() => void save()} disabled={busy}>
                {busy ? "Saving…" : mode === "create" ? "Create invoice" : "Save invoice"}
              </Button>
            </>
          )}
        </div>
      </div>

      {addCustomerOpen ? (
        <CustomerForm
          title="Add customer"
          mode="create"
          persistKey="customer-form:invoice-quick-add"
          busy={customerBusy}
          onClose={() => setAddCustomerOpen(false)}
          onSubmit={handleCreateCustomer}
        />
      ) : null}
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function valuesFromInvoice(invoice: Invoice): InvoiceFormValues {
  return {
    customerId: invoice.customerId,
    organizationId: invoice.organizationId,
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate.slice(0, 10),
    dueDate: invoice.dueDate.slice(0, 10),
    currency: invoice.currency,
    notes: invoice.notes ?? "",
    terms: invoice.terms ?? "",
    assignedMemberId: invoice.assignedMemberId ?? "",
    items: invoice.items.map((item) => ({
      productId: item.productId ?? "",
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  };
}
