export function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL || "https://invoice-backend-production-1450.up.railway.app/";
  return url.replace(/\/$/, "");
}
