"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ChangePasswordFields, validateNewPassword } from "@/components/change-password-fields";
import { Field, SelectInput, TextInput } from "@/components/ui/field";
import { memberFormSchema } from "@/schemas/member";
import { usePersistedFormState } from "@/hooks/use-persisted-form-state";
import type { AdministratorSummary, MemberFormValues, MemberUser } from "@/types/member";

interface MemberFormProps {
  title: string;
  mode: "create" | "edit";
  persistKey: string;
  initialValues?: Partial<MemberFormValues>;
  /** When provided (Super Admin), the new member can be assigned to an administrator. */
  administrators?: AdministratorSummary[];
  busy: boolean;
  onClose: () => void;
  /** `newPassword` is only set in edit mode when one was entered. */
  onSubmit: (values: MemberFormValues, newPassword?: string) => Promise<void>;
}

const emptyValues: MemberFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  organizationId: "",
  administratorId: "",
  status: "ACTIVE",
};

export function MemberForm({
  title,
  mode,
  persistKey,
  initialValues,
  administrators,
  busy,
  onClose,
  onSubmit,
}: MemberFormProps) {
  const [values, setValues, clearDraft] = usePersistedFormState<MemberFormValues>(persistKey, {
    ...emptyValues,
    ...initialValues,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof MemberFormValues, string>>>({});
  // Kept out of the persisted draft so passwords never reach sessionStorage.
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

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
    const nextPasswordError =
      mode === "edit" ? validateNewPassword(newPassword, confirmPassword) : null;
    if (nextPasswordError) {
      setPasswordError(nextPasswordError);
      return;
    }
    setErrors({});
    setPasswordError(null);
    await onSubmit(
      {
        ...parsed.data,
        organizationId: values.organizationId,
        administratorId: values.administratorId ?? "",
      },
      mode === "edit" && newPassword ? newPassword : undefined,
    );
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
            {administrators ? (
              <Field
                label="Administrator"
                htmlFor="member-administrator"
                error={errors.administratorId}
              >
                <SelectInput
                  id="member-administrator"
                  value={values.administratorId ?? ""}
                  onChange={(event) => update("administratorId", event.target.value)}
                >
                  <option value="">Unassigned</option>
                  {administrators.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.firstName} {admin.lastName} ({admin.email})
                    </option>
                  ))}
                </SelectInput>
              </Field>
            ) : null}
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
            <p className="text-xs text-muted">
              A secure temporary password is generated automatically and shown only once after you
              save.
            </p>
          </>
        ) : (
          <ChangePasswordFields
            idPrefix="member"
            subject="member"
            newPassword={newPassword}
            confirmPassword={confirmPassword}
            error={passwordError}
            onNewPasswordChange={setNewPassword}
            onConfirmPasswordChange={setConfirmPassword}
          />
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
    administratorId: member.administrator?.id ?? "",
    status: member.status,
  };
}
