"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, SelectInput, TextInput } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import {
  getFormDraft,
  usePersistedFormState,
} from "@/hooks/use-persisted-form-state";
import { ApiError } from "@/lib/api/types";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import {
  getInvoiceSettings,
  removeOrganizationLogo,
  saveInvoiceSettings,
  uploadOrganizationLogo,
  type InvoiceSettings,
} from "@/services/settings.service";

const CURRENCIES = ["USD", "NPR", "EUR", "GBP", "INR", "AUD", "CAD"];
const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ne", label: "Nepali" },
];

const SETTINGS_DRAFT_KEY = "settings:invoice";

export function InvoiceSettingsPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canManageLogo = user?.role === "SUPER_ADMIN";
  const [settings, setSettings, clearSettingsDraft] = usePersistedFormState<InvoiceSettings | null>(
    SETTINGS_DRAFT_KEY,
    null,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInvoiceSettings();
      const draft = getFormDraft<InvoiceSettings>(SETTINGS_DRAFT_KEY);
      setSettings(draft ?? data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load invoice settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!settings) {
      return;
    }
    setSaving(true);
    try {
      const saved = await saveInvoiceSettings({
        ...(canManageLogo
          ? { companyName: (settings.companyName ?? settings.organizationName).trim() }
          : {}),
        currency: settings.currency,
        language: settings.language,
        address: settings.address,
      });
      setSettings(saved);
      clearSettingsDraft();
      notify("Invoice settings saved");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to save invoice settings.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogo(file: File | undefined) {
    if (!file) {
      return;
    }
    setLogoBusy(true);
    try {
      await uploadOrganizationLogo(file);
      await load();
      notify("Logo updated successfully");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Unable to upload logo.", "error");
    } finally {
      setLogoBusy(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleRemoveLogo() {
    setLogoBusy(true);
    try {
      await removeOrganizationLogo();
      await load();
      notify("Logo removed");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to remove logo.", "error");
    } finally {
      setLogoBusy(false);
    }
  }

  if (user && user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
    return <p className="text-sm text-muted">You do not have access to invoice settings.</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoice Settings"
        description="Company branding and default invoice details used across PDFs, emails, and the customer page."
      />

      {loading ? (
        <p className="text-sm text-muted">Loading invoice settings…</p>
      ) : error || !settings ? (
        <p className="text-sm text-red-700">{error ?? "Settings unavailable."}</p>
      ) : (
        <form className="space-y-6" onSubmit={(event) => void handleSave(event)}>
          {canManageLogo ? (
          <section className="rounded-2xl border border-border bg-surface px-5 py-5">
            <h2 className="text-sm font-semibold text-foreground">Company Logo</h2>
            <p className="mt-1 text-xs text-muted">Recommended: PNG, JPG, SVG or WebP · max 2MB</p>
            <div className="mt-4 flex h-40 w-full max-w-md items-center justify-center rounded-xl border border-dashed border-border bg-muted-soft/40 p-4">
              {settings.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={settings.logoUrl}
                  alt={`${settings.organizationName} logo`}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <p className="text-sm text-muted">No logo uploaded</p>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(event) => void handleLogo(event.target.files?.[0])}
              />
              <Button type="button" disabled={logoBusy} onClick={() => fileInputRef.current?.click()}>
                {settings.hasLogo ? "Upload New Logo" : "Upload Logo"}
              </Button>
              {settings.hasLogo ? (
                <Button type="button" variant="secondary" disabled={logoBusy} onClick={() => void handleRemoveLogo()}>
                  Remove
                </Button>
              ) : null}
            </div>
            <div className="mt-5 max-w-md">
              <Field
                label="Company name"
                htmlFor="invoice-company-name"
                hint="Shown on invoice PDFs, emails, and the customer invoice page."
                required
              >
                <TextInput
                  id="invoice-company-name"
                  value={settings.companyName ?? settings.organizationName ?? ""}
                  onChange={(event) =>
                    setSettings({ ...settings, companyName: event.target.value })
                  }
                  placeholder="Your company name"
                  required
                />
              </Field>
            </div>
          </section>
          ) : null}

          <section className="rounded-2xl border border-border bg-surface px-5 py-5">
            <h2 className="text-sm font-semibold text-foreground">Defaults</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Currency" htmlFor="invoice-currency">
                <SelectInput
                  id="invoice-currency"
                  value={settings.currency}
                  onChange={(event) =>
                    setSettings({ ...settings, currency: event.target.value })
                  }
                >
                  {CURRENCIES.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Language" htmlFor="invoice-language">
                <SelectInput
                  id="invoice-language"
                  value={settings.language}
                  onChange={(event) =>
                    setSettings({ ...settings, language: event.target.value })
                  }
                >
                  {LANGUAGES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface px-5 py-5">
            <h2 className="text-sm font-semibold text-foreground">Invoice Address</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Address line 1" htmlFor="addr-line1">
                <TextInput
                  id="addr-line1"
                  value={settings.address.line1}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      address: { ...settings.address, line1: event.target.value },
                    })
                  }
                />
              </Field>
              <Field label="Address line 2" htmlFor="addr-line2">
                <TextInput
                  id="addr-line2"
                  value={settings.address.line2}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      address: { ...settings.address, line2: event.target.value },
                    })
                  }
                />
              </Field>
              <Field label="City" htmlFor="addr-city">
                <TextInput
                  id="addr-city"
                  value={settings.address.city}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      address: { ...settings.address, city: event.target.value },
                    })
                  }
                />
              </Field>
              <Field label="Region / state" htmlFor="addr-region">
                <TextInput
                  id="addr-region"
                  value={settings.address.region}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      address: { ...settings.address, region: event.target.value },
                    })
                  }
                />
              </Field>
              <Field label="Postal code" htmlFor="addr-postal">
                <TextInput
                  id="addr-postal"
                  value={settings.address.postalCode}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      address: { ...settings.address, postalCode: event.target.value },
                    })
                  }
                />
              </Field>
              <Field label="Country" htmlFor="addr-country">
                <TextInput
                  id="addr-country"
                  value={settings.address.country}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      address: { ...settings.address, country: event.target.value },
                    })
                  }
                />
              </Field>
            </div>
          </section>

          <div>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
