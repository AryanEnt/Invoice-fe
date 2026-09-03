"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, PasswordInput, SelectInput, TextInput } from "@/components/ui/field";
import { memberFormSchema } from "@/schemas/member";
import { usePersistedFormState } from "@/hooks/use-persisted-form-state";
import type { MemberFormValues, MemberUser } from "@/types/member";

interface MemberFormProps {
  title: string;
  mode: "create" | "edit";
  persistKey: string;
  initialValues?: Partial<MemberFormValues>;
  busy: boolean;
  onClose: () => void;
  onSubmit: (values: MemberFormValues) => Promise<void>;
}

const emptyValues: MemberFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  organizationId: "",
  temporaryPassword: "",
  status: "ACTIVE",
};

export function MemberForm({
  title,
  mode,
  persistKey,
  initialValues,
  busy,
  onClose,
  onSubmit,
}: MemberFormProps) {
  const [values, setValues, clearDraft] = usePersistedFormState<MemberFormValues>(persistKey, {
    ...emptyValues,
    ...initialValues,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof MemberFormValues, string>>>({});

  function update<K extends keyof MemberFormValues>(key: K, value: MemberFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = memberFormSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof MemberFormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") {
          nextErrors[key as keyof MemberFormValues] = issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    await onSubmit({
      ...parsed.data,
      organizationId: values.organizationId,
    });
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
          <Button type="submit" form="member-form" disabled={busy}>
            {busy ? "Saving…" : mode === "create" ? "Create member" : "Save changes"}
          </Button>
        </>
      }
    >
      <form id="member-form" className="grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" htmlFor="member-firstName" error={errors.firstName} required>
            <TextInput
              id="member-firstName"
              value={values.firstName}
              onChange={(event) => update("firstName", event.target.value)}
              required
            />
          </Field>
          <Field label="Last name" htmlFor="member-lastName" error={errors.lastName} required>
            <TextInput
              id="member-lastName"
              value={values.lastName}
              onChange={(event) => update("lastName", event.target.value)}
              required
            />
          </Field>
        </div>
        <Field label="Email" htmlFor="member-email" error={errors.email} required>
          <TextInput
            id="member-email"
            type="email"
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
            required
          />
        </Field>
        {mode === "create" ? (
          <>
            <Field
              label="Temporary password"
              htmlFor="member-password"
              error={errors.temporaryPassword}
            >
              <PasswordInput
                id="member-password"
                autoComplete="new-password"
                value={values.temporaryPassword}
                onChange={(event) => update("temporaryPassword", event.target.value)}
              />
            </Field>
            <p className="text-xs text-muted">
              Leave blank to generate a secure temporary password. It will be shown once.
            </p>
            <Field label="Status" htmlFor="member-status" error={errors.status}>
              <SelectInput
                id="member-status"
                value={values.status}
                onChange={(event) =>
                  update("status", event.target.value as MemberFormValues["status"])
                }
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </SelectInput>
            </Field>
          </>
        ) : (
          <>
            <Field
              label="New password"
              htmlFor="member-password-edit"
              error={errors.temporaryPassword}
            >
              <PasswordInput
                id="member-password-edit"
                autoComplete="new-password"
                value={values.temporaryPassword}
                onChange={(event) => update("temporaryPassword", event.target.value)}
                placeholder="Leave blank to keep current password"
              />
            </Field>
            <p className="text-xs text-muted">
              Set a new password here, or leave blank to keep the current one.
            </p>
          </>
        )}
      </form>
    </Dialog>
  );
}

export function valuesFromMember(member: MemberUser): MemberFormValues {
  return {
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    organizationId: member.organizationId ?? "",
    temporaryPassword: "",
    status: member.status,
  };
}
