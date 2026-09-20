import { getApiBaseUrl } from "@/lib/env";
import { ApiError, type ApiResponse } from "@/lib/api/types";

export function parseApiResponse<T>(
  status: number,
  body: unknown,
  options?: { retryAfterSeconds?: number },
): T {
  if (!isApiResponse<T>(body)) {
    throw new ApiError(
      status,
      status === 413 ? "PAYLOAD_TOO_LARGE" : status === 429 ? "TOO_MANY_REQUESTS" : "INVALID_RESPONSE",
      status === 413
        ? "Request body is too large"
        : status === 429
          ? "Too many requests. Try again later."
          : "The server returned an unexpected response.",
      undefined,
      options?.retryAfterSeconds,
    );
  }

  if (!body.success) {
    throw new ApiError(
      status,
      body.error.code,
      body.error.message,
      body.error.details,
      options?.retryAfterSeconds,
    );
  }

  return body.data;
}

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) {
    return undefined;
  }
  const asInt = Number.parseInt(header, 10);
  if (Number.isFinite(asInt) && asInt >= 0) {
    return asInt;
  }
  const asDate = Date.parse(header);
  if (Number.isFinite(asDate)) {
    return Math.max(0, Math.ceil((asDate - Date.now()) / 1000));
  }
  return undefined;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body && !isBinaryBody(options.body)) {
    headers.set("Content-Type", "application/json");
  }

  // Free ngrok interstitial breaks JSON API responses unless skipped.
  if (url.includes("ngrok") && !headers.has("ngrok-skip-browser-warning")) {
    headers.set("ngrok-skip-browser-warning", "true");
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  const retryAfterSeconds = parseRetryAfter(response.headers.get("Retry-After"));
  const text = await response.text();
  let body: unknown = null;

  if (text) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      throw new ApiError(
        response.status,
        response.status === 413 ? "PAYLOAD_TOO_LARGE" : "INVALID_RESPONSE",
        response.status === 413
          ? "Request body is too large"
          : "The server returned a non-JSON response.",
        undefined,
        retryAfterSeconds,
      );
    }
  } else if (response.status === 413) {
    throw new ApiError(
      413,
      "PAYLOAD_TOO_LARGE",
      "Request body is too large",
      undefined,
      retryAfterSeconds,
    );
  } else if (response.status === 429) {
    throw new ApiError(
      429,
      "TOO_MANY_REQUESTS",
      "Too many requests. Try again later.",
      undefined,
      retryAfterSeconds,
    );
  }

  return parseApiResponse<T>(response.status, body, { retryAfterSeconds });
}

function isBinaryBody(body: BodyInit): boolean {
  return body instanceof FormData || body instanceof Blob || body instanceof ArrayBuffer;
}

function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  if (typeof value !== "object" || value === null || !("success" in value)) {
    return false;
  }

  const candidate = value as ApiResponse<T>;

  if (candidate.success === true) {
    return "data" in candidate;
  }

  return (
    candidate.success === false &&
    typeof candidate.error === "object" &&
    candidate.error !== null &&
    typeof candidate.error.code === "string" &&
    typeof candidate.error.message === "string"
  );
}
