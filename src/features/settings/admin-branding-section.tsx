"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { ApiError } from "@/lib/api/types";
import { useToast } from "@/providers/toast-provider";
import {
  getAdminBranding,
  removeAdminBrandingLogo,
  saveAdminBranding,
  uploadAdminBrandingLogo,
  type AdminBrandingSettings,
} from "@/services/settings.service";

export function AdminBrandingSection() {
  const { notify } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [branding, setBranding] = useState<AdminBrandingSettings | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminBranding();
      setBranding(data);
      setCompanyName(data.companyName ?? "");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load company branding.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const trimmed = companyName.trim();
      const saved = await saveAdminBranding({
        companyName: trimmed.length > 0 ? trimmed : null,
      });
      setBranding(saved);
      setCompanyName(saved.companyName ?? "");
      notify(
        saved.hasCustomBranding
          ? "Company branding saved"
          : "Custom company name cleared — using platform default",
      );
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to save branding.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(file: File | undefined) {
    if (!file) {
      return;
    }
    setLogoBusy(true);
    try {
      const updated = await uploadAdminBrandingLogo(file);
      setBranding(updated);
      notify("Company logo updated");
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
      const updated = await removeAdminBrandingLogo();
      setBranding(updated);
      notify("Company logo removed");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to remove logo.", "error");
    } finally {
      setLogoBusy(false);
    }
  }

  const previewName =
    companyName.trim() || branding?.platformCompanyName || "Your company name";
  const previewLogo = branding?.companyLogoUrl || branding?.platformLogoUrl;

  return (
    <section id="company-branding" className="rounded-2xl border border-border bg-surface px-5 py-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Company Branding</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Customize the company information and logo displayed on invoices and customer emails
            sent by your members.
          </p>
        </div>
        {branding ? (
          <p
            className={`mt-2 text-xs font-medium sm:mt-0 ${
              branding.hasCustomBranding ? "text-success" : "text-muted"
            }`}
          >
            {branding.hasCustomBranding
              ? "Custom branding active"
              : "Using platform default branding"}
          </p>
        ) : null}
      </div>

      {loading ? (
        <p className="mt-5 text-sm text-muted">Loading branding…</p>
      ) : error ? (
        <p className="mt-5 text-sm text-red-700">{error}</p>
      ) : (
        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <form className="space-y-5" onSubmit={(event) => void handleSave(event)}>
            <Field label="Company Name" htmlFor="admin-company-name">
              <TextInput
                id="admin-company-name"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder={branding?.platformCompanyName || "Acme Consulting Pvt. Ltd."}
                maxLength={150}
              />
            </Field>
            <p className="text-xs text-muted">
              Leave blank to use the platform default
              {branding?.platformCompanyName ? ` (“${branding.platformCompanyName}”).` : "."}
            </p>

            <div>
              <h3 className="text-sm font-medium text-foreground">Company Logo</h3>
              <p className="mt-1 text-xs text-muted">PNG, JPG, SVG, or WebP · max 2MB</p>

              <div className="mt-3 flex h-36 w-full max-w-md items-center justify-center rounded-xl border border-dashed border-border bg-muted-soft/40 p-4">
                {branding?.companyLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={branding.companyLogoUrl}
                    alt="Company logo"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <p className="px-4 text-center text-sm text-muted">
                    No custom logo uploaded.
                    <span className="mt-1 block text-xs">
                      Invoices will use the platform default logo when available.
                    </span>
                  </p>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(event) => void handleUpload(event.target.files?.[0])}
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={logoBusy}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {branding?.hasLogo ? "Replace Logo" : "Upload Logo"}
                </Button>
                {branding?.hasLogo ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={logoBusy}
                    onClick={() => void handleRemoveLogo()}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            </div>

            <p className="text-xs text-muted">
              This branding will be used by all members under your account when sending invoices.
            </p>

            <Button type="submit" disabled={saving || logoBusy}>
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </form>

          <aside className="rounded-xl border border-border bg-muted-soft/30 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Preview</p>
            <div className="mt-4 flex flex-col items-center gap-3 rounded-lg border border-border bg-surface px-4 py-8 text-center">
              {previewLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewLogo}
                  alt=""
                  className="max-h-12 max-w-[160px] object-contain"
                />
              ) : (
                <div className="flex h-12 w-40 items-center justify-center rounded border border-dashed border-border text-xs text-muted">
                  Logo
                </div>
              )}
              <p className="text-sm font-semibold text-foreground">{previewName}</p>
              <p className="text-xs text-muted">Invoice #INV-0001</p>
            </div>
            <p className="mt-3 text-xs text-muted">
              Preview only — does not create an invoice.
            </p>
          </aside>
        </div>
      )}
    </section>
  );
}
