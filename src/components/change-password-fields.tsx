"use client";

import { Field, PasswordInput } from "@/components/ui/field";

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

/** Returns an error message, or null when both fields are blank (keep current) or valid. */
export function validateNewPassword(newPassword: string, confirmPassword: string): string | null {
  if (!newPassword && !confirmPassword) {
    return null;
  }
  if (newPassword.length < PASSWORD_MIN || newPassword.length > PASSWORD_MAX) {
    return `Password must be ${PASSWORD_MIN}–${PASSWORD_MAX} characters.`;
  }
  if (newPassword !== confirmPassword) {
    return "Passwords do not match.";
  }
  return null;
}

/**
 * Optional "Change password" section for edit dialogs. Callers must hold the values in
 * plain component state — never in persisted form drafts.
 */
export function ChangePasswordFields({
  idPrefix,
  subject,
  newPassword,
  confirmPassword,
  error,
  onNewPasswordChange,
  onConfirmPasswordChange,
}: {
  idPrefix: string;
  subject: string;
  newPassword: string;
  confirmPassword: string;
  error: string | null;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-4 border-t border-border pt-4">
      <div>
        <p className="text-sm font-medium text-foreground">Change password</p>
        <p className="text-xs text-muted">
          Leave blank to keep the current password. Saving a new one signs this {subject} out
          immediately.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="New password" htmlFor={`${idPrefix}-new-password`}>
          <PasswordInput
            id={`${idPrefix}-new-password`}
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => onNewPasswordChange(event.target.value)}
          />
        </Field>
        <Field
          label="Confirm new password"
          htmlFor={`${idPrefix}-confirm-password`}
          error={error ?? undefined}
        >
          <PasswordInput
            id={`${idPrefix}-confirm-password`}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => onConfirmPasswordChange(event.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}
