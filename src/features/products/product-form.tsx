"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, SelectInput, TextArea, TextInput } from "@/components/ui/field";
import { productFormSchema } from "@/schemas/catalog";
import { usePersistedFormState } from "@/hooks/use-persisted-form-state";
import type { Product, ProductFormValues } from "@/types/catalog";

interface ProductFormProps {
  title: string;
  mode: "create" | "edit";
  persistKey: string;
  initialValues?: Partial<ProductFormValues>;
  busy: boolean;
  onClose: () => void;
  onSubmit: (values: ProductFormValues) => Promise<void>;
}

const emptyValues: ProductFormValues = {
  name: "",
  kind: "PRODUCT",
  description: "",
  sku: "",
  unit: "each",
  unitPrice: "",
  currency: "USD",
  taxRate: "",
  organizationId: "",
  isActive: true,
};

export function ProductForm({
  title,
  mode,
  persistKey,
  initialValues,
  busy,
  onClose,
  onSubmit,
}: ProductFormProps) {
  const [values, setValues, clearDraft] = usePersistedFormState<ProductFormValues>(persistKey, {
    ...emptyValues,
    ...initialValues,
  });
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = productFormSchema.safeParse(values);
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
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="product-form" disabled={busy}>
            {busy ? "Saving…" : mode === "create" ? "Add product" : "Save changes"}
          </Button>
        </>
      }
    >
      <form id="product-form" className="grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
        <Field label="Name" htmlFor="product-name" required>
          <TextInput
            id="product-name"
            value={values.name}
            onChange={(event) => update("name", event.target.value)}
            required
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type" htmlFor="product-kind">
            <SelectInput
              id="product-kind"
              value={values.kind}
              onChange={(event) => update("kind", event.target.value as ProductFormValues["kind"])}
            >
              <option value="PRODUCT">Product</option>
              <option value="SERVICE">Service</option>
            </SelectInput>
          </Field>
          <Field label="Status" htmlFor="product-status">
            <SelectInput
              id="product-status"
              value={values.isActive ? "ACTIVE" : "INACTIVE"}
              onChange={(event) => update("isActive", event.target.value === "ACTIVE")}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </SelectInput>
          </Field>
        </div>
        <Field label="Description" htmlFor="product-description">
          <TextArea
            id="product-description"
            rows={3}
            value={values.description}
            onChange={(event) => update("description", event.target.value)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="SKU" htmlFor="product-sku">
            <TextInput
              id="product-sku"
              value={values.sku}
              onChange={(event) => update("sku", event.target.value)}
            />
          </Field>
          <Field label="Unit" htmlFor="product-unit">
            <TextInput
              id="product-unit"
              value={values.unit}
              onChange={(event) => update("unit", event.target.value)}
              placeholder="each, hour, kg"
            />
          </Field>
          <Field label="Price" htmlFor="product-price" required>
            <TextInput
              id="product-price"
              type="number"
              min="0"
              step="0.01"
              value={values.unitPrice}
              onChange={(event) => update("unitPrice", event.target.value)}
              required
            />
          </Field>
          <Field label="Currency" htmlFor="product-currency" required>
            <TextInput
              id="product-currency"
              value={values.currency}
              onChange={(event) => update("currency", event.target.value)}
              required
            />
          </Field>
          <Field label="Tax rate (%)" htmlFor="product-tax">
            <TextInput
              id="product-tax"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={values.taxRate}
              onChange={(event) => update("taxRate", event.target.value)}
            />
          </Field>
        </div>
        {error ? (
          <p className="text-sm text-primary" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}

export function valuesFromProduct(product: Product): ProductFormValues {
  return {
    name: product.name,
    kind: product.kind,
    description: product.description ?? "",
    sku: product.sku ?? "",
    unit: product.unit ?? "",
    unitPrice: String(product.unitPrice),
    currency: product.currency,
    taxRate: product.taxRate === null ? "" : String(product.taxRate),
    organizationId: product.organizationId,
    isActive: product.isActive,
  };
}
