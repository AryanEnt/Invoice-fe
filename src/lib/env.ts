export function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL || "https://invoice-backend-production-5085.up.railway.app";
  return url.replace(/\/$/, "");
}

export function getTurnstileSiteKey(): string {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
}
