"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, PhoneInput, SelectInput, TextArea, TextInput } from "@/components/ui/field";
import { MoreOptions } from "@/components/ui/form-section";
import { customerFormSchema } from "@/schemas/catalog";
import { usePersistedFormState } from "@/hooks/use-persisted-form-state";
import type { Address, AddressFormValues, Customer, CustomerFormValues } from "@/types/catalog";

interface CustomerFormProps {
  title: string;
  mode: "create" | "edit";
  persistKey: string;
  initialValues?: Partial<CustomerFormValues>;
  busy: boolean;
  onClose: () => void;
  onSubmit: (values: CustomerFormValues) => Promise<void>;
}

const emptyAddress: AddressFormValues = {
  line1: "",
  line2: "",
  city: "",
  region: "",
  postalCode: "",
  country: "",
};

const emptyValues: CustomerFormValues = {
  name: "",
  company: "",
  email: "",
  phone: "",
  taxNumber: "",
  notes: "",
  organizationId: "",
  isActive: true,
  billingAddress: emptyAddress,
  shippingAddress: emptyAddress,
};

export function CustomerForm({
  title,
  mode,
  persistKey,
  initialValues,
  busy,
  onClose,
  onSubmit,
}: CustomerFormProps) {
  const [values, setValues, clearDraft] = usePersistedFormState<CustomerFormValues>(persistKey, {
    ...emptyValues,
    ...initialValues,
    billingAddress: { ...emptyAddress, ...initialValues?.billingAddress },
    shippingAddress: { ...emptyAddress, ...initialValues?.shippingAddress },
  });
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof CustomerFormValues>(key: K, value: CustomerFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function updateAddress(
    key: "billingAddress" | "shippingAddress",
    field: keyof AddressFormValues,
    value: string,
  ) {
    setValues((current) => ({
      ...current,
      [key]: { ...current[key], [field]: value },
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = customerFormSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form and try again.");
      return;
    }
    setError(null);
    await onSubmit(values);
    clearDraft();
  }

  return (
    <Dialog
      title={title}
      wide
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="customer-form" disabled={busy}>
            {busy ? "Saving…" : mode === "create" ? "Add customer" : "Save changes"}
          </Button>
        </>
      }
    >
      <form id="customer-form" className="grid gap-6" onSubmit={(event) => void handleSubmit(event)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="customer-name" required>
            <TextInput
              id="customer-name"
              value={values.name}
              placeholder="Acme Ltd"
              onChange={(event) => update("name", event.target.value)}
              required
            />
          </Field>
          <Field label="Company" htmlFor="customer-company">
            <TextInput
              id="customer-company"
              value={values.company}
              placeholder="Optional"
              onChange={(event) => update("company", event.target.value)}
            />
          </Field>
          <Field label="Email" htmlFor="customer-email">
            <TextInput
              id="customer-email"
              type="email"
              value={values.email}
              placeholder="billing@company.com"
              onChange={(event) => update("email", event.target.value)}
            />
          </Field>
          <Field label="Phone" htmlFor="customer-phone">
            <PhoneInput
              id="customer-phone"
              value={values.phone}
              onChange={(event) => update("phone", event.target.value)}
            />
          </Field>
          <Field label="Tax / VAT / PAN" htmlFor="customer-tax">
            <TextInput
              id="customer-tax"
              value={values.taxNumber}
              onChange={(event) => update("taxNumber", event.target.value)}
            />
          </Field>
          <Field label="Status" htmlFor="customer-status">
            <SelectInput
              id="customer-status"
              value={values.isActive ? "ACTIVE" : "INACTIVE"}
              onChange={(event) => update("isActive", event.target.value === "ACTIVE")}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </SelectInput>
          </Field>
        </div>
        <MoreOptions
          title="More options"
          defaultOpen={Boolean(
            values.notes ||
              Object.values(values.billingAddress).some((value) => value.trim()) ||
              Object.values(values.shippingAddress).some((value) => value.trim()),
          )}
        >
          <Field label="Notes" htmlFor="customer-notes">
            <TextArea
              id="customer-notes"
              rows={3}
              value={values.notes}
              onChange={(event) => update("notes", event.target.value)}
            />
          </Field>
          <AddressFields
            title="Billing address"
            prefix="billing"
            values={values.billingAddress}
            onChange={(field, value) => updateAddress("billingAddress", field, value)}
          />
          <AddressFields
            title="Shipping address"
            prefix="shipping"
            values={values.shippingAddress}
            onChange={(field, value) => updateAddress("shippingAddress", field, value)}
          />
        </MoreOptions>
        {error ? (
          <p className="text-sm text-primary" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}

function AddressFields({
  title,
  prefix,
  values,
  onChange,
}: {
  title: string;
  prefix: string;
  values: AddressFormValues;
  onChange: (field: keyof AddressFormValues, value: string) => void;
}) {
  const addressStarted = Object.values(values).some((value) => value.trim().length > 0);

  return (
    <fieldset className="grid gap-3 rounded-lg border border-border p-4">
      <legend className="px-1 text-sm font-medium text-foreground">{title}</legend>
      <Field label="Line 1" htmlFor={`${prefix}-line1`} required={addressStarted}>
        <TextInput
          id={`${prefix}-line1`}
          value={values.line1}
          onChange={(event) => onChange("line1", event.target.value)}
          required={addressStarted}
        />
      </Field>
      <Field label="Line 2" htmlFor={`${prefix}-line2`}>
        <TextInput
          id={`${prefix}-line2`}
          value={values.line2}
          onChange={(event) => onChange("line2", event.target.value)}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="City" htmlFor={`${prefix}-city`} required={addressStarted}>
          <TextInput
            id={`${prefix}-city`}
            value={values.city}
            onChange={(event) => onChange("city", event.target.value)}
            required={addressStarted}
          />
        </Field>
        <Field label="Region" htmlFor={`${prefix}-region`}>
          <TextInput
            id={`${prefix}-region`}
            value={values.region}
            onChange={(event) => onChange("region", event.target.value)}
          />
        </Field>
        <Field label="Postal code" htmlFor={`${prefix}-postal`}>
          <TextInput
            id={`${prefix}-postal`}
            value={values.postalCode}
            onChange={(event) => onChange("postalCode", event.target.value)}
          />
        </Field>
        <Field label="Country" htmlFor={`${prefix}-country`} required={addressStarted}>
          <TextInput
            id={`${prefix}-country`}
            value={values.country}
            onChange={(event) => onChange("country", event.target.value)}
            required={addressStarted}
          />
        </Field>
      </div>
    </fieldset>
  );
}

function addressToForm(address: Address | null): AddressFormValues {
  return {
    line1: address?.line1 ?? "",
    line2: address?.line2 ?? "",
    city: address?.city ?? "",
    region: address?.region ?? "",
    postalCode: address?.postalCode ?? "",
    country: address?.country ?? "",
  };
}

export function valuesFromCustomer(customer: Customer): CustomerFormValues {
  return {
    name: customer.name,
    company: customer.company ?? "",
    email: customer.email ?? "",
    phone: customer.phone ?? "",
    taxNumber: customer.taxNumber ?? "",
    notes: customer.notes ?? "",
    organizationId: customer.organizationId,
    isActive: customer.isActive,
    billingAddress: addressToForm(customer.billingAddress),
    shippingAddress: addressToForm(customer.shippingAddress),
  };
}
