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

export type AdminBrandingSettings = {
  companyName: string | null;
  companyLogoUrl: string | null;
  hasLogo: boolean;
  hasCustomBranding: boolean;
  platformCompanyName: string;
  platformLogoUrl: string | null;
};

export async function getAdminBranding(): Promise<AdminBrandingSettings> {
  const data = await apiRequest<{ branding: AdminBrandingSettings }>("/api/settings/branding");
  return data.branding;
}

export async function saveAdminBranding(input: {
  companyName?: string | null;
}): Promise<AdminBrandingSettings> {
  const data = await apiRequest<{ branding: AdminBrandingSettings }>("/api/settings/branding", {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return data.branding;
}

export async function uploadAdminBrandingLogo(file: File): Promise<AdminBrandingSettings> {
  if (!isAllowedLogoFile(file)) {
    throw new Error("Use a PNG, JPG, WebP, or SVG logo up to 2MB.");
  }

  const contentType = file.type === "image/jpg" ? "image/jpeg" : file.type;
  const data = await apiRequest<{ branding: AdminBrandingSettings }>("/api/settings/branding/logo", {
    method: "POST",
    headers: {
      "Content-Type": contentType,
    },
    body: file,
  });

  return data.branding;
}

export async function removeAdminBrandingLogo(): Promise<AdminBrandingSettings> {
  const data = await apiRequest<{ branding: AdminBrandingSettings }>("/api/settings/branding/logo", {
    method: "DELETE",
  });
  return data.branding;
}

export type PayPalGatewayStatus = {
  connected: boolean;
  configured: boolean;
  mode: "identity";
  architecture: "single_company";
  environment: "sandbox" | "production";
  account: string | null;
  connectedAt: string | null;
  lastVerifiedAt: string | null;
  redirectUri: string | null;
};

export async function getPayPalGatewayStatus(): Promise<PayPalGatewayStatus> {
  return apiRequest<PayPalGatewayStatus>("/api/settings/payment/paypal");
}

export async function startPayPalConnect(): Promise<{
  mode: "identity";
  connected: false;
  url: string;
  environment: "sandbox" | "live";
  redirectUri: string;
}> {
  return apiRequest("/api/settings/payment/paypal/connect", { method: "POST" });
}

export async function testPayPalGateway(): Promise<{
  connected: boolean;
  environment: "sandbox" | "live";
  verifiedAt?: string;
  message?: string;
}> {
  return apiRequest("/api/settings/payment/paypal/test", { method: "POST" });
}

export async function disconnectPayPalGateway(): Promise<PayPalGatewayStatus> {
  return apiRequest("/api/settings/payment/paypal/disconnect", { method: "POST" });
}

export type StripeGatewayStatus = {
  connected: boolean;
  configured: boolean;
  webhookConfigured: boolean;
  mode: "connect_oauth";
  architecture: "single_company";
  environment: "test" | "live";
  account: string | null;
  accountId: string | null;
  connectedAt: string | null;
  lastVerifiedAt: string | null;
  redirectUri: string | null;
  needsAttention: boolean;
};

export async function getStripeGatewayStatus(): Promise<StripeGatewayStatus> {
  return apiRequest<StripeGatewayStatus>("/api/settings/payment/stripe");
}

export async function startStripeConnect(): Promise<{
  mode: "connect_oauth";
  connected: false;
  url: string;
  environment: "test" | "live";
  redirectUri: string;
}> {
  return apiRequest("/api/settings/payment/stripe/connect", { method: "POST" });
}

export async function testStripeGateway(): Promise<{
  connected: boolean;
  environment: "test" | "live";
  verifiedAt?: string;
  message?: string;
}> {
  return apiRequest("/api/settings/payment/stripe/test", { method: "POST" });
}

export async function disconnectStripeGateway(): Promise<StripeGatewayStatus> {
  return apiRequest("/api/settings/payment/stripe/disconnect", { method: "POST" });
}

