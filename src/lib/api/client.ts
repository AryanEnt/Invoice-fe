import { getApiBaseUrl } from "@/lib/env";
import { ApiError, type ApiResponse } from "@/lib/api/types";

export function parseApiResponse<T>(
  status: number,
  body: unknown,
): T {
  if (!isApiResponse<T>(body)) {
    throw new ApiError(
      status,
      "INVALID_RESPONSE",
      "The server returned an unexpected response.",
    );
  }

  if (!body.success) {
    throw new ApiError(
      status,
      body.error.code,
      body.error.message,
      body.error.details,
    );
  }

  return body.data;
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

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new ApiError(
      response.status,
      "INVALID_RESPONSE",
      "The server returned a non-JSON response.",
    );
  }

  return parseApiResponse<T>(response.status, body);
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
