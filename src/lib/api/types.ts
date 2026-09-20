export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export interface ErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export interface ErrorResponse {
  success: false;
  error: ErrorBody;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  readonly retryAfterSeconds?: number;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
    retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.retryAfterSeconds = retryAfterSeconds;
  }

  get isRateLimited(): boolean {
    return this.status === 429 || this.code === "TOO_MANY_REQUESTS";
  }

  get isPayloadTooLarge(): boolean {
    return this.status === 413 || this.code === "PAYLOAD_TOO_LARGE";
  }
}

/** User-facing message for common security-related API statuses. */
export function formatApiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) {
    return fallback;
  }
  if (error.isRateLimited) {
    const wait = error.retryAfterSeconds;
    return wait && wait > 0
      ? `Too many requests. Please wait about ${wait} seconds and try again.`
      : error.message || "Too many requests. Please try again later.";
  }
  if (error.isPayloadTooLarge) {
    return "That request was too large. Try a smaller file or less data.";
  }
  if (error.status === 401) {
    return error.message || "Please sign in again.";
  }
  if (error.status === 403) {
    return error.message || "You do not have permission to do that.";
  }
  return error.message || fallback;
}
