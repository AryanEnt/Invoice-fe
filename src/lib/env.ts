function requiredHttpUrl(name: string, value: string | undefined): string {
  const normalized = value?.trim();
  if (!normalized) {
    throw new Error(
      `Missing ${name}. Set it in .env.local for local development or as a GitHub Actions secret for production.`,
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error(`${name} must be a valid absolute URL.`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`${name} must use http:// or https://.`);
  }

  return normalized.replace(/\/+$/, "");
}

const apiBaseUrl = requiredHttpUrl(
  "NEXT_PUBLIC_API_URL",
  process.env.NEXT_PUBLIC_API_URL,
);

export function getApiBaseUrl(): string {
  return apiBaseUrl;
}

export function getTurnstileSiteKey(): string {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
}
