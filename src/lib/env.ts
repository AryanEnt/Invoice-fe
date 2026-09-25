export function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (!configured) {
    throw new Error("NEXT_PUBLIC_API_URL environment variable is not set");
  }
  return configured;
}
