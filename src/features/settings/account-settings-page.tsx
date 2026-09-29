"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, PasswordInput, TextInput } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { SelectedFileName } from "@/components/ui/selected-file-name";
import { ROLE_LABELS } from "@/config/navigation";
import { usePersistedFormState } from "@/hooks/use-persisted-form-state";
import { useSelectedImage } from "@/hooks/use-selected-image";
import { ApiError } from "@/lib/api/types";
import { purgeLegacyCredentialStorage } from "@/lib/legacy-credential-storage";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { changePassword, removeAvatar, updateProfile, uploadAvatar } from "@/services/auth.service";
import { isAllowedLogoFile } from "@/services/settings.service";

export function AccountSettingsPage() {
  const { user, refresh } = useAuth();
  const { notify } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedAvatar = useSelectedImage();
  const [firstName, setFirstName, clearFirstNameDraft] = usePersistedFormState(
    "settings:account:first-name",
    "",
  );
  const [lastName, setLastName, clearLastNameDraft] = usePersistedFormState(
    "settings:account:last-name",
    "",
  );
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    purgeLegacyCredentialStorage();
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }
    setFirstName((current) => current || user.firstName);
    setLastName((current) => current || user.lastName);
  }, [setFirstName, setLastName, user]);

  if (!user) {
    return <p className="text-sm text-muted">Loading account…</p>;
  }

  async function handleSaveProfile(event: React.FormEvent) {
    event.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({ firstName, lastName });
      await refresh();
      clearFirstNameDraft();
      clearLastNameDraft();
      notify("Profile saved");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to save profile.", "error");
    } finally {
      setSavingProfile(false);
    }
  }

  function handlePickAvatar(file: File | undefined) {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (!file) {
      return;
    }
    if (!isAllowedLogoFile(file)) {
      notify("Use a PNG, JPG, or WebP image up to 2MB.", "error");
      return;
    }
    selectedAvatar.select(file);
  }

  async function handleSaveAvatar() {
    const file = selectedAvatar.file;
    if (!file) {
      return;
    }
    setAvatarBusy(true);
    try {
      await uploadAvatar(file);
      await refresh();
      selectedAvatar.reset();
      notify("Profile picture saved");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Unable to upload profile picture.", "error");
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleRemoveAvatar() {
    setAvatarBusy(true);
    try {
      await removeAvatar();
      await refresh();
      selectedAvatar.reset();
      notify("Profile picture removed");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to remove profile picture.", "error");
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleChangePassword(event: React.FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      notify("New passwords do not match.", "error");
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      notify("Password changed");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to change password.", "error");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Account" description="Your Super Admin profile and sign-in details." />

      <section className="rounded-2xl border border-border bg-surface px-5 py-5">
        <h2 className="text-sm font-semibold text-foreground">Profile picture</h2>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-border bg-muted-soft">
            {selectedAvatar.previewUrl || user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedAvatar.previewUrl ?? user.avatarUrl ?? undefined}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-lg font-semibold text-muted">
                {user.firstName.slice(0, 1)}
                {user.lastName.slice(0, 1)}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => handlePickAvatar(event.target.files?.[0])}
              />
              {selectedAvatar.file ? (
                <>
                  <Button type="button" disabled={avatarBusy} onClick={() => void handleSaveAvatar()}>
                    {avatarBusy ? "Saving…" : "Save picture"}
                  </Button>
                  <Button type="button" variant="secondary" disabled={avatarBusy} onClick={selectedAvatar.reset}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" disabled={avatarBusy} onClick={() => fileInputRef.current?.click()}>
                    Change picture
                  </Button>
                  {user.avatarUrl ? (
                    <Button type="button" variant="secondary" disabled={avatarBusy} onClick={() => void handleRemoveAvatar()}>
                      Remove
                    </Button>
                  ) : null}
                </>
              )}
            </div>
            <SelectedFileName fileName={selectedAvatar.fileName} busy={avatarBusy} />
          </div>
        </div>
      </section>

      <form className="rounded-2xl border border-border bg-surface px-5 py-5" onSubmit={(event) => void handleSaveProfile(event)}>
        <h2 className="text-sm font-semibold text-foreground">Profile information</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="First name" htmlFor="acct-first">
            <TextInput id="acct-first" value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
          </Field>
          <Field label="Last name" htmlFor="acct-last">
            <TextInput id="acct-last" value={lastName} onChange={(event) => setLastName(event.target.value)} required />
          </Field>
          <Field label="Email address" htmlFor="acct-email" hint="Email cannot be changed here.">
            <TextInput id="acct-email" value={user.email} readOnly disabled />
          </Field>
          <Field label="Role" htmlFor="acct-role">
            <TextInput id="acct-role" value={ROLE_LABELS[user.role]} readOnly disabled />
          </Field>
        </div>
        <div className="mt-4">
          <Button type="submit" disabled={savingProfile}>
            {savingProfile ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>

      <form className="rounded-2xl border border-border bg-surface px-5 py-5" onSubmit={(event) => void handleChangePassword(event)}>
        <h2 className="text-sm font-semibold text-foreground">Change password</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Current password" htmlFor="acct-current">
            <PasswordInput
              id="acct-current"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
          </Field>
          <div />
          <Field label="New password" htmlFor="acct-new">
            <PasswordInput
              id="acct-new"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={8}
              required
            />
          </Field>
          <Field label="Confirm new password" htmlFor="acct-confirm">
            <PasswordInput
              id="acct-confirm"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
              required
            />
          </Field>
        </div>
        <div className="mt-4">
          <Button type="submit" disabled={savingPassword}>
            {savingPassword ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}
