export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "https://invoice-backend-production-1450.up.railway.app/";
}
