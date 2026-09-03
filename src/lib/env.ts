export function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
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
