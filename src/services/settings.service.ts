import { apiRequest } from "@/lib/api/client";

export type OrganizationSettings = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  hasLogo: boolean;
  logoUrl: string | null;
};

const ALLOWED_LOGO_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
]);

export function isAllowedLogoFile(file: File): boolean {
  return ALLOWED_LOGO_TYPES.has(file.type) && file.size > 0 && file.size <= 2 * 1024 * 1024;
}

export async function getOrganizationSettings(): Promise<OrganizationSettings> {
  const data = await apiRequest<{ organization: OrganizationSettings }>("/api/settings/organization");
  return data.organization;
}

export async function uploadOrganizationLogo(file: File): Promise<OrganizationSettings> {
  if (!isAllowedLogoFile(file)) {
    throw new Error("Use a PNG, JPG, WebP, or SVG logo up to 2MB.");
  }

  const contentType = file.type === "image/jpg" ? "image/jpeg" : file.type;
  const data = await apiRequest<{ organization: OrganizationSettings }>(
    "/api/settings/organization/logo",
    {
      method: "POST",
      headers: {
        "Content-Type": contentType,
      },
      body: file,
    },
  );

  return data.organization;
}

export async function removeOrganizationLogo(): Promise<OrganizationSettings> {
  const data = await apiRequest<{ organization: OrganizationSettings }>(
    "/api/settings/organization/logo",
    { method: "DELETE" },
  );
  return data.organization;
}

export type InvoiceAddressSettings = {
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
};

export type InvoiceSettings = {
  organizationId: string;
  organizationName: string;
  companyName: string;
  logoUrl: string | null;
  hasLogo: boolean;
  currency: string;
  language: string;
  address: InvoiceAddressSettings;
};

export type EmailTemplatePair = { subject: string; body: string };

export type EmailTemplateSettings = {
  unpaid: EmailTemplatePair;
  paid: EmailTemplatePair;
};

export async function getInvoiceSettings(): Promise<InvoiceSettings> {
  const data = await apiRequest<{ settings: InvoiceSettings }>("/api/settings/invoice");
  return data.settings;
}

export async function saveInvoiceSettings(input: {
  companyName?: string;
  currency: string;
  language: string;
  address: InvoiceAddressSettings;
}): Promise<InvoiceSettings> {
  const data = await apiRequest<{ settings: InvoiceSettings }>("/api/settings/invoice", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return data.settings;
}

export async function getEmailTemplates(): Promise<EmailTemplateSettings> {
  const data = await apiRequest<{ templates: EmailTemplateSettings }>("/api/settings/email-templates");
  return data.templates;
}

export async function saveEmailTemplates(
  input: EmailTemplateSettings,
): Promise<EmailTemplateSettings> {
  const data = await apiRequest<{ templates: EmailTemplateSettings }>("/api/settings/email-templates", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return data.templates;
}

export async function getPayPalConnectUrl(): Promise<{ url: string; redirectUri: string }> {
  return apiRequest<{ url: string; redirectUri: string }>("/api/settings/payment/paypal/connect");
}
