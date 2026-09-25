export function getApiBaseUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://invoice-backend-production-1450.up.railway.app"
      : "http://localhost:4000");
  if (typeof window === "undefined") {
    return configured;
  }

  try {
    const url = new URL(configured);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      url.hostname = window.location.hostname;
    }
    return url.origin;
  } catch {
    return configured;
  }
}
