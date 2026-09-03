"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, TextInput } from "@/components/ui/field";
import { createAdminFormSchema } from "@/schemas/admin";
import { usePersistedFormState } from "@/hooks/use-persisted-form-state";
import type { AdminFormValues, AdminUser } from "@/types/admin";

interface AdministratorFormProps {
  title: string;
  initialValues?: Partial<AdminFormValues>;
  mode: "create" | "edit";
  persistKey: string;
  busy: boolean;
  onClose: () => void;
  onSubmit: (values: AdminFormValues) => Promise<void>;
}

const emptyValues: AdminFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  organizationId: "",
  temporaryPassword: "",
  status: "ACTIVE",
};

export function AdministratorForm({
  title,
  initialValues,
  mode,
  persistKey,
  busy,
  onClose,
  onSubmit,
}: AdministratorFormProps) {
  const [values, setValues, clearDraft] = usePersistedFormState<AdminFormValues>(persistKey, {
    ...emptyValues,
    ...initialValues,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof AdminFormValues, string>>>({});

  function update<K extends keyof AdminFormValues>(key: K, value: AdminFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (mode === "create") {
      const parsed = createAdminFormSchema.safeParse(values);
      if (!parsed.success) {
        const nextErrors: Partial<Record<keyof AdminFormValues, string>> = {};
        for (const issue of parsed.error.issues) {
          const key = issue.path[0];
          if (typeof key === "string") {
            nextErrors[key as keyof AdminFormValues] = issue.message;
          }
        }
        setErrors(nextErrors);
        return;
      }
      setErrors({});
      await onSubmit({
        ...values,
        ...parsed.data,
      } as AdminFormValues);
      clearDraft();
      return;
    }

    if (!values.firstName.trim() || !values.lastName.trim() || !values.email.trim()) {
      setErrors({ email: "All fields are required." });
      return;
    }
    setErrors({});
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
          <Button type="submit" form="administrator-form" disabled={busy}>
            {busy ? "Saving…" : mode === "create" ? "Create administrator" : "Save changes"}
          </Button>
        </>
      }
    >
      <form id="administrator-form" className="grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" htmlFor="firstName" error={errors.firstName} required>
            <TextInput
              id="firstName"
              value={values.firstName}
              onChange={(event) => update("firstName", event.target.value)}
              required
            />
          </Field>
          <Field label="Last name" htmlFor="lastName" error={errors.lastName} required>
            <TextInput
              id="lastName"
              value={values.lastName}
              onChange={(event) => update("lastName", event.target.value)}
              required
            />
          </Field>
        </div>
        <Field
          label="Email / username"
          htmlFor="email"
          error={errors.email}
          required
          hint="This is the login username."
        >
          <TextInput
            id="email"
            type="email"
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
            required
          />
        </Field>
        {mode === "create" ? (
          <p className="text-xs text-muted">
            A temporary password is generated automatically and appears in the Password column after you save.
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}

export function valuesFromAdmin(admin: AdminUser): AdminFormValues {
  return {
    firstName: admin.firstName,
    lastName: admin.lastName,
    email: admin.email,
    phone: "",
    organizationId: admin.organizationId ?? "",
    temporaryPassword: "",
    status: admin.status,
  };
}
